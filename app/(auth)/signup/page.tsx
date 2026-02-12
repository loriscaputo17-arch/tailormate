"use client";

import { useState } from "react";
import StepField from "@/components/signup/StepField";
import AccessGate from "@/components/signup/AccessGate";

export default function SignupPage() {
  const [stage, setStage] = useState<"gate" | "form">("gate");
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    email: "",
    name: "",
    city: "",
  });

  const steps = [
    {
      label: "Email",
      placeholder: "you@atelier.com",
      value: form.email,
      onChange: (v: string) =>
        setForm((f) => ({ ...f, email: v })),
      type: "email",
    },
    {
      label: "Full name",
      placeholder: "Mario Rossi",
      value: form.name,
      onChange: (v: string) =>
        setForm((f) => ({ ...f, name: v })),
      type: "text",
    },
    {
      label: "City",
      placeholder: "Milano",
      value: form.city,
      onChange: (v: string) =>
        setForm((f) => ({ ...f, city: v })),
      type: "text",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center overflow-hidden">
      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-white/5 blur-[200px]" />
      </div>

      <div className="relative w-full max-w-xl px-6">
        <div className="rounded-[28px] bg-black/60 backdrop-blur border border-white/10 p-10 shadow-[0_0_80px_rgba(255,255,255,0.06)]">

          {/* BRAND */}
          <div className="mb-12 text-center">
            <div className="text-xs tracking-widest uppercase text-white/60">
              Tailor Mate
            </div>
            <h1 className="mt-4 text-3xl font-light">
              {stage === "gate" ? "Request access" : "Create your profile"}
            </h1>
            <p className="mt-3 text-sm text-white/50">
              {stage === "gate"
                ? "Available by invitation only."
                : "Just a few details to get started."}
            </p>
          </div>

          {/* ACCESS GATE */}
          {stage === "gate" && (
            <AccessGate onSuccess={() => setStage("form")} />
          )}

          {/* MULTI STEP FORM */}
          {stage === "form" && (
            <>
              <StepField {...steps[step]} />

              <div className="mt-10 flex items-center justify-between">
                <span className="text-xs text-white/40">
                  Step {step + 1} of {steps.length}
                </span>

                <button
                  onClick={() =>
                    step < steps.length - 1
                      ? setStep(step + 1)
                      : console.log("SUBMIT", form)
                  }
                  disabled={!steps[step].value}
                  className="px-6 py-2 rounded-full bg-white text-black text-xs font-medium disabled:opacity-40 transition"
                >
                  {step === steps.length - 1 ? "Continue" : "Next"}
                </button>
              </div>
            </>
          )}

          {/* FOOT */}
          <div className="mt-10 text-center text-xs text-white/40">
            Already have access?{" "}
            <a href="/login" className="text-white hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
