"use client";

import { useState } from "react";

type Step = "upload" | "processing" | "review";

interface UploadedFile {
  id: string;
  name: string;
  preview?: string;
}

interface AiResult {
  fileName: string;
  rawText: string;
  structured: {
    measurements?: Record<string, string>;
    notes?: string[];
  };
}

export default function NewNotePage() {
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<AiResult[]>([]);

  function handleFiles(input: FileList | null) {
    if (!input) return;

    const next = Array.from(input).map((file) => ({
      id: crypto.randomUUID(),
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

  async function runAi() {
    setStep("processing");

    setTimeout(() => {
      setResults(
        files.map((f) => ({
          fileName: f.name,
          rawText:
            "Chest 108cm, shoulders natural. Right shoulder slightly lower.",
          structured: {
            measurements: {
              chest: "108cm",
              shoulders: "natural",
            },
            notes: ["Right shoulder slightly lower"],
          },
        }))
      );

      setStep("review");
    }, 2000);
  }

  function saveNotes() {
    console.log("Saving:", results);
  }

  return (
    <div className="space-y-6 max-w-6xl">

      <div>
        <h1 className="text-3xl font-light tracking-tight">
          New notes
        </h1>
        <p className="text-white/50 mt-1">
          Upload handwritten notes and let the system organize them.
        </p>
      </div>

      <div className="flex gap-4 text-xs text-white/40">
        <StepLabel active={step === "upload"}>Upload</StepLabel>
        <StepLabel active={step === "processing"}>Processing</StepLabel>
        <StepLabel active={step === "review"}>Review</StepLabel>
      </div>

      {step === "upload" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <label className="block cursor-pointer text-center py-10 border border-dashed border-white/20 rounded-xl hover:bg-white/[0.04] transition">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="text-sm text-white/60">
                Click to upload images or PDFs
              </div>
              <div className="text-xs text-white/30 mt-1">
                Multiple files supported
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="relative rounded-xl bg-black/40 border border-white/10 p-3 text-xs"
                >
                  {file.preview ? (
                    <img
                      src={file.preview}
                      className="rounded-md mb-2"
                    />
                  ) : (
                    <div className="h-24 flex items-center justify-center text-white/30">
                      PDF
                    </div>
                  )}

                  <div className="truncate text-white/70">
                    {file.name}
                  </div>

                  <button
                    onClick={() => removeFile(file.id)}
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
              onClick={runAi}
              className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              Analyze notes
            </button>
          </div>
        </>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-pulse text-white/60 mb-4">
            Reading handwritten notes…
          </div>
          <div className="text-xs text-white/30">
            This may take a few seconds
          </div>
        </div>
      )}

      {step === "review" && (
        <>
            <div className="space-y-6">
            {results.map((r, idx) => (
                <ReviewCard key={idx} result={r} />
            ))}
            </div>

            <div className="flex justify-end pt-6">
            <button
                onClick={saveNotes}
                className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium"
            >
                Save to archive
            </button>
            </div>
        </>
        )}

    </div>
  );
}

function StepLabel({
  children,
  active,
}: {
  children: string;
  active?: boolean;
}) {
  return (
    <span
      className={`px-3 py-2 rounded-full ${
        active
          ? "bg-white/10 text-white"
          : "bg-white/5"
      }`}
    >
      {children}
    </span>
  );
}

function ReviewCard({
  result,
}: {
  result: {
    fileName: string;
    rawText: string;
    structured: {
      measurements?: Record<string, string>;
      notes?: string[];
    };
  };
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-light">
            {result.fileName}
          </div>
          <div className="text-xs text-white/40">
            Handwritten note
          </div>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/60">
          AI Parsed
        </span>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-xs text-white/50 hover:text-white transition">
          View extracted text
        </summary>
        <p className="mt-3 text-sm text-white/60 leading-relaxed max-w-3xl">
          {result.rawText}
        </p>
      </details>

      <div className="grid md:grid-cols-2 gap-6">

        {result.structured.measurements && (
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-3">
              Measurements
            </div>
            <div className="rounded-xl bg-black/40 border border-white/10 divide-y divide-white/10">
              {Object.entries(result.structured.measurements).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between px-4 py-2 text-sm"
                  >
                    <span className="text-white/40 capitalize">
                      {key}
                    </span>
                    <span className="text-white">
                      {value}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {result.structured.notes && (
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-3">
              Fit notes
            </div>
            <ul className="space-y-2">
              {result.structured.notes.map((n, i) => (
                <li
                  key={i}
                  className="text-sm text-white/60 bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                >
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
