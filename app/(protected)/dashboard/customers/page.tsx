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

interface ClientsTableProps {
  clients: Client[];
  loading: boolean;
  onOpen: (client: Client) => void;

  search: string;
  onSearchChange: (v: string) => void;

  addressFilter: string;
  onAddressFilterChange: (v: string) => void;
}

interface ClientSidebarProps {
  client: Client | null;
  measurements: MeasurementSession[];
  notes: ClientNote[];
  loading: boolean;
  onClose: () => void;
}

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\./g, "")           
    .replace(/\b[a-z]\b/g, "")    
    .replace(/\s+/g, " ")         
    .trim();
}

function formatDateTimeWithOrdinal(dateString: string) {
  const date = new Date(dateString);

  const day = date.getDate();

  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();

  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${day}${suffix} ${month} ${year} · ${time}`;
}

function extractAddress(text?: string | null): string | null {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const collected: string[] = [];

  let capturing = false;

  const looksLikeNewField = (line: string) =>
    /^[a-z][a-z\s]+[:\-]/i.test(line);

  const looksLikeAddressLine = (line: string) => {
    return (
      /\d/.test(line) ||
      /\b(st|street|ave|avenue|road|rd|lane|ln|blvd|drive|dr|way|ct|court|zip|ny|ca|tx|uk|usa)\b/i.test(
        line
      )
    );
  };

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

export default function CustomersPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const [measurements, setMeasurements] = useState<MeasurementSession[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [addressFilter, setAddressFilter] = useState<string>("all");

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setClients(data);

    setLoading(false);
  }

  async function openClient(client: Client) {
    setSelected(client);
    setDetailLoading(true);

    const normalizedTarget = normalizeName(client.full_name);

    const { data: allClients } = await supabase
      .from("clients")
      .select("id, full_name");

    const clientIds =
      allClients
        ?.filter(c => normalizeName(c.full_name) === normalizedTarget)
        .map(c => c.id) || [];

    const { data: mData } = await supabase
      .from("client_measurements")
      .select(`*, client_measurement_values (*)`)
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });

    const { data: nData } = await supabase
      .from("client_notes")
      .select("*")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });

    setMeasurements(mData || []);
    setNotes(nData || []);
    setDetailLoading(false);
  }

  function closeSidebar() {
    setSelected(null);
    setMeasurements([]);
    setNotes([]);
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-8 relative">
      <Header />

      <ClientsTable
        clients={clients}
        loading={loading}
        onOpen={openClient}
        search={search}
        onSearchChange={setSearch}
        addressFilter={addressFilter}
        onAddressFilterChange={setAddressFilter}
      />

      <ClientSidebar
        client={selected}
        measurements={measurements}
        notes={notes}
        loading={detailLoading}
        onClose={closeSidebar}
      />
    </div>
  );
}

/* =====================================================
   HEADER
===================================================== */

function Header() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Clients</h1>
        <p className="text-white/50 mt-1">
          Your complete customer archive.
        </p>
      </div>

      <a
        href="/dashboard/customers/new"
        className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:opacity-90"
      >
        + New client
      </a>
    </div>
  );
}

/* =====================================================
   TABLE
===================================================== */

function ClientsTable({
  clients,
  loading,
  onOpen,
  search,
  onSearchChange,
  addressFilter,
  onAddressFilterChange,
}: ClientsTableProps) {
  const grouped = new Map<string, Client[]>();

  for (const client of clients) {
    const key = normalizeName(client.full_name);

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(client);
  }

  const uniqueClients: Client[] = Array.from(grouped.values()).map(group =>
    group.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )[0]
  );

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();

    return uniqueClients.filter((c) => {
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (addressFilter !== "all") {
        return (c.address ?? "") === addressFilter;
      }

      return true;
    });
  }, [uniqueClients, search, addressFilter]);

  const availableAddresses = useMemo(() => {
    const set = new Set<string>();

    uniqueClients.forEach((c) => {
      if (c.address?.trim()) {
        set.add(c.address.trim());
      }
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [uniqueClients]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* SEARCH */}
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, email or phone…"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />

        {/* FILTER */}
        <select
          value={addressFilter}
          onChange={(e) => onAddressFilterChange(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="all">All addresses</option>

          {availableAddresses.map((addr) => (
            <option key={addr} value={addr}>
              {addr}
            </option>
          ))}
        </select>
      </div>
      
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        

        <table className="w-full text-sm">
          <thead className="text-white/40 text-xs uppercase">
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4">Name</th>
              <th className="text-left px-6 py-4">Email</th>
              <th className="text-left px-6 py-4">Phone</th>
              <th className="text-left px-6 py-4">Created</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="px-6 py-10 text-white/40" colSpan={4}>
                  Loading clients…
                </td>
              </tr>
            )}

            {!loading && uniqueClients.length === 0 && (
              <tr>
                <td className="px-6 py-10 text-white/40" colSpan={4}>
                  No clients yet
                </td>
              </tr>
            )}

            {filteredClients.map((c) => (
              <tr
                key={c.id}
                onClick={() => onOpen(c)}
                className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition"
              >
                <td className="px-6 py-4 font-light">{c.full_name}</td>
                <td className="px-6 py-4 text-white/60">
                  {c.email || "—"}
                </td>
                <td className="px-6 py-4 text-white/60">
                  {c.phone || "—"}
                </td>
                <td className="px-6 py-4 text-white/40">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClientSidebar({
  client,
  measurements,
  notes,
  loading,
  onClose,
}: ClientSidebarProps) {
  const extractedAddress = useMemo(() => {
  return (
    measurements
      ?.map((m: MeasurementSession) => extractAddress(m.raw_text))
      .find(Boolean) || null
  );
}, [measurements]);

  const [addressValue, setAddressValue] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  
useEffect(() => {
  if (!client) return;

  console.log(client)

  if (client.address) {
    setAddressValue(client.address);
  } else if (extractedAddress) {
    setAddressValue(extractedAddress);
  } else {
    setAddressValue("");
  }
}, [client?.id, client?.address, extractedAddress]);

  async function saveAddress() {
    if (!client) return;

    setSavingAddress(true);

    const { error } = await supabase
      .from("clients")
      .update({ address: addressValue })
      .eq("id", client.id);

    setSavingAddress(false);

    if (!error) {
      setShowSavedToast(true);

      // auto hide
      setTimeout(() => {
        setShowSavedToast(false);
      }, 2200);
    }
  }

  if (!client) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[640px] max-w-[95vw] bg-black border-l border-white/10 z-50 overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-semibold">{client.full_name}</div>
            <div className="text-xs text-white/40 mt-1">
              {client.email || "No email"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-white/40">
                Address
              </div>

              <input
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
                placeholder="No address"
                className="w-full rounded-lg mb-4 bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />

              <button
                onClick={saveAddress}
                disabled={savingAddress}
                className="text-xs px-3 py-1.5 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-50 transition"
              >
                {savingAddress ? "Saving…" : "Save address"}
              </button>
            </div>

        {loading && (
          <div className="text-white/40 text-sm">Loading…</div>
        )}

        {!loading && (
          <>
            <MeasurementsBlock sessions={measurements} />
            <NotesBlock notes={notes} />
          </>
        )}

        <SaveToast visible={showSavedToast} />
      </div>
    </div>
  );
}

function SaveToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[999]
        transition-all duration-300
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
      `}
    >
      <div className="rounded-xl bg-white text-black px-4 py-2 shadow-lg text-sm font-medium">
        Address saved ✓
      </div>
    </div>
  );
}

