"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";

/* =====================================================
   TYPES
===================================================== */

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface MeasurementSession {
  id: string;
  raw_text: string | null;
  structured_data: any;
  created_at: string;
  client_measurement_values?: MeasurementValue[];
}

interface MeasurementValue {
  id: string;
  garment: string;
  key: string;
  value: number | null;
  unit: string | null;
}

interface ClientNote {
  id: string;
  notes: string[];
  raw_text: string | null;
  created_at: string;
}

interface ClientFile {
  id: string;
  storage_path: string;
  original_name: string | null;
}

/* =====================================================
   UTILS
===================================================== */

function normalizeName(name: string) {
  return name.toLowerCase().replace(/\./g, "").replace(/\b[a-z]\b/g, "").replace(/\s+/g, " ").trim();
}

function formatDateTimeWithOrdinal(dateString: string) {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day}${suffix} ${month} ${year} · ${time}`;
}

function extractAddress(text?: string | null): string | null {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const collected: string[] = [];
  let capturing = false;
  const looksLikeNewField = (line: string) => /^[a-z][a-z\s]+[:\-]/i.test(line);
  const looksLikeAddressLine = (line: string) =>
    /\d/.test(line) || /\b(st|street|ave|avenue|road|rd|lane|ln|blvd|drive|dr|way|ct|court|zip|ny|ca|tx|uk|usa)\b/i.test(line);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!capturing && /address\s*[:\-]/i.test(line)) {
      capturing = true;
      const first = line.replace(/.*address\s*[:\-]\s*/i, "").trim();
      if (first) collected.push(first);
      continue;
    }
    if (!capturing) continue;
    if (looksLikeNewField(line)) break;
    if (!line) break;
    if (!looksLikeAddressLine(line)) break;
    collected.push(line);
  }
  if (!collected.length) return null;
  return collected.join(", ");
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

/* =====================================================
   PAGE
===================================================== */

export default function CustomersPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [measurements, setMeasurements] = useState<MeasurementSession[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addressFilter, setAddressFilter] = useState<string>("all");

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    setLoading(true);
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (!error && data) setClients(data);
    setLoading(false);
  }

  async function openClient(client: Client) {
    setSelected(client);
    setDetailLoading(true);
    const normalizedTarget = normalizeName(client.full_name);
    const { data: allClients } = await supabase.from("clients").select("id, full_name");
    const clientIds = allClients?.filter(c => normalizeName(c.full_name) === normalizedTarget).map(c => c.id) || [];
    const { data: mData } = await supabase.from("client_measurements").select(`*, client_measurement_values (*)`).in("client_id", clientIds).order("created_at", { ascending: false });
    const { data: nData } = await supabase.from("client_notes").select("*").in("client_id", clientIds).order("created_at", { ascending: false });
    setMeasurements(mData || []);
    setNotes(nData || []);
    setDetailLoading(false);
  }

  function closeSidebar() { setSelected(null); setMeasurements([]); setNotes([]); }

  const grouped = new Map<string, Client[]>();
  for (const client of clients) {
    const key = normalizeName(client.full_name);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(client);
  }
  const uniqueClients: Client[] = Array.from(grouped.values()).map(group =>
    group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  );

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return uniqueClients.filter(c => {
      const matchesSearch = !q || c.full_name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (addressFilter !== "all") return (c.address ?? "") === addressFilter;
      return true;
    });
  }, [uniqueClients, search, addressFilter]);

  const availableAddresses = useMemo(() => {
    const set = new Set<string>();
    uniqueClients.forEach(c => { if (c.address?.trim()) set.add(c.address.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [uniqueClients]);

  return (
    <>
      <style>{`
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-in { animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
        .fade-up  { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.12s; } .d3 { animation-delay: 0.18s; }
        .row-hover:hover td { background: rgba(201,169,110,0.04); }
        .row-hover:hover .client-name { color: #c9a96e; }
        .gold-line { background: linear-gradient(90deg, #c9a96e, transparent); }
      `}</style>

      <div className="space-y-10 pb-16">

        {/* ── HEADER ── */}
        <div className="fade-up d1 flex items-end justify-between border-b border-white/8 pb-8">
          <div>
            <p className="cs-mono text-[10px] tracking-[0.25em] text-white/30 uppercase mb-3">Archive</p>
            <h1 className="cs-serif text-5xl font-light tracking-tight text-white leading-none">Clients</h1>
            <p className="cs-mono text-xs text-white/30 mt-3">
              {loading ? "—" : `${uniqueClients.length} client${uniqueClients.length !== 1 ? "s" : ""} in archive`}
            </p>
          </div>
          <a href="/dashboard/customers/new"
            className="cs-mono text-[11px] tracking-widest uppercase px-6 py-3 rounded-full border border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors duration-200">
            + New Client
          </a>
        </div>

        {/* ── FILTERS ── */}
        <div className="fade-up d2 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full cs-mono text-sm rounded-xl bg-white/[0.03] border border-white/10 pl-10 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/40 transition-colors"
            />
          </div>
          <select
            value={addressFilter}
            onChange={e => setAddressFilter(e.target.value)}
            className="cs-mono text-sm rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-white/60 focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
            <option value="all" className="bg-[#0d0d0d]">All addresses</option>
            {availableAddresses.map(addr => <option key={addr} value={addr} className="bg-[#0d0d0d]">{addr}</option>)}
          </select>
        </div>

        {/* ── TABLE ── */}
        <div className="fade-up d3 rounded-2xl border border-white/8 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {["Client", "Email", "Phone", "Added"].map(h => (
                  <th key={h} className="cs-mono text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-6 py-16 text-center cs-mono text-xs text-white/25 tracking-widest uppercase">Loading archive…</td></tr>
              )}
              {!loading && filteredClients.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-16 text-center cs-mono text-xs text-white/25 tracking-widest uppercase">No clients found</td></tr>
              )}
              {filteredClients.map((c, i) => (
                <tr key={c.id} onClick={() => openClient(c)}
                  className="row-hover border-b border-white/5 cursor-pointer transition-colors duration-150 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-white/6 border border-white/10 flex items-center justify-center cs-mono text-[11px] text-white/50 flex-shrink-0">
                        {getInitials(c.full_name)}
                      </div>
                      <span className="client-name cs-serif text-sm font-light text-white transition-colors duration-150">
                        {c.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 cs-mono text-sm text-white/40">{c.email || "—"}</td>
                  <td className="px-6 py-4 cs-mono text-sm text-white/40">{c.phone || "—"}</td>
                  <td className="px-6 py-4 cs-mono text-xs text-white/25">
                    {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      {selected && (
        <ClientSidebar
          client={selected}
          measurements={measurements}
          notes={notes}
          loading={detailLoading}
          onClose={closeSidebar}
        />
      )}
    </>
  );
}

/* =====================================================
   SIDEBAR
===================================================== */

function ClientSidebar({ client, measurements, notes, loading, onClose }: {
  client: Client;
  measurements: MeasurementSession[];
  notes: ClientNote[];
  loading: boolean;
  onClose: () => void;
}) {
  const extractedAddress = useMemo(() =>
    measurements?.map((m: MeasurementSession) => extractAddress(m.raw_text)).find(Boolean) || null,
    [measurements]
  );

  const [addressValue, setAddressValue] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"measurements" | "notes" | "files">("measurements");

  useEffect(() => {
    if (client.address) setAddressValue(client.address);
    else if (extractedAddress) setAddressValue(extractedAddress);
    else setAddressValue("");
  }, [client?.id, client?.address, extractedAddress]);

  useEffect(() => {
    if (!client) return;
    loadClientFiles(client.id);
  }, [client?.id]);

  async function loadClientFiles(clientId: string) {
    try {
      setFilesLoading(true);
      const { data, error } = await supabase.from("client_files").select("*").eq("client_id", clientId).order("created_at", { ascending: true });
      if (error) throw error;
      setClientFiles(data || []);
    } catch (e) { console.error("load client files error", e); }
    finally { setFilesLoading(false); }
  }

  async function saveAddress() {
    if (!client) return;
    setSavingAddress(true);
    const { error } = await supabase.from("clients").update({ address: addressValue }).eq("id", client.id);
    setSavingAddress(false);
    if (!error) { setShowSavedToast(true); setTimeout(() => setShowSavedToast(false), 2200); }
  }

  const tabs = [
    { id: "measurements", label: "Measurements", count: measurements.length },
    { id: "notes", label: "Notes", count: notes.length },
    { id: "files", label: "Files", count: clientFiles.length },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="slide-in fixed inset-y-0 right-0 w-[600px] max-w-[95vw] bg-[#0e0e0e] border-l border-white/10 z-50 overflow-y-auto flex flex-col">

        {/* ── Sidebar Header ── */}
        <div className="sticky top-0 bg-[#0e0e0e] border-b border-white/10 px-8 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-white/6 border border-[#c9a96e]/20 flex items-center justify-center cs-serif text-xl text-[#c9a96e] flex-shrink-0">
                {getInitials(client.full_name)}
              </div>
              <div>
                <div className="cs-serif text-2xl font-light text-white">{client.full_name}</div>
                <div className="cs-mono text-xs text-white/35 mt-1">{client.email || "No email on file"}</div>
                {client.phone && <div className="cs-mono text-xs text-white/35">{client.phone}</div>}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm mt-1 flex-shrink-0">
              ✕
            </button>
          </div>

          {/* Gold accent line */}
          <div className="gold-line h-px mt-6 opacity-60" />
        </div>

        <div className="px-8 py-6 space-y-8 flex-1">

          {/* ── Address ── */}
          <div className="space-y-3">
            <div className="cs-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Address</div>
            <input
              value={addressValue}
              onChange={e => setAddressValue(e.target.value)}
              placeholder="No address on file"
              className="w-full cs-mono text-sm rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/40 transition-colors"
            />
            <button onClick={saveAddress} disabled={savingAddress}
              className="cs-mono text-[11px] tracking-widest uppercase px-5 py-2 rounded-full border border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e]/10 disabled:opacity-40 transition-colors">
              {savingAddress ? "Saving…" : "Save Address"}
            </button>
          </div>

          {/* ── Tabs ── */}
          <div>
            <div className="flex gap-0 border-b border-white/8 mb-6">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`cs-mono text-[11px] uppercase tracking-widest px-5 py-3 border-b-2 transition-colors duration-150 ${
                    activeTab === tab.id
                      ? "border-[#c9a96e] text-[#c9a96e]"
                      : "border-transparent text-white/30 hover:text-white/60"
                  }`}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-[#c9a96e]/20 text-[#c9a96e]" : "bg-white/8 text-white/30"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="cs-mono text-xs text-white/25 tracking-widest uppercase py-8 text-center">Loading…</div>
            ) : (
              <>
                {activeTab === "measurements" && <MeasurementsBlock sessions={measurements} />}
                {activeTab === "notes" && <NotesBlock notes={notes} />}
                {activeTab === "files" && <FilesBlock files={clientFiles} loading={filesLoading} />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-[999] transition-all duration-300 ${showSavedToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <div className="cs-mono text-xs tracking-widest uppercase rounded-xl bg-[#c9a96e] text-black px-5 py-3 shadow-lg">
          Address saved ✓
        </div>
      </div>
    </>
  );
}

/* =====================================================
   MEASUREMENTS BLOCK
===================================================== */

function MeasurementsBlock({ sessions }: { sessions: MeasurementSession[] }) {
  if (sessions.length === 0) return (
    <div className="cs-mono text-xs text-white/25 tracking-widest uppercase py-8 text-center">No measurements on file</div>
  );

  return (
    <div className="space-y-4">
      {sessions.map((s) => (
        <div key={s.id} className="rounded-2xl border border-white/8 bg-white/[0.015] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div className="cs-serif text-base font-light text-white">{formatDateTimeWithOrdinal(s.created_at)}</div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/60" />
          </div>

          {s.client_measurement_values && s.client_measurement_values.length > 0 && (
            <div className="px-5 py-4 space-y-2">
              {s.client_measurement_values.map(v => (
                <div key={v.id} className="flex items-baseline justify-between">
                  <span className="cs-mono text-xs text-white/35">{v.garment} · {v.key}</span>
                  <span className="cs-mono text-sm text-white">{v.value ?? "—"} {v.unit || ""}</span>
                </div>
              ))}
            </div>
          )}

          {s.raw_text && <RawTextToggle text={s.raw_text} />}
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   NOTES BLOCK
===================================================== */

function NotesBlock({ notes }: { notes: ClientNote[] }) {
  if (notes.length === 0) return (
    <div className="cs-mono text-xs text-white/25 tracking-widest uppercase py-8 text-center">No notes on file</div>
  );

  return (
    <div className="space-y-4">
      {notes.map(n => (
        <div key={n.id} className="rounded-2xl border border-white/8 bg-white/[0.015] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div className="cs-serif text-base font-light text-white">{formatDateTimeWithOrdinal(n.created_at)}</div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#a0b4c8]/60" />
          </div>
          <ul className="px-5 py-4 space-y-2">
            {n.notes?.map((note, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/65">
                <span className="text-[#c9a96e]/50 flex-shrink-0 mt-0.5">—</span>
                <span className="cs-mono text-xs leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   FILES BLOCK
===================================================== */

function FilesBlock({ files, loading }: { files: ClientFile[]; loading: boolean }) {
  if (loading) return <div className="cs-mono text-xs text-white/25 tracking-widest uppercase py-8 text-center">Loading files…</div>;
  if (files.length === 0) return <div className="cs-mono text-xs text-white/25 tracking-widest uppercase py-8 text-center">No files on file</div>;

  return (
    <div className="grid grid-cols-2 gap-3">
      {files.map(f => {
        const { data } = supabase.storage.from("customers").getPublicUrl(f.storage_path);
        return (
          <a key={f.id} href={data.publicUrl} target="_blank"
            className="block rounded-xl overflow-hidden border border-white/8 hover:border-[#c9a96e]/40 transition-colors duration-200 group">
            <div className="relative overflow-hidden">
              <img src={data.publicUrl} className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                <span className="cs-mono text-[10px] text-white/80 uppercase tracking-widest">Open ↗</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

/* =====================================================
   RAW TEXT TOGGLE
===================================================== */

function RawTextToggle({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5 pb-4">
      <button onClick={() => setOpen(o => !o)}
        className="cs-mono text-[12px] mt-2 uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors">
        {open ? "↑ Close" : "Expand"}
      </button>
      {open && (
        <pre className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/8 whitespace-pre-wrap cs-mono text-[11px] text-white/40 leading-relaxed">
          {text}
        </pre>
      )}
    </div>
  );
}