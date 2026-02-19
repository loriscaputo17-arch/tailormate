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
  clients: {
    full_name: string | null;
  } | null;
}

export default function OrdersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          client_id,
          order_number,
          status,
          order_date,
          delivery_date,
          total_amount,
          notes,
          created_at,
          clients(full_name)
        `
        )
        .eq("tailor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalized: OrderRow[] =
        (data || []).map((o: any) => ({
          ...o,
          clients: Array.isArray(o.clients) ? o.clients : [],
        }));

      setOrders(normalized);
    } catch (err) {
      console.error("Orders load error", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Orders</h1>
          <p className="text-white/50 mt-1">
            All garments and commissions in your archive.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/orders/new")}
          className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
        >
          + New order
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr className="text-white/50 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-4">Order #</th>
                <th className="text-left px-6 py-4">Client</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Order date</th>
                <th className="text-left px-6 py-4">Total</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-6 py-8 text-white/40" colSpan={5}>
                    Loading orders…
                  </td>
                </tr>
              )}

              {!loading && orders.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-white/40" colSpan={5}>
                    No orders yet.
                  </td>
                </tr>
              )}

              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer transition"
                >
                  <td className="px-6 py-4 text-white/70">
                    {o.order_number || "—"}
                  </td>

                  <td className="px-6 py-4">
                    {o.clients?.full_name || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                      {o.status || "draft"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-white/50">
                    {o.order_date
                      ? new Date(o.order_date).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-6 py-4 text-white/70">
                    {o.total_amount != null
                      ? `$${Number(o.total_amount).toFixed(2)}`
                      : "—"}
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
            <h2 className="text-lg font-light">Order detail</h2>
            <button
              onClick={() => setSelected(null)}
              className="text-white/40 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6 text-sm">
            <Field label="Order number" value={selected.order_number} />
            <Field label="Client" value={selected.clients?.full_name} />
            <Field label="Status" value={selected.status} />
            <Field
              label="Order date"
              value={
                selected.order_date
                  ? new Date(selected.order_date).toLocaleDateString()
                  : null
              }
            />
            <Field
              label="Delivery date"
              value={
                selected.delivery_date
                  ? new Date(selected.delivery_date).toLocaleDateString()
                  : null
              }
            />
            <Field
              label="Total amount"
              value={
                selected.total_amount != null
                  ? `$${Number(selected.total_amount).toFixed(2)}`
                  : null
              }
            />

            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                Notes
              </div>
              <div className="text-white/80 whitespace-pre-wrap">
                {selected.notes || "—"}
              </div>
            </div>

            <Field
              label="Created"
              value={new Date(selected.created_at).toLocaleString()}
            />

            <div className="pt-4 border-t border-white/10 text-xs text-white/40">
              Order ID: {selected.id}
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
