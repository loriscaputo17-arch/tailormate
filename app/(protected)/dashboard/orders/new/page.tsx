"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/* =====================================================
   TYPES
===================================================== */

type Step = "upload" | "processing" | "review" | "saving" | "done";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  path?: string;
  preview?: string;
}

interface OrderAiResult {
  fileName: string;
  rawText: string;
  structured: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    order_items?: { garment: string; quantity?: number }[];
    measurements?: Record<string, any>;
    notes?: string[];
  };
}

/* =====================================================
   PAGE
===================================================== */

export default function NewOrderImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<OrderAiResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* =====================================================
     FILE HANDLING
  ===================================================== */

  function handleFiles(input: FileList | null) {
    if (!input) return;

    const next: UploadedFile[] = Array.from(input).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  /* =====================================================
     UPLOAD + AI
  ===================================================== */

  async function runAi() {
    try {
      setError(null);
      setStep("processing");

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.access_token) {
        throw new Error("No active session");
      }

      const uploaded: UploadedFile[] = await Promise.all(
        files.map(async (f) => {
          const path = `orders-intake/${crypto.randomUUID()}-${f.name}`;

          const { error } = await supabase.storage
            .from("customers")
            .upload(path, f.file, { upsert: false });

          if (error) throw error;

          return { ...f, path };
        })
      );

      setFiles(uploaded);

      const res = await fetch(
        "https://miitmryvmrbdhqvftlio.supabase.co/functions/v1/customers-parse",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            files: uploaded.map((f) => f.path),
          }),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Edge function failed");
      }

      const json = await res.json();

      setResults(json.results ?? []);
      setStep("review");
    } catch (err: any) {
      console.error("runAi error:", err);
      setError(err?.message || "Processing failed");
      setStep("upload");
    }
  }

  /* =====================================================
     SAVE TO DATABASE
  ===================================================== */

  async function saveAll() {
    try {
      setStep("saving");
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      for (const r of results) {
        const s = r.structured;
        if (!s.full_name) continue;

        // -------------------------------------------------
        // 1️⃣ FIND OR CREATE CLIENT
        // -------------------------------------------------

        let clientId: string | null = null;

        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .eq("tailor_id", user.id)
          .ilike("full_name", s.full_name)
          .maybeSingle();

        if (existing?.id) {
          clientId = existing.id;
        } else {
          const { data: created, error: createErr } = await supabase
            .from("clients")
            .insert({
              tailor_id: user.id,
              full_name: s.full_name,
              email: s.email,
              phone: s.phone,
            })
            .select("id")
            .single();

          if (createErr) throw createErr;
          clientId = created.id;
        }

        if (!clientId) continue;

        // -------------------------------------------------
        // 2️⃣ CREATE ORDER
        // -------------------------------------------------

        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            tailor_id: user.id,
            client_id: clientId,
            order_number: orderNumber,
            status: "draft",
            notes: r.rawText || null,
          })
          .select("id")
          .single();

        if (orderErr) throw orderErr;

        // -------------------------------------------------
        // 3️⃣ ORDER ITEMS (🔥 IMPORTANT)
        // -------------------------------------------------

        if (s.order_items?.length) {
          const items = s.order_items.map((it) => ({
            order_id: order.id,
            garment: it.garment,
            quantity: it.quantity || 1,
          }));

          await supabase.from("order_items").insert(items);
        }

        // -------------------------------------------------
        // 4️⃣ MEASUREMENTS SESSION
        // -------------------------------------------------

        const { data: m, error: mErr } = await supabase
          .from("client_measurements")
          .insert({
            tailor_id: user.id,
            client_id: clientId,
            raw_text: r.rawText,
            structured_data: s.measurements,
          })
          .select("id")
          .single();

        if (mErr) throw mErr;

        // -------------------------------------------------
        // 5️⃣ NOTES
        // -------------------------------------------------

        if (s.notes?.length) {
          await supabase.from("client_notes").insert({
            tailor_id: user.id,
            client_id: clientId,
            raw_text: r.rawText || "",
            notes: s.notes,
            source: "ai",
          });
        }

        // -------------------------------------------------
        // 6️⃣ GRANULAR MEASUREMENTS
        // -------------------------------------------------

        const flat: any[] = [];

        if (s.measurements) {
          for (const [garment, values] of Object.entries(s.measurements)) {
            if (!values || typeof values !== "object") continue;

            for (const [key, value] of Object.entries(values)) {
              flat.push({
                measurement_id: m.id,
                garment,
                key,
                value:
                  parseFloat(String(value).replace(/[^0-9.]/g, "")) ||
                  null,
                unit: "cm",
              });
            }
          }
        }

        if (flat.length > 0) {
          await supabase.from("client_measurement_values").insert(flat);
        }
      }

      setStep("done");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Save failed");
      setStep("review");
    }
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-6 max-w-6xl">
      <Header />

      {error && <div className="text-red-400 text-sm">{error}</div>}

      {step === "upload" && (
        <UploadStep
          files={files}
          onFiles={handleFiles}
          onRemove={removeFile}
          onNext={runAi}
        />
      )}

      {step === "processing" && <ProcessingStep />}

      {step === "review" && (
        <ReviewStep
          results={results}
          setResults={setResults}
          onSave={saveAll}
        />
      )}

      {step === "saving" && <ProcessingStep label="Saving order…" />}

      {step === "done" && (
        <div className="space-y-4">
          <div className="text-green-400">Order imported.</div>

          <button
            onClick={() => {
              setStep("upload");
              setFiles([]);
              setResults([]);
              setError(null);
            }}
            className="cursor-pointer px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:opacity-90"
          >
            Import another order
          </button>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   SUB COMPONENTS
===================================================== */

function Header() {
    const router = useRouter();

  return (
    <div>
    <button
        onClick={() => router.push("/dashboard/orders")}
        className="text-sm text-black bg-white rounded-full py-3 px-6  transition"
      >
        Back to orders
      </button>
      <h1 className="text-3xl mt-4 font-light tracking-tight">
        Import order documents
      </h1>
      <p className="text-white/50 mt-1">
        Upload order forms and extract garments automatically.
      </p>
    </div>
  );
}

function UploadStep({ files, onFiles, onRemove, onNext }: any) {
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">

        <label className="mb-8 block cursor-pointer text-center py-4 mt-4 border border-dashed border-white/20 rounded-xl hover:bg-white/[0.04] transition">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              onFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />

          <div className="text-sm text-white/60">
            Take photo with camera
          </div>
        </label>

        <label className="block cursor-pointer text-center py-10 border border-dashed border-white/20 rounded-xl hover:bg-white/[0.04] transition">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <div className="text-sm text-white/60">
            Click to upload images or PDFs
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file: UploadedFile) => (
            <div
              key={file.id}
              className="relative rounded-xl bg-black/40 border border-white/10 p-3 text-xs"
            >
              {file.preview ? (
                <img src={file.preview} className="rounded-md mb-2" />
              ) : (
                <div className="h-24 flex items-center justify-center text-white/30">
                  PDF
                </div>
              )}

              <div className="truncate text-white/70">{file.name}</div>

              <button
                onClick={() => onRemove(file.id)}
                className="absolute top-2 right-2 text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          disabled={files.length === 0}
          onClick={onNext}
          className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
        >
          Analyze documents
        </button>
      </div>
    </>
  );
}

function ProcessingStep({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="animate-pulse text-white/60 mb-4">
        {label || "Reading documents…"}
      </div>
      <div className="text-xs text-white/30">This may take a few seconds</div>
    </div>
  );
}

function ReviewStep({ results, onSave }: any) {
  return (
    <>
      <div className="space-y-6">
        {results.map((r: OrderAiResult, i: number) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm"
          >
            <div className="text-white/60">{r.fileName}</div>
            <div className="text-white/30 mt-2 line-clamp-3">
              {r.rawText}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={onSave}
          className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium"
        >
          Save orders
        </button>
      </div>
    </>
  );
}
