export default function DashboardPage() {
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
          value="128"
          hint="+12 this month"
        />
        <KpiCard
          label="Orders in progress"
          value="24"
          hint="3 urgent"
        />
        <KpiCard
          label="Years of archive"
          value="14"
          hint="Since 2011"
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* CARD 1 */}
        <DashboardCard
          title="Client activity"
          subtitle="New and returning clients"
        >
          <ChartPlaceholder />
        </DashboardCard>

        {/* CARD 2 */}
        <DashboardCard
          title="Measurements evolution"
          subtitle="Body changes over time"
        >
          <ChartPlaceholder />
        </DashboardCard>

        {/* CARD 3 */}
        <DashboardCard
          title="Orders timeline"
          subtitle="From fitting to delivery"
        >
          <ChartPlaceholder />
        </DashboardCard>

        {/* CARD 4 */}
        <DashboardCard
          title="Archive growth"
          subtitle="Accumulated tailoring knowledge"
        >
          <ChartPlaceholder />
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
      <div className="text-3xl font-light tracking-tight">
        {value}
      </div>
      <div className="mt-2 text-xs text-white/40">
        {hint}
      </div>
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
        <h3 className="text-lg font-light tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-white/40 mt-1">
          {subtitle}
        </p>
      </div>

      {children}
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div className="relative h-56 rounded-2xl bg-black/40 border border-white/5 overflow-hidden">

      {/* GRID */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="border-r border-b border-white/5"
          />
        ))}
      </div>

      {/* FAKE LINE */}
      <div className="absolute bottom-8 left-6 right-6 h-px bg-white/20" />
      <div className="absolute bottom-16 left-10 right-20 h-px bg-white/10" />

      {/* LABEL */}
      <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-widest text-white/30">
        Chart preview
      </div>
    </div>
  );
}
