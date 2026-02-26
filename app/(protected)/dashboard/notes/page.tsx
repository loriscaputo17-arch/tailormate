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

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MeasurementsPage() {
  const [loading, setLoading]           = useState(true);
  const [rows, setRows]                 = useState<MeasurementRow[]>([]);
  const [selected, setSelected]         = useState<MeasurementRow | null>(null);
  const [values, setValues]             = useState<MeasurementValueRow[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [search, setSearch]             = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [labelFilter, setLabelFilter]   = useState("all");

  const availableClients: string[] = Array.from(
    new Set(rows.map(r => (r.clients as any)?.full_name).filter((v): v is string => Boolean(v)))
  ).sort();

  const availableLabels: string[] = Array.from(
    new Set(rows.map(r => r.label).filter((v): v is string => Boolean(v)))
  ).sort();

  const filteredRows = rows.filter(r => {
    const q = search.toLowerCase().trim();
    const clientName = ((r.clients as any)?.full_name || "").toLowerCase();
    const label = (r.label || "").toLowerCase();
    if (q && !clientName.includes(q) && !label.includes(q)) return false;
    if (clientFilter !== "all" && (r.clients as any)?.full_name !== clientFilter) return false;
    if (labelFilter !== "all" && r.label !== labelFilter) return false;
    return true;
  });

  // Group values by garment for sidebar
  const groupedValues = values.reduce<Record<string, MeasurementValueRow[]>>((acc, v) => {
    if (!acc[v.garment]) acc[v.garment] = [];
    acc[v.garment].push(v);
    return acc;
  }, {});

  useEffect(() => { loadMeasurements(); }, []);

  async function loadMeasurements() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("client_measurements")
        .select(`id, client_id, measured_at, label, created_at, clients(full_name)`)
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
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
        @keyframes slideIn { from { opacity:0; transform:translateX(24px);} to { opacity:1; transform:translateX(0);} }
        .fade-up { animation: fadeUp 0.5s ease forwards; opacity:0; }
        .slide-in { animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
        .d1{animation-delay:0.04s} .d2{animation-delay:0.10s} .d3{animation-delay:0.16s}
        .gold { color: #c9a96e; }
        .gold-line { background: linear-gradient(90deg,#c9a96e,transparent); }
        .row-hover:hover td { background: rgba(201,169,110,0.03); }
        .row-hover:hover .client-cell { color: #c9a96e; }
      `}</style>

      <div className="space-y-10 pb-16">

        {/* ── HEADER ── */}
        <div className="fade-up d1 flex items-end justify-between border-b border-white/8 pb-8">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase mb-3">Archive</p>
            <h1 className="text-4xl font-light tracking-tight text-white leading-none">Measurements</h1>
            <p className="text-sm text-white/35 mt-3">
              {loading ? "—" : `${rows.length} session${rows.length !== 1 ? "s" : ""} recorded`}
            </p>
          </div>

          {/* Mini stats */}
          <div className="flex gap-6 pb-1">
            <div className="text-center">
              <div className="text-2xl font-light text-white">{availableClients.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">Clients</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-light gold">{rows.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">Sessions</div>
            </div>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div className="fade-up d2 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by client or label…"
              className="w-full text-sm rounded-xl bg-white/[0.03] border border-white/10 pl-10 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/40 transition-colors"
            />
          </div>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            className="text-sm rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-white/60 focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
            <option value="all" className="bg-[#0d0d0d]">All clients</option>
            {availableClients.map(c => <option key={c} value={c} className="bg-[#0d0d0d]">{c}</option>)}
          </select>
          <select value={labelFilter} onChange={e => setLabelFilter(e.target.value)}
            className="text-sm rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-white/60 focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
            <option value="all" className="bg-[#0d0d0d]">All labels</option>
            {availableLabels.map(l => <option key={l} value={l} className="bg-[#0d0d0d]">{l}</option>)}
          </select>
        </div>

        {/* ── TABLE ── */}
        <div className="fade-up d3 rounded-2xl border border-white/8 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {["Client", "Label", "Measured", "Added"].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-xs text-white/25 tracking-widest uppercase">Loading sessions…</td></tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-xs text-white/25 tracking-widest uppercase">No measurements found</td></tr>
              )}
              {filteredRows.map(r => {
                const clientName = (r.clients as any)?.full_name || "—";
                return (
                  <tr key={r.id} onClick={() => openMeasurement(r)}
                    className="row-hover border-b border-white/5 cursor-pointer transition-colors duration-150 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/6 border border-white/10 flex items-center justify-center text-[11px] text-white/50 flex-shrink-0">
                          {clientName !== "—" ? getInitials(clientName) : "?"}
                        </div>
                        <span className="client-cell text-sm font-light text-white transition-colors duration-150">
                          {clientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {r.label
                        ? <span className="text-xs px-3 py-1 rounded-full bg-white/6 border border-white/10 text-white/60">{r.label}</span>
                        : <span className="text-white/25">—</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-white/40">
                      {r.measured_at ? fmtDate(r.measured_at) : <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/25">
                      {fmtDate(r.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={() => setSelected(null)} />

          <div className="slide-in fixed inset-y-0 right-0 w-[480px] max-w-[95vw] bg-[#0e0e0e] border-l border-white/10 z-50 overflow-y-auto flex flex-col">

            {/* Sidebar header */}
            <div className="sticky top-0 bg-[#0e0e0e] border-b border-white/10 px-8 py-6 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/6 border border-[#c9a96e]/20 flex items-center justify-center text-base text-[#c9a96e] flex-shrink-0">
                    {(selected.clients as any)?.full_name ? getInitials((selected.clients as any).full_name) : "?"}
                  </div>
                  <div>
                    <div className="text-xl font-light text-white">
                      {(selected.clients as any)?.full_name || "Unknown client"}
                    </div>
                    {selected.label && (
                      <div className="mt-1 inline-flex items-center text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 gold">
                        {selected.label}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm mt-1 flex-shrink-0">
                  ✕
                </button>
              </div>
              <div className="gold-line h-px mt-5 opacity-50" />
            </div>

            <div className="px-8 py-6 space-y-8 flex-1">

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Measured" value={selected.measured_at ? fmtDate(selected.measured_at) : null} />
                <InfoField label="Recorded" value={fmtDate(selected.created_at)} />
              </div>

              {/* Values by garment */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Measurement Values</div>
                  <div className="flex-1 h-px bg-white/8" />
                  {!loadingValues && <div className="text-[10px] text-white/25">{values.length} values</div>}
                </div>

                {loadingValues && (
                  <div className="text-xs text-white/25 tracking-widest uppercase py-8 text-center">Loading…</div>
                )}

                {!loadingValues && values.length === 0 && (
                  <div className="text-xs text-white/25 tracking-widest uppercase py-8 text-center">No values recorded</div>
                )}

                {!loadingValues && Object.entries(groupedValues).map(([garment, vals]) => (
                  <div key={garment} className="mb-4 rounded-2xl border border-white/8 overflow-hidden">
                    <div className="px-5 py-3 bg-white/[0.02] border-b border-white/8 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">{garment}</span>
                      <span className="text-[10px] text-white/20">{vals.length} measurements</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {vals.map(v => (
                        <div key={v.id} className="flex items-baseline justify-between px-5 py-3">
                          <span className="text-sm text-white/45 capitalize">{v.key}</span>
                          <span className="text-sm text-white font-light">
                            {v.value != null ? (
                              <>{v.value}<span className="text-white/35 text-xs ml-1">{v.unit || "cm"}</span></>
                            ) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer ID */}
              <div className="pt-4 border-t border-white/6">
                <div className="text-[10px] text-white/20 tracking-widest uppercase mb-1">Session ID</div>
                <div className="text-[11px] text-white/25 font-mono">{selected.id}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1.5">{label}</div>
      <div className="text-sm text-white/80">{value || "—"}</div>
    </div>
  );
}