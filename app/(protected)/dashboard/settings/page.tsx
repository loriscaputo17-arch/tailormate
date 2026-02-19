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
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TailorProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("tailors")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (e) {
      console.error("settings load error", e);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("tailors")
        .update({
          name: profile.name,
          city: profile.city,
        })
        .eq("id", profile.id);

      if (error) throw error;
    } catch (e) {
      console.error("settings save error", e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-white/50">Loading settings…</div>;
  }

  return (
    <div className="space-y-10 max-w-3xl">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-light tracking-tight">Settings</h1>
        <p className="text-white/50 mt-1">
          Configure your atelier preferences.
        </p>
      </div>

      {/* ACCOUNT */}
      <Section title="Account">
        <Field label="Email" value={email || "—"} readOnly />
        <Field label="Plan" value={profile?.plan || "free"} readOnly />
      </Section>

      {/* ATELIER PROFILE */}
      <Section title="Atelier profile">
        <Input
          label="Atelier name"
          value={profile?.name || ""}
          onChange={(v) =>
            setProfile((p) => (p ? { ...p, name: v } : p))
          }
        />

        <Input
          label="City"
          value={profile?.city || ""}
          onChange={(v) =>
            setProfile((p) => (p ? { ...p, city: v } : p))
          }
        />

        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-4 px-6 py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </Section>

      {/* FUTURE PLACEHOLDERS */}
      <Section title="Preferences">
        <div className="text-sm text-white/40">
          Coming soon: units (cm/in), calendar sync, AI behavior.
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 space-y-6">
      <h2 className="text-lg font-light tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  readOnly,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
        {label}
      </div>
      <div className="text-white/90">{value}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
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