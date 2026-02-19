"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* =====================================================
   TYPES
===================================================== */

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
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

  /* =====================================================
     LOAD CLIENTS
  ===================================================== */

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

  /* =====================================================
     LOAD CLIENT DETAILS
  ===================================================== */

  async function openClient(client: Client) {
    setSelected(client);
    setDetailLoading(true);

    // measurements + values
    const { data: mData } = await supabase
      .from("client_measurements")
      .select(
        `*, client_measurement_values (*)`
      )
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    // notes
    const { data: nData } = await supabase
      .from("client_notes")
      .select("*")
      .eq("client_id", client.id)
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

function ClientsTable({ clients, loading, onOpen }: any) {
  return (
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

          {!loading && clients.length === 0 && (
            <tr>
              <td className="px-6 py-10 text-white/40" colSpan={4}>
                No clients yet
              </td>
            </tr>
          )}

          {clients.map((c: Client) => (
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
  );
}

/* =====================================================
   SIDEBAR
===================================================== */

function ClientSidebar({
  client,
  measurements,
  notes,
  loading,
  onClose,
}: any) {
  if (!client) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-black border-l border-white/10 z-50 overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-light">{client.full_name}</div>
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

        {loading && (
          <div className="text-white/40 text-sm">Loading…</div>
        )}

        {!loading && (
          <>
            <MeasurementsBlock sessions={measurements} />
            <NotesBlock notes={notes} />
          </>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   MEASUREMENTS
===================================================== */

function MeasurementsBlock({ sessions }: any) {
  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-widest text-white/40">
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
          <div className="text-[11px] text-white/40">
            {new Date(s.created_at).toLocaleString()}
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

          {s.raw_text && (
            <details className="text-xs text-white/50">
              <summary className="cursor-pointer hover:text-white">
                View raw text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-white/60">
                {s.raw_text}
              </pre>
            </details>
          )}
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
      <div className="text-xs uppercase tracking-widest text-white/40">
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
          <div className="text-[11px] text-white/40">
            {new Date(n.created_at).toLocaleString()}
          </div>

          <ul className="space-y-1">
            {n.notes?.map((note, i) => (
              <li key={i} className="text-sm text-white/70">
                • {note}
              </li>
            ))}
          </ul>

          {n.raw_text && (
            <details className="text-xs text-white/50">
              <summary className="cursor-pointer hover:text-white">
                View raw text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-white/60">
                {n.raw_text}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