function RawTextToggle({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-[14px] cursor-pointer px-3 py-1.5 px-6 w-full bg-white rounded-full border border-white/15 text-black hover:text-black hover:border-white/30 transition"
      >
        {open ? "Close" : "Expand"}
      </button>

      {open && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <pre className="whitespace-pre-wrap text-white/60 text-xs">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   MEASUREMENTS
===================================================== */

function MeasurementsBlock({ sessions }: any) {
  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-widest text-white">
        Measurements
      </div>

      {sessions.length === 0 && (
        <div className="text-white/40 text-sm">No measurements</div>
      )}

      {sessions.map((s: MeasurementSession) => (
        <div
          key={s.id}
          className="rounded-xl border border-white/10 p-4 space-y-3"
        >
          <div className="text-[14px] text-white font-bold">
            {formatDateTimeWithOrdinal(s.created_at)}
          </div>

          {/* values */}
          <div className="space-y-1">
            {s.client_measurement_values?.map((v) => (
              <div
                key={v.id}
                className="flex justify-between text-sm"
              >
                <span className="text-white/40">
                  {v.garment} · {v.key}
                </span>
                <span className="text-white">
                  {v.value ?? "—"} {v.unit || ""}
                </span>
              </div>
            ))}
          </div>

          {s.raw_text && <RawTextToggle text={s.raw_text} />}
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   NOTES
===================================================== */

function NotesBlock({ notes }: any) {
  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-widest text-white">
        Notes
      </div>

      {notes.length === 0 && (
        <div className="text-white/40 text-sm">No notes</div>
      )}

      {notes.map((n: ClientNote) => (
        <div
          key={n.id}
          className="rounded-xl border border-white/10 p-4 space-y-3"
        >
          <div className="text-[14px] text-white font-bold">
            {formatDateTimeWithOrdinal(n.created_at)}
          </div>

          <ul className="space-y-1">
            {n.notes?.map((note, i) => (
              <li key={i} className="text-sm text-white/70">
                • {note}
              </li>
            ))}
          </ul>

          {/*{n.raw_text && <RawTextToggle text={n.raw_text} />}*/}

        </div>
      ))}
    </div>
  );
}
