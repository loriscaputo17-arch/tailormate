"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface TailorProfile {
  id: string;
  name: string | null;
  city: string | null;
  plan: string | null;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saveOk, setSaveOk]   = useState(false);
  const [profile, setProfile] = useState<TailorProfile | null>(null);
  const [email, setEmail]     = useState<string | null>(null);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? null);
      const { data, error } = await supabase.from("tailors").select("*").eq("id", user.id).single();
      if (error) throw error;
      setProfile(data);
    } catch (e) { console.error("settings load error", e); }
    finally { setLoading(false); }
  }

  async function saveProfile() {
    if (!profile) return;
    try {
      setSaving(true); setSaveOk(false);
      const { error } = await supabase.from("tailors").update({ name: profile.name, city: profile.city }).eq("id", profile.id);
      if (error) throw error;
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2200);
    } catch (e) { console.error("settings save error", e); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border border-[#c9a96e]/30 border-t-[#c9a96e]" style={{ animation: "spin 1.5s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const planLabel = (profile?.plan || "free").charAt(0).toUpperCase() + (profile?.plan || "free").slice(1);

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.5s ease forwards;opacity:0}
        .d1{animation-delay:0.04s}.d2{animation-delay:0.10s}.d3{animation-delay:0.16s}.d4{animation-delay:0.22s}
        .gold{color:#c9a96e}
        .gold-line{background:linear-gradient(90deg,#c9a96e,transparent)}
      `}</style>

      <div className="space-y-10 max-w-2xl pb-16">

        {/* ── HEADER ── */}
        <div className="fade-up d1 border-b border-white/8 pb-8">
          <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase mb-3">Configuration</p>
          <h1 className="text-4xl font-light tracking-tight text-white leading-none">Settings</h1>
          <p className="text-sm text-white/35 mt-3">Configure your atelier preferences.</p>
        </div>

        {/* ── ACCOUNT ── */}
        <div className="fade-up d2 rounded-2xl border border-white/8 bg-white/[0.015] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/60" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/50">Account</h2>
          </div>
          <div className="px-6 py-6 space-y-5">
            <ReadOnlyField label="Email" value={email || "—"} />
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Plan</div>
              <div className="inline-flex items-center gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full uppercase tracking-widest font-medium ${
                  planLabel.toLowerCase() === "pro"
                    ? "bg-[#c9a96e]/15 border border-[#c9a96e]/30 text-[#c9a96e]"
                    : "bg-white/8 border border-white/10 text-white/50"
                }`}>
                  {planLabel}
                </span>
                {planLabel.toLowerCase() !== "pro" && (
                  <span className="text-[10px] text-white/25">· Upgrade for more features</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── ATELIER PROFILE ── */}
        <div className="fade-up d3 rounded-2xl border border-white/8 bg-white/[0.015] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#a0b4c8]/60" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/50">Atelier Profile</h2>
          </div>
          <div className="px-6 py-6 space-y-5">
            <SettingsInput
              label="Atelier Name"
              value={profile?.name || ""}
              placeholder="e.g. Atelier Rossi"
              onChange={v => setProfile(p => p ? { ...p, name: v } : p)}
            />
            <SettingsInput
              label="City"
              value={profile?.city || ""}
              placeholder="e.g. Milan"
              onChange={v => setProfile(p => p ? { ...p, city: v } : p)}
            />
            <div className="flex items-center gap-4 pt-2">
              <button onClick={saveProfile} disabled={saving}
                className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-white/90 transition-opacity">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {saveOk && (
                <span className="text-[11px] uppercase tracking-widest text-emerald-400">✓ Saved</span>
              )}
            </div>
          </div>
        </div>

        {/* ── PREFERENCES (placeholder) ── */}
        <div className="fade-up d4 rounded-2xl border border-white/8 bg-white/[0.015] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/50">Preferences</h2>
          </div>
          <div className="px-6 py-8 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/20 text-lg flex-shrink-0">
              ⚙
            </div>
            <div>
              <div className="text-sm text-white/40 font-light">Coming soon</div>
              <div className="text-xs text-white/20 mt-1">Units (cm/in), calendar sync, AI behaviour and more.</div>
            </div>
          </div>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="fade-up d4 rounded-2xl border border-red-500/15 bg-red-500/[0.03] overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/15 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-red-400/60">Danger Zone</h2>
          </div>
          <div className="px-6 py-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-white/50 font-light">Sign out</div>
              <div className="text-xs text-white/25 mt-1">You will be redirected to the login page.</div>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              className="text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">{label}</div>
      <div className="text-sm text-white/70">{value}</div>
    </div>
  );
}

function SettingsInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
    </div>
  );
}