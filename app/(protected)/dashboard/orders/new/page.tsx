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
  const [step, setStep]       = useState<Step>("upload");
  const [files, setFiles]     = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<OrderAiResult[]>([]);
  const [error, setError]     = useState<string | null>(null);

  function handleFiles(input: FileList | null) {
    if (!input) return;
    const next: UploadedFile[] = Array.from(input).map(file => ({
      id: crypto.randomUUID(), file, name: file.name,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setFiles(prev => [...prev, ...next]);
  }

  function removeFile(id: string) { setFiles(prev => prev.filter(f => f.id !== id)); }

  async function runAi() {
    try {
      setError(null); setStep("processing");
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.access_token) throw new Error("No active session");

      const uploaded: UploadedFile[] = await Promise.all(
        files.map(async f => {
          const path = `orders-intake/${crypto.randomUUID()}-${f.name}`;
          const { error } = await supabase.storage.from("customers").upload(path, f.file, { upsert: false });
          if (error) throw error;
          return { ...f, path };
        })
      );
      setFiles(uploaded);

      const res = await fetch("https://miitmryvmrbdhqvftlio.supabase.co/functions/v1/customers-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        body: JSON.stringify({ files: uploaded.map(f => f.path) }),
      });

      if (!res.ok) { const txt = await res.text(); throw new Error(txt || "Edge function failed"); }

      const json = await res.json();
      setResults(json.results ?? []);
      setStep("review");
    } catch (err: any) {
      console.error("runAi error:", err);
      setError(err?.message || "Processing failed");
      setStep("upload");
    }
  }

  async function saveAll() {
    try {
      setStep("saving"); setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const r of results) {
        const s = r.structured;
        if (!s.full_name) continue;

        let clientId: string | null = null;
        const { data: existing } = await supabase.from("clients").select("id").eq("tailor_id", user.id).ilike("full_name", s.full_name).maybeSingle();

        if (existing?.id) {
          clientId = existing.id;
        } else {
          const { data: created, error: createErr } = await supabase.from("clients").insert({ tailor_id: user.id, full_name: s.full_name, email: s.email, phone: s.phone }).select("id").single();
          if (createErr) throw createErr;
          clientId = created.id;
        }
        if (!clientId) continue;

        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        const { data: order, error: orderErr } = await supabase.from("orders").insert({ tailor_id: user.id, client_id: clientId, order_number: orderNumber, status: "draft", notes: r.rawText || null }).select("id").single();
        if (orderErr) throw orderErr;

        const orderFiles = files.filter(f => f.path).map(f => ({ order_id: order.id, storage_path: f.path, original_name: f.name }));
        if (orderFiles.length) await supabase.from("order_files").insert(orderFiles);

        if (s.order_items?.length) {
          await supabase.from("order_items").insert(s.order_items.map(it => ({ order_id: order.id, garment: it.garment, quantity: it.quantity || 1 })));
        }

        const { data: m, error: mErr } = await supabase.from("client_measurements").insert({ tailor_id: user.id, client_id: clientId, raw_text: r.rawText, structured_data: s.measurements }).select("id").single();
        if (mErr) throw mErr;

        if (s.notes?.length) {
          await supabase.from("client_notes").insert({ tailor_id: user.id, client_id: clientId, raw_text: r.rawText || "", notes: s.notes, source: "ai" });
        }

        const flat: any[] = [];
        if (s.measurements) {
          for (const [garment, values] of Object.entries(s.measurements)) {
            if (!values || typeof values !== "object") continue;
            for (const [key, value] of Object.entries(values)) {
              flat.push({ measurement_id: m.id, garment, key, value: parseFloat(String(value).replace(/[^0-9.]/g, "")) || null, unit: "cm" });
            }
          }
        }
        if (flat.length > 0) await supabase.from("client_measurement_values").insert(flat);
      }

      setStep("done");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Save failed");
      setStep("review");
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin-slow{to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp 0.5s ease forwards;opacity:0}
        .d1{animation-delay:0.04s}.d2{animation-delay:0.10s}.d3{animation-delay:0.16s}
        .gold{color:#c9a96e}
        .gold-line{background:linear-gradient(90deg,#c9a96e,transparent)}
        .upload-zone:hover{background:rgba(255,255,255,0.025);border-color:rgba(201,169,110,0.3)}
        .spin-slow{animation:spin-slow 2s linear infinite}
      `}</style>

      <div className="max-w-5xl space-y-10 pb-20">

        {/* ── HEADER ── */}
        <div className="fade-up d1 flex items-end justify-between border-b border-white/8 pb-8">
          <div>
            <BackButton />
            <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase mb-3 mt-6">New Order</p>
            <h1 className="text-4xl font-light tracking-tight text-white leading-none">Import Documents</h1>
            <p className="text-sm text-white/35 mt-3">Upload order forms and extract garments automatically.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 pb-1">
            {(["upload","review","done"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] tracking-wider transition-all duration-300 ${
                  step === s || (step === "processing" && s === "upload") || (step === "saving" && s === "review")
                    ? "bg-[#c9a96e] text-black font-medium"
                    : (i === 0 && ["review","saving","done"].includes(step)) || (i === 1 && step === "done")
                    ? "bg-white/15 text-white/50"
                    : "bg-white/6 text-white/25"
                }`}>{i + 1}</div>
                {i < 2 && <div className="w-8 h-px bg-white/10" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="fade-up rounded-xl border border-red-500/30 bg-red-500/8 px-5 py-4 text-sm text-red-400">
            ⚠ {error}
          </div>
        )}

        {/* ── STEPS ── */}
        {step === "upload"     && <UploadStep files={files} onFiles={handleFiles} onRemove={removeFile} onNext={runAi} />}
        {step === "processing" && <ProcessingStep />}
        {step === "review"     && <ReviewStep results={results} setResults={setResults} onSave={saveAll} />}
        {step === "saving"     && <ProcessingStep label="Saving order to archive…" />}
        {step === "done"       && <DoneStep onReset={() => { setStep("upload"); setFiles([]); setResults([]); setError(null); }} />}
      </div>
    </>
  );
}

/* =====================================================
   BACK BUTTON
===================================================== */

function BackButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.push("/dashboard/orders")}
      className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-white/35 hover:text-white/70 transition-colors">
      ← Back to orders
    </button>
  );
}

/* =====================================================
   UPLOAD STEP
===================================================== */

function UploadStep({ files, onFiles, onRemove, onNext }: any) {
  return (
    <div className="space-y-6 fade-up d2">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="upload-zone cursor-pointer flex flex-col items-center justify-center gap-3 py-10 border border-dashed border-white/15 rounded-2xl transition-all duration-200">
          <input type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { onFiles(e.target.files); e.currentTarget.value = ""; }} />
          <div className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-xl text-white/40">📷</div>
          <div className="text-center">
            <div className="text-sm text-white/60">Take a photo</div>
            <div className="text-xs text-white/25 mt-1">Use your camera directly</div>
          </div>
        </label>

        <label className="upload-zone cursor-pointer flex flex-col items-center justify-center gap-3 py-10 border border-dashed border-white/15 rounded-2xl transition-all duration-200">
          <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => onFiles(e.target.files)} />
          <div className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-xl text-white/40">📁</div>
          <div className="text-center">
            <div className="text-sm text-white/60">Upload files</div>
            <div className="text-xs text-white/25 mt-1">Images or PDF documents</div>
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{files.length} file{files.length !== 1 ? "s" : ""} selected</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {files.map((file: UploadedFile) => (
              <div key={file.id} className="relative group rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
                {file.preview
                  ? <img src={file.preview} className="w-full h-28 object-cover" />
                  : <div className="h-28 flex items-center justify-center text-white/25 text-xs uppercase tracking-widest">PDF</div>
                }
                <div className="px-3 py-2">
                  <div className="truncate text-[11px] text-white/50">{file.name}</div>
                </div>
                <button onClick={() => onRemove(file.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white/60 hover:text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button disabled={files.length === 0} onClick={onNext}
          className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-30 hover:opacity-90 transition-opacity">
          Analyze Documents →
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   PROCESSING STEP
===================================================== */

function ProcessingStep({ label }: { label?: string }) {
  return (
    <div className="fade-up flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-12 h-12 rounded-full border border-[#c9a96e]/30 border-t-[#c9a96e] spin-slow" />
      <div className="text-center">
        <div className="text-sm text-white/60">{label || "Reading documents…"}</div>
        <div className="text-[11px] text-white/25 mt-2 tracking-widest uppercase">This may take a few seconds</div>
      </div>
    </div>
  );
}

/* =====================================================
   REVIEW STEP
===================================================== */

function ReviewStep({ results, setResults, onSave }: any) {
  function update(idx: number, next: OrderAiResult) {
    const copy = [...results]; copy[idx] = next; setResults(copy);
  }

  return (
    <div className="space-y-8 fade-up d2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Step 2 of 3</p>
          <h2 className="text-xl font-light text-white">Review extracted data</h2>
        </div>
        <button onClick={onSave}
          className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium hover:opacity-90 transition-opacity">
          Save Orders →
        </button>
      </div>

      <div className="space-y-5">
        {results.map((r: OrderAiResult, i: number) => (
          <OrderReviewCard key={i} result={r} onChange={(next: any) => update(i, next)} />
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-white/8">
        <button onClick={onSave}
          className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium hover:opacity-90 transition-opacity">
          Save Orders →
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   DONE STEP
===================================================== */

function DoneStep({ onReset }: { onReset: () => void }) {
  const router = useRouter();
  return (
    <div className="fade-up flex flex-col items-center justify-center py-24 gap-8 text-center">
      <div className="w-16 h-16 rounded-full border border-[#c9a96e]/40 bg-[#c9a96e]/10 flex items-center justify-center text-2xl gold">
        ✓
      </div>
      <div>
        <h2 className="text-2xl font-light text-white mb-2">Order imported</h2>
        <p className="text-sm text-white/40">The order has been added to your archive.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => router.push("/dashboard/orders")}
          className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:opacity-90 transition-opacity">
          View Orders
        </button>
        <button onClick={onReset}
          className="px-6 py-3 rounded-full border border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e]/10 text-sm transition-colors">
          Import Another
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   ORDER REVIEW CARD
===================================================== */

function OrderReviewCard({ result, onChange }: any) {
  const s = result.structured;
  const [rawOpen, setRawOpen] = useState(false);

  function updateStructured(patch: any) {
    onChange({ ...result, structured: { ...s, ...patch } });
  }

  function updateItem(idx: number, field: string, value: any) {
    const next = [...(s.order_items || [])]; next[idx] = { ...next[idx], [field]: value };
    updateStructured({ order_items: next });
  }

  function addItem() { updateStructured({ order_items: [...(s.order_items || []), { garment: "", quantity: 1 }] }); }

  function removeItem(idx: number) {
    const next = [...(s.order_items || [])]; next.splice(idx, 1);
    updateStructured({ order_items: next });
  }

  function updateNote(idx: number, value: string) {
    const next = [...(s.notes || [])]; next[idx] = value;
    updateStructured({ notes: next });
  }

  function updateMeasurement(garment: string, key: string, value: string) {
    updateStructured({ measurements: { ...s.measurements, [garment]: { ...(s.measurements?.[garment] || {}), [key]: value } } });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.015] overflow-hidden">

      {/* Card header */}
      <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#c9a96e]/70" />
          <span className="text-xs text-white/40 tracking-wider">{result.fileName}</span>
        </div>
        {s.full_name && <span className="text-sm font-light text-white">{s.full_name}</span>}
      </div>

      <div className="p-6 space-y-7">

        {/* Client fields */}
        <div className="grid md:grid-cols-3 gap-4">
          <ReviewField label="Full Name" value={s.full_name ?? ""} onChange={(v: string) => updateStructured({ full_name: v })} />
          <ReviewField label="Email"     value={s.email ?? ""}     onChange={(v: string) => updateStructured({ email: v })} />
          <ReviewField label="Phone"     value={s.phone ?? ""}     onChange={(v: string) => updateStructured({ phone: v })} />
        </div>

        {/* Order items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Order Items</SectionLabel>
            <button onClick={addItem}
              className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors">
              + Add Item
            </button>
          </div>

          {(!s.order_items || s.order_items.length === 0) ? (
            <div className="text-xs text-white/25 tracking-widest uppercase py-3 text-center border border-dashed border-white/8 rounded-xl">
              No items detected — add manually
            </div>
          ) : (
            <div className="space-y-2">
              {s.order_items.map((it: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input value={it.garment ?? ""} onChange={e => updateItem(i, "garment", e.target.value)}
                      placeholder="Garment description"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 transition-colors placeholder:text-white/20" />
                  </div>
                  <div className="w-20">
                    <input type="number" value={it.quantity ?? 1} onChange={e => updateItem(i, "quantity", Number(e.target.value))}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
                  </div>
                  <button onClick={() => removeItem(i)}
                    className="w-7 h-7 rounded-full bg-white/6 hover:bg-red-500/15 text-white/40 hover:text-red-400 flex items-center justify-center text-xs transition-colors flex-shrink-0">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {s.notes?.length > 0 && (
          <div>
            <SectionLabel>Notes Detected</SectionLabel>
            <div className="space-y-2">
              {s.notes.map((note: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[#c9a96e]/40 mt-2.5 text-xs flex-shrink-0">—</span>
                  <input value={note} onChange={e => updateNote(i, e.target.value)}
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Measurements */}
        {s.measurements && Object.keys(s.measurements).length > 0 && (
          <div>
            <SectionLabel>Measurements Detected</SectionLabel>
            <div className="rounded-xl border border-white/8 overflow-hidden">
              {Object.entries(s.measurements).map(([section, values]: any, si) => (
                <div key={section} className={si > 0 ? "border-t border-white/8" : ""}>
                  <div className="px-4 py-2 bg-white/[0.02] text-[10px] uppercase tracking-[0.18em] text-white/35">
                    {section.replaceAll("_", " ")}
                  </div>
                  {typeof values === "object" && Object.entries(values).map(([k, v]: any) => (
                    <div key={k} className="flex items-center justify-between px-5 py-2.5 border-t border-white/5">
                      <span className="text-sm text-white/45 capitalize">{k}</span>
                      <input value={String(v)} onChange={e => updateMeasurement(section, k, e.target.value)}
                        className="w-24 text-right bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw text toggle */}
        <div>
          <button onClick={() => setRawOpen(o => !o)}
            className="text-[10px] uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors">
            {rawOpen ? "↑ Hide raw transcript" : "↓ Show raw transcript"}
          </button>
          {rawOpen && (
            <textarea value={result.rawText ?? ""} onChange={e => onChange({ ...result, rawText: e.target.value })} rows={5}
              className="mt-3 w-full rounded-xl bg-white/[0.02] border border-white/8 px-4 py-3 text-xs text-white/50 focus:outline-none focus:border-white/20 resize-none transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function ReviewField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="—"
        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 hover:border-white/20 transition-colors placeholder:text-white/20" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{children}</div>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}