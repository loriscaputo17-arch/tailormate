"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    clients: 0,
    orders: 0,
    measurements: 0,
  });

  const [clientSeries, setClientSeries] = useState<any[]>([]);
  const [measurementSeries, setMeasurementSeries] = useState<any[]>([]);
  const [orderSeries, setOrderSeries] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadCharts();
  }, []);

  /* =====================================================
     KPI STATS
  ===================================================== */

  async function loadStats() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [clientsRes, ordersRes, measRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("tailor_id", user.id),

        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("tailor_id", user.id),

        supabase
          .from("client_measurements")
          .select("id", { count: "exact", head: true })
          .eq("tailor_id", user.id),
      ]);

      setStats({
        clients: clientsRes.count || 0,
        orders: ordersRes.count || 0,
        measurements: measRes.count || 0,
      });
    } catch (err) {
      console.error("Dashboard stats error", err);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     CHART DATA
  ===================================================== */

  async function loadCharts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [clients, measurements, orders] = await Promise.all([
        supabase
          .from("clients")
          .select("created_at")
          .eq("tailor_id", user.id),

        supabase
          .from("client_measurements")
          .select("created_at")
          .eq("tailor_id", user.id),

        supabase
          .from("orders")
          .select("created_at")
          .eq("tailor_id", user.id),
      ]);

      setClientSeries(groupByMonth(clients.data || []));
      setMeasurementSeries(groupByMonth(measurements.data || []));
      setOrderSeries(groupByMonth(orders.data || []));
    } catch (e) {
      console.error("Chart load error", e);
    }
  }

  function groupByMonth(rows: any[]) {
    const map = new Map<string, number>();

    for (const r of rows) {
      if (!r?.created_at) continue;

      const d = new Date(r.created_at);
      if (isNaN(d.getTime())) continue;

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, total]) => ({ month, total }));
  }

  return (
    <div className="space-y-12">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-light tracking-tight mb-2">
          Dashboard
        </h1>
        <p className="text-white/50">
          A living overview of your atelier.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard
          label="Active clients"
          value={loading ? "—" : String(stats.clients)}
          hint="Total in your archive"
        />
        <KpiCard
          label="Orders"
          value={loading ? "—" : String(stats.orders)}
          hint="Linked to your account"
        />
        <KpiCard
          label="Measurement sessions"
          value={loading ? "—" : String(stats.measurements)}
          hint="Captured fittings"
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <DashboardCard
          title="Client activity"
          subtitle="New clients over time"
        >
          <TimeSeriesChart data={clientSeries} />
        </DashboardCard>

        <DashboardCard
          title="Measurements evolution"
          subtitle="Fittings captured over time"
        >
          <TimeSeriesChart data={measurementSeries} />
        </DashboardCard>

        <DashboardCard
          title="Orders timeline"
          subtitle="Orders created over time"
        >
          <TimeSeriesChart data={orderSeries} />
        </DashboardCard>

        <DashboardCard
          title="Archive growth"
          subtitle="Clients growth trend"
        >
          <TimeSeriesChart data={clientSeries} />
        </DashboardCard>
      </div>
    </div>
  );
}

/* =====================================================
   COMPONENTS
===================================================== */

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="text-xs uppercase tracking-widest text-white/40 mb-4">
        {label}
      </div>
      <div className="text-3xl font-light tracking-tight">{value}</div>
      <div className="mt-2 text-xs text-white/40">{hint}</div>
    </div>
  );
}

function DashboardCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 md:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-light tracking-tight">{title}</h3>
        <p className="text-xs text-white/40 mt-1">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}

function TimeSeriesChart({ data }: { data: any[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0b0b0b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
            }}
            labelStyle={{ color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />

          <Line
            type="monotone"
            dataKey="total"
            stroke="#ffffff"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
