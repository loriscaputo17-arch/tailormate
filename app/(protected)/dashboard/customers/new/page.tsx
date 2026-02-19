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

interface ClientAiResult {
  fileName: string;
  rawText: string;
  structured: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    measurements?: Record<string, string>;
    notes?: string[];
  };
}

/* =====================================================
   PAGE
===================================================== */

export default function NewClientImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<ClientAiResult[]>([]);
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

      // 🔐 session
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.access_token) {
        throw new Error("No active session");
      }

      // 📤 upload in parallelo (molto più veloce)
      const uploaded: UploadedFile[] = await Promise.all(
        files.map(async (f) => {
          const path = `client-intake/${crypto.randomUUID()}-${f.name}`;

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

      console.log(user.id)

      for (const r of results) {
        const s = r.structured;

        if (!s.full_name) continue;

        // 1️⃣ find existing client
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
          // 2️⃣ create client
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

        // 3️⃣ save measurement session
        if (clientId) {
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

          if (s.notes?.length && clientId) {
            const { error: notesErr } = await supabase
              .from("client_notes")
              .insert({
                tailor_id: user.id,
                client_id: clientId,
                raw_text: r.rawText || "",
                notes: s.notes,
                source: "ai",
              });

            if (notesErr) throw notesErr;
          }
          
          const flatMeasurements: any[] = [];

         if (s.measurements) {
          for (const [garment, values] of Object.entries(s.measurements)) {
            if (!values || typeof values !== "object") continue;

            for (const [key, value] of Object.entries(values)) {
              flatMeasurements.push({
                measurement_id: m.id,
                garment,
                key,
                value:
                  parseFloat(String(value).replace(/[^0-9.]/g, "")) || null,
                unit: "cm",
              });
            }
          }
        }

        if (flatMeasurements.length > 0) {
          await supabase.from("client_measurement_values").insert(flatMeasurements);
        }
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

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

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
        <ReviewStep results={results} setResults={setResults} onSave={saveAll} />
      )}

      {step === "saving" && <ProcessingStep label="Saving clients…" />}

      {step === "done" && (
        <div className="space-y-4">
          <div className="text-green-400">Import completed.</div>

          <button
            onClick={() => {
              setStep("upload");
              setFiles([]);
              setResults([]);
              setError(null);
            }}
            className="cursor-pointer px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:opacity-90"
          >
            Import another client
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
        onClick={() => router.push("/dashboard/customers")}
        className="text-sm text-black bg-white rounded-full py-3 px-6  transition"
      >
        Back to customers
      </button>
      <h1 className="text-3xl mt-4 font-light tracking-tight">
        Import client documents
      </h1>
      <p className="text-white/50 mt-1">
        Upload PDFs or images and extract client data automatically.
      </p>
    </div>
  );
}

function UploadStep({ files, onFiles, onRemove, onNext }: any) {
  return (
    <>
     <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        {/* 📷 CAMERA */}
        <label className="mb-8 block cursor-pointer text-center py-4 border border-dashed border-white/20 rounded-xl hover:bg-white/[0.04] transition">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              onFiles(e.target.files);
              e.currentTarget.value = ""; // 🔥 permette scatti multipli
            }}
          />
          <div className="text-sm text-white/60">
            Take photo with camera
          </div>
        </label>

        {/* 📁 UPLOAD NORMALE */}
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

function ReviewStep({ results, setResults, onSave }: any) {
  function update(idx: number, next: ClientAiResult) {
    const copy = [...results];
    copy[idx] = next;
    setResults(copy);
  }

  return (
    <>
      <div className="space-y-6">
        {results.map((r: ClientAiResult, i: number) => (
          <ClientReviewCard
            key={i}
            result={r}
            onChange={(next:any) => update(i, next)}
          />
        ))}
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={onSave}
          className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium"
        >
          Save clients
        </button>
      </div>
    </>
  );
}

function ClientReviewCard({ result, onChange }: any) {
  const s = result.structured;

  function setField(field: string, value: string) {
    onChange({
      ...result,
      structured: { ...s, [field]: value },
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
      <div className="text-sm font-light">{result.fileName}</div>

      <div className="grid md:grid-cols-3 gap-4">
        <FieldInline
          label="Full name"
          value={s.full_name ?? ""}
          onChange={(v:any) => setField("full_name", v)}
        />

        <FieldInline
          label="Email"
          value={s.email ?? ""}
          onChange={(v:any) => setField("email", v)}
        />

        <FieldInline
          label="Phone"
          value={s.phone ?? ""}
          onChange={(v:any) => setField("phone", v)}
        />
      </div>

      {s.measurements && (
        <div>
          <div className="text-xs uppercase tracking-widest text-white/40 mb-3">
            Measurements detected
          </div>

          <div className="rounded-xl bg-black/40 border border-white/10 divide-y divide-white/10">
            {Object.entries(s.measurements).map(([section, values]) => {
              if (!values || typeof values !== "object") return null;

              return (
                <div key={section} className="border-t border-white/10">
                  <div className="px-4 py-2 text-xs uppercase text-white/40">
                    {section.replaceAll("_", " ")}
                  </div>

                  {Object.entries(values).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between px-6 py-2 text-sm"
                    >
                      <span className="text-white/40 capitalize">{k}</span>
                      <span className="text-white">{String(v)}</span>
                    </div>
                  ))}
                </div>
              );
            })}

          </div>
        </div>
      )}
    </div>
  );
}

function FieldInline({ label, value, onChange }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
