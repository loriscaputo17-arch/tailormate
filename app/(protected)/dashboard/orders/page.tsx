"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface OrderRow {
  id: string;
  client_id: string | null;
  order_number?: string | null;
  status?: string | null;
  order_date?: string | null;
  delivery_date?: string | null;
  total_amount?: number | null;
  notes?: string | null;
  created_at: string;
  clients: { full_name: string | null } | null;
}

interface OrderFile {
  id: string;
  storage_path: string;
  original_name: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  "draft":      "bg-white/8 text-white/45",
  "confirmed":  "bg-blue-500/15 text-blue-300",
  "in progress":"bg-amber-500/15 text-amber-300",
  "ready":      "bg-emerald-500/15 text-emerald-300",
  "delivered":  "bg-emerald-600/20 text-emerald-200",
  "cancelled":  "bg-red-500/15 text-red-300",
};

function statusColor(s: string | null | undefined) {
  const key = (s || "draft").toLowerCase();
  return STATUS_COLORS[key] || "bg-white/8 text-white/45";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

/* =====================================================
   PAGE
===================================================== */

export default function OrdersPage() {
  const router = useRouter();

  const [loading, setLoading]           = useState(true);
  const [orders, setOrders]             = useState<OrderRow[]>([]);
  const [selected, setSelected]         = useState<OrderRow | null>(null);
  const [form, setForm]                 = useState<Partial<OrderRow>>({});
  const [saving, setSaving]             = useState(false);
  const [saveOk, setSaveOk]             = useState(false);
  const [orderFiles, setOrderFiles]     = useState<OrderFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`id,client_id,order_number,status,order_date,delivery_date,total_amount,notes,created_at,clients(full_name)`)
        .eq("tailor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalized: OrderRow[] = (data || []).map((o: any) => ({
        ...o,
        clients: Array.isArray(o.clients) ? o.clients[0] : o.clients,
      }));
      setOrders(normalized);
    } catch (err) { console.error("Orders load error", err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!selected) return;
    setForm({
      order_number: selected.order_number ?? "",
      status: selected.status ?? "",
      order_date: selected.order_date ?? "",
      delivery_date: selected.delivery_date ?? "",
      total_amount: selected.total_amount ?? 0,
      notes: selected.notes ?? "",
    });
  }, [selected?.id]);

  async function saveOrder() {
    if (!selected) return;
    try {
      setSaving(true); setSaveOk(false);
      const { error } = await supabase.from("orders").update({
        order_number: form.order_number || null,
        status: form.status || null,
        order_date: form.order_date || null,
        delivery_date: form.delivery_date || null,
        total_amount: form.total_amount !== undefined ? Number(form.total_amount) : null,
        notes: form.notes || null,
      }).eq("id", selected.id);
      if (error) throw error;
      setSaveOk(true);
      loadOrders();
    } catch (e) { console.error("update order error", e); }
    finally { setSaving(false); setTimeout(() => setSaveOk(false), 2200); }
  }

  useEffect(() => {
    if (!selected) return;
    loadOrderFiles(selected.id);
  }, [selected?.id]);

  async function loadOrderFiles(orderId: string) {
    try {
      setFilesLoading(true);
      const { data, error } = await supabase.from("order_files").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
      if (error) throw error;
      setOrderFiles(data || []);
    } catch (e) { console.error("load order files error", e); }
    finally { setFilesLoading(false); }
  }

  const availableStatuses = Array.from(new Set(orders.map(o => o.status).filter((v): v is string => Boolean(v)))).sort();
  const availableClients  = Array.from(new Set(orders.map(o => o.clients?.full_name).filter((v): v is string => Boolean(v)))).sort();

  const filteredOrders = orders.filter(o => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (o.order_number ?? "").toLowerCase().includes(q) || (o.clients?.full_name ?? "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (clientFilter !== "all" && o.clients?.full_name !== clientFilter) return false;
    return true;
  });

  // KPI totals
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const activeOrders = orders.filter(o => !["delivered","cancelled"].includes((o.status || "").toLowerCase())).length;

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        .fade-up{animation:fadeUp 0.5s ease forwards;opacity:0}
        .slide-in{animation:slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards}
        .d1{animation-delay:0.04s}.d2{animation-delay:0.10s}.d3{animation-delay:0.16s}.d4{animation-delay:0.22s}
        .gold{color:#c9a96e}
        .gold-line{background:linear-gradient(90deg,#c9a96e,transparent)}
        .row-hover:hover td{background:rgba(201,169,110,0.03)}
        .row-hover:hover .row-num{color:#c9a96e}
      `}</style>

      <div className="space-y-10 pb-16">

        {/* ── HEADER ── */}
        <div className="fade-up d1 flex items-end justify-between border-b border-white/8 pb-8">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase mb-3">Archive</p>
            <h1 className="text-4xl font-light tracking-tight text-white leading-none">Orders</h1>
            <p className="text-sm text-white/35 mt-3">
              {loading ? "—" : `${orders.length} commission${orders.length !== 1 ? "s" : ""} in archive`}
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            {/* Mini KPIs */}
            <div className="text-center">
              <div className="text-2xl font-light gold">€{totalRevenue.toLocaleString("it-IT", { minimumFractionDigits: 0 })}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">Revenue</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-light text-white">{activeOrders}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">Active</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <button onClick={() => router.push("/dashboard/orders/new")}
              className="text-[11px] tracking-widest uppercase px-6 py-3 rounded-full border border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors">
              + New Order
            </button>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div className="fade-up d2 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm">⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order number or client…"
              className="w-full text-sm rounded-xl bg-white/[0.03] border border-white/10 pl-10 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-white/60 focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
            <option value="all" className="bg-[#0d0d0d]">All statuses</option>
            {availableStatuses.map(s => <option key={s} value={s} className="bg-[#0d0d0d]">{s}</option>)}
          </select>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            className="text-sm rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-white/60 focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
            <option value="all" className="bg-[#0d0d0d]">All clients</option>
            {availableClients.map(c => <option key={c} value={c} className="bg-[#0d0d0d]">{c}</option>)}
          </select>
        </div>

        {/* ── TABLE ── */}
        <div className="fade-up d3 rounded-2xl border border-white/8 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {["Order #","Client","Status","Order Date","Delivery","Total"].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-xs text-white/25 tracking-widest uppercase">Loading orders…</td></tr>
              )}
              {!loading && filteredOrders.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-xs text-white/25 tracking-widest uppercase">No orders found</td></tr>
              )}
              {filteredOrders.map(o => (
                <tr key={o.id} onClick={() => setSelected(o)}
                  className="row-hover border-b border-white/5 cursor-pointer transition-colors duration-150 last:border-0">
                  <td className="px-6 py-4">
                    <span className="row-num text-sm font-light text-white transition-colors duration-150">
                      {o.order_number || <span className="text-white/25">—</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/6 border border-white/10 flex items-center justify-center text-[10px] text-white/45 flex-shrink-0">
                        {o.clients?.full_name ? getInitials(o.clients.full_name) : "?"}
                      </div>
                      <span className="text-sm text-white/70">{o.clients?.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider ${statusColor(o.status)}`}>
                      {o.status || "draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/40">
                    {o.order_date ? fmtDate(o.order_date) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/40">
                    {o.delivery_date ? fmtDate(o.delivery_date) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {o.total_amount != null
                      ? <span className="text-sm gold">€{Number(o.total_amount).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
                      : <span className="text-white/20 text-sm">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={() => setSelected(null)} />

          <div className="slide-in fixed inset-y-0 right-0 w-[520px] max-w-[95vw] bg-[#0e0e0e] border-l border-white/10 z-50 overflow-y-auto flex flex-col">

            {/* Header */}
            <div className="sticky top-0 bg-[#0e0e0e] border-b border-white/10 px-8 py-6 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Order Detail</p>
                  <h2 className="text-2xl font-light text-white">{selected.order_number || "Untitled order"}</h2>
                  {selected.clients?.full_name && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center text-[9px] text-white/45">
                        {getInitials(selected.clients.full_name)}
                      </div>
                      <span className="text-sm text-white/45">{selected.clients.full_name}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm mt-1 flex-shrink-0">
                  ✕
                </button>
              </div>
              <div className="gold-line h-px mt-5 opacity-50" />
            </div>

            <div className="px-8 py-6 space-y-8 flex-1">

              {/* Status badge big */}
              <div className="flex items-center gap-3">
                <span className={`text-xs px-4 py-2 rounded-full uppercase tracking-widest ${statusColor(form.status as string)}`}>
                  {form.status || "draft"}
                </span>
              </div>

              {/* Fields */}
              <div className="space-y-5">
                <SidebarInput label="Order Number" value={form.order_number as string} onChange={v => setForm({...form, order_number: v})} />
                <SidebarInput label="Status" value={form.status as string} onChange={v => setForm({...form, status: v})} />

                <div className="grid grid-cols-2 gap-4">
                  <SidebarInput label="Order Date" type="date" value={form.order_date as string} onChange={v => setForm({...form, order_date: v})} />
                  <SidebarInput label="Delivery Date" type="date" value={form.delivery_date as string} onChange={v => setForm({...form, delivery_date: v})} />
                </div>

                <SidebarInput label="Total Amount (€)" type="number" value={(form.total_amount ?? "") as any} onChange={v => setForm({...form, total_amount: Number(v)})} />
                <SidebarTextarea label="Notes" value={form.notes as string} onChange={v => setForm({...form, notes: v})} />
              </div>

              {/* Documents */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Documents</div>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {filesLoading && <div className="text-xs text-white/25 tracking-widest uppercase py-4 text-center">Loading…</div>}
                {!filesLoading && orderFiles.length === 0 && <div className="text-xs text-white/25 tracking-widest uppercase py-4 text-center">No files attached</div>}

                <div className="grid grid-cols-2 gap-3">
                  {orderFiles.map(f => {
                    const { data } = supabase.storage.from("customers").getPublicUrl(f.storage_path);
                    return (
                      <a key={f.id} href={data.publicUrl} target="_blank"
                        className="block rounded-xl overflow-hidden border border-white/8 hover:border-[#c9a96e]/40 transition-colors group">
                        <div className="relative">
                          <img src={data.publicUrl} className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] text-white/80 uppercase tracking-widest">Open ↗</span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center gap-4 pt-2">
                <button onClick={saveOrder} disabled={saving}
                  className="flex-1 px-6 py-3.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-white/90 transition-opacity">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                {saveOk && (
                  <div className="text-[11px] uppercase tracking-widest text-emerald-400">✓ Saved</div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/6 space-y-1">
                <div className="text-[10px] text-white/20 tracking-widest uppercase">Order ID</div>
                <div className="text-[11px] text-white/25 font-mono">{selected.id}</div>
                <div className="text-[10px] text-white/20 mt-2">Created {fmtDate(selected.created_at)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function SidebarInput({ label, value, onChange, type = "text" }: {
  label: string; value?: string | number; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">{label}</div>
      <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
    </div>
  );
}

function SidebarTextarea({ label, value, onChange }: {
  label: string; value?: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">{label}</div>
      <textarea value={value ?? ""} onChange={e => onChange(e.target.value)} rows={4}
        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 transition-colors resize-none" />
    </div>
  );
}