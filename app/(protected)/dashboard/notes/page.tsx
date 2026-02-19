"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface MeasurementRow {
  id: string;
  client_id: string;
  measured_at: string | null;
  label: string | null;
  created_at: string;
  clients?: { full_name: string | null } | null;
}

interface MeasurementValueRow {
  id: string;
  garment: string;
  key: string;
  value: number | null;
  unit: string | null;
}

export default function NotesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [selected, setSelected] = useState<MeasurementRow | null>(null);
  const [values, setValues] = useState<MeasurementValueRow[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);

  useEffect(() => {
    loadMeasurements();
  }, []);

  async function loadMeasurements() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("client_measurements")
        .select(
          `
          id,
          client_id,
          measured_at,
          label,
          created_at,
          clients(full_name)
        `
        )
        .eq("tailor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRows((data as any) || []);
    } catch (err) {
      console.error("Measurements load error", err);
    } finally {
      setLoading(false);
    }
  }

  async function openMeasurement(row: MeasurementRow) {
    try {
      setSelected(row);
      setLoadingValues(true);

      const { data, error } = await supabase
        .from("client_measurement_values")
        .select("id, garment, key, value, unit")
        .eq("measurement_id", row.id)
        .order("garment", { ascending: true });

      if (error) throw error;

      setValues(data || []);
    } catch (e) {
      console.error("Values load error", e);
    } finally {
      setLoadingValues(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">
            Measurements
          </h1>
          <p className="text-white/50 mt-1">
            All captured body measurements.
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr className="text-white/50 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-4">Client</th>
                <th className="text-left px-6 py-4">Label</th>
                <th className="text-left px-6 py-4">Measured</th>
                <th className="text-left px-6 py-4">Created</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-6 py-8 text-white/40" colSpan={4}>
                    Loading measurements…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-white/40" colSpan={4}>
                    No measurements yet.
                  </td>
                </tr>
              )}

              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openMeasurement(r)}
                  className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer transition"
                >
                  <td className="px-6 py-4">
                    {(r.clients as any)?.full_name || "—"}
                  </td>

                  <td className="px-6 py-4 text-white/70">
                    {r.label || "—"}
                  </td>

                  <td className="px-6 py-4 text-white/50">
                    {r.measured_at
                      ? new Date(r.measured_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-6 py-4 text-white/50">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIDEBAR */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-black border-l border-white/10 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light">Measurement detail</h2>
            <button
              onClick={() => setSelected(null)}
              className="text-white/40 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* INFO */}
          <div className="space-y-4 text-sm mb-6">
            <Field label="Client" value={(selected.clients as any)?.full_name} />
            <Field label="Label" value={selected.label} />
            <Field
              label="Measured at"
              value={
                selected.measured_at
                  ? new Date(selected.measured_at).toLocaleDateString()
                  : null
              }
            />
          </div>

          {/* VALUES TABLE */}
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-3">
              Measurement values
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr className="text-white/50 text-xs uppercase tracking-widest">
                    <th className="text-left px-4 py-3">Garment</th>
                    <th className="text-left px-4 py-3">Key</th>
                    <th className="text-left px-4 py-3">Value</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingValues && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-white/40">
                        Loading values…
                      </td>
                    </tr>
                  )}

                  {!loadingValues && values.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-white/40">
                        No values.
                      </td>
                    </tr>
                  )}

                  {values.map((v) => (
                    <tr key={v.id} className="border-t border-white/5">
                      <td className="px-4 py-2 text-white/70">{v.garment}</td>
                      <td className="px-4 py-2">{v.key}</td>
                      <td className="px-4 py-2 text-white">
                        {v.value != null ? `${v.value}${v.unit || ""}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-white/40 mt-6">
              Measurement ID: {selected.id}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
        {label}
      </div>
      <div className="text-white/90">{value || "—"}</div>
    </div>
  );
}
