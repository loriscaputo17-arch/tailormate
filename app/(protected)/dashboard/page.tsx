"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ clients: 0, orders: 0, measurements: 0 });
  const [clientSeries, setClientSeries] = useState<any[]>([]);
  const [measurementSeries, setMeasurementSeries] = useState<any[]>([]);
  const [orderSeries, setOrderSeries] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadCharts();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clientsRes, ordersRes, measRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("tailor_id", user.id),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("tailor_id", user.id),
        supabase.from("client_measurements").select("id", { count: "exact", head: true }).eq("tailor_id", user.id),
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

  async function loadCharts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clients, measurements, orders] = await Promise.all([
        supabase.from("clients").select("created_at").eq("tailor_id", user.id),
        supabase.from("client_measurements").select("created_at").eq("tailor_id", user.id),
        supabase.from("orders").select("created_at").eq("tailor_id", user.id),
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
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, total]) => ({ month, total }));
  }

  return (
    <>
      {/* Global style injection for custom font */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.05s; }
        .delay-2 { animation-delay: 0.12s; }
        .delay-3 { animation-delay: 0.19s; }
        .delay-4 { animation-delay: 0.28s; }
        .delay-5 { animation-delay: 0.36s; }
        .delay-6 { animation-delay: 0.44s; }
        .delay-7 { animation-delay: 0.52s; }

        .gold { color: #c9a96e; }
        .gold-border { border-color: rgba(201,169,110,0.25); }
        .gold-glow { box-shadow: 0 0 40px rgba(201,169,110,0.06); }
      `}</style>

      <div className="space-y-10 pb-16">

        {/* ── HEADER ── */}
        <div className="fade-up delay-1 flex items-end justify-between border-b border-white/8 pb-8">
          <div>
            <p className="dash-mono text-[10px] tracking-[0.25em] text-white/30 uppercase mb-3">
              Atelier Overview
            </p>
            <h1 className="dash-serif text-5xl font-light tracking-tight text-white leading-none">
              Dashboard
            </h1>
          </div>
          <div className="dash-mono text-sm text-white/25 text-right">
            <div>{new Date().toLocaleDateString("en-GB", { weekday: "long" })}</div>
            <div className="gold">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
        </div>

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden gold-glow">
          <KpiCard label="Active Clients"      value={loading ? "—" : stats.clients}      unit="clients"  delay="delay-2" index={0} />
          <KpiCard label="Orders"              value={loading ? "—" : stats.orders}       unit="orders"   delay="delay-3" index={1} />
          <KpiCard label="Fitting Sessions"    value={loading ? "—" : stats.measurements} unit="fittings" delay="delay-4" index={2} />
        </div>

        {/* ── CHARTS GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Wide chart */}
          <div className="xl:col-span-3 fade-up delay-5">
            <ChartCard title="Client Growth" subtitle="New clients per month" accent="#c9a96e">
              <GoldAreaChart data={clientSeries} color="#c9a96e" />
            </ChartCard>
          </div>

          {/* Tall narrow */}
          <div className="xl:col-span-2 fade-up delay-6">
            <ChartCard title="Orders" subtitle="Orders over time" accent="#e8d5b0">
              <GoldAreaChart data={orderSeries} color="#e8d5b0" />
            </ChartCard>
          </div>

          {/* Full width */}
          <div className="xl:col-span-5 fade-up delay-7">
            <ChartCard title="Measurement Sessions" subtitle="Fittings captured over time" accent="#a0b4c8" wide>
              <GoldAreaChart data={measurementSeries} color="#a0b4c8" />
            </ChartCard>
          </div>
        </div>

      </div>
    </>
  );
}

/* ── KPI CARD ── */
function KpiCard({
  label, value, unit, delay, index
}: {
  label: string;
  value: number | "—";
  unit: string;
  delay: string;
  index: number;
}) {
  const isMiddle = index === 1;
  return (
    <div className={`fade-up ${delay} relative bg-[#0f0f0f] px-8 py-8 flex flex-col justify-between min-h-[160px] group transition-colors duration-300 hover:bg-[#141414]`}>
      {/* top accent line */}
      <div className={`absolute top-0 left-8 right-8 h-px ${isMiddle ? "bg-[#c9a96e]" : "bg-white/10"} transition-all duration-500 group-hover:bg-[#c9a96e]`} />

      <div className="dash-mono text-[12px] uppercase tracking-[0.2em] text-white/35">{label}</div>

      <div>
        <div className="dash-serif text-5xl font-bold text-white leading-none tracking-tight">
          {value}
        </div>
        <div className="dash-mono text-[10px] tracking-widest text-white/25 mt-2 uppercase">{unit}</div>
      </div>
    </div>
  );
}

/* ── CHART CARD ── */
function ChartCard({
  title, subtitle, children, accent = "#c9a96e", wide = false
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accent?: string;
  wide?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[#0d0d0d] border border-white/8 p-6 md:p-8 hover:border-white/12 transition-colors duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="dash-serif text-2xl font-semibold text-white tracking-tight">{title}</h3>
          <p className="dash-mono text-[12px] tracking-widest text-white/30 mt-1 uppercase">{subtitle}</p>
        </div>
        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: accent }} />
      </div>
      {children}
    </div>
  );
}

/* ── AREA CHART ── */
function GoldAreaChart({ data, color }: { data: any[]; color: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const gradientId = `grad-${color.replace("#", "")}`;

  if (!mounted) {
    return <div className="w-full h-52 animate-pulse rounded-xl bg-white/4" />;
  }

  if (!data.length) {
    return (
      <div className="w-full h-52 flex items-center justify-center">
        <p className="dash-mono text-[11px] tracking-widest text-white/20 uppercase">No data yet</p>
      </div>
    );
  }

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="1 6"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "DM Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />

          <YAxis
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "DM Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#111",
              border: `1px solid ${color}40`,
              borderRadius: "10px",
              padding: "8px 14px",
              fontFamily: "DM Mono, monospace",
              fontSize: "14px",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em" }}
            itemStyle={{ color }}
            cursor={{ stroke: `${color}30`, strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}