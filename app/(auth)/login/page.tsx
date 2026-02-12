"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Field from "@/components/login/Field";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // redirect post-login
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center overflow-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-white/5 blur-[200px]" />
      </div>

      {/* CARD */}
      <div className="relative w-full max-w-2xl px-6">
        <div className="rounded-[28px] bg-black/60 backdrop-blur border border-white/10 p-10 shadow-[0_0_80px_rgba(255,255,255,0.06)]">

          {/* BRAND */}
          <div className="mb-12 text-center">
            <div className="text-xs tracking-widest uppercase text-white/60">
              Tailor Mate
            </div>
            <h1 className="mt-4 text-3xl font-light">
              Welcome back
            </h1>
            <p className="mt-3 text-sm text-white/50">
              Your memory is waiting.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-6">
            <Field
              label="Email"
              type="email"
              placeholder="you@atelier.com"
              value={email}
              onChange={setEmail}
            />

            <Field
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />

            <div className="flex items-center justify-between text-xs text-white/50">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-white" />
                Remember me
              </label>

              <a
                href="/forgot-password"
                className="hover:text-white transition"
              >
                Forgot password
              </a>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
