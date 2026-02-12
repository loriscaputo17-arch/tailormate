export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-white/5 blur-[200px]" />
      </div>

      {/* HERO */}
      <section className="pt-48 pb-40">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-[1.1fr_0.9fr] gap-24 items-center">

          {/* TEXT */}
          <div>
            <h1 className="text-6xl md:text-7xl font-extralight leading-tight">
              Your tailoring,
              <br />
              perfectly remembered
            </h1>

            <p className="mt-10 text-lg text-white/60 max-w-xl">
              Notes, measurements, photos and history —
              structured automatically, preserved forever.
            </p>

            <div className="mt-14 flex gap-6">
              <a
                href="/login"
                className="px-10 py-4 rounded-full bg-white text-black text-sm font-medium"
              >
                Get started
              </a>
              <span className="self-center text-xs text-white/40">
                No setup · No training
              </span>
            </div>
          </div>

          {/* HERO CARD */}
          <div className="relative">
            <div className="rounded-[32px] bg-black/60 backdrop-blur border border-white/10 p-8 shadow-[0_0_80px_rgba(255,255,255,0.05)]">

              <div className="text-xs text-white/40 mb-6">
                Client profile · Live memory
              </div>

              <div className="space-y-4">
                <Row label="Client" value="Antonio Rossi" />
                <Row label="Location" value="Milan" />
                <Row label="Chest" value="102 cm" />
                <Row label="Waist" value="88 cm" />
                <Row label="Posture" value="Slight forward" />
                <Row label="Preferences" value="Soft shoulders" />
              </div>

              {/* MINI STATS */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
                <MiniStat value="12y" label="History" />
                <MiniStat value="38" label="Fittings" />
                <MiniStat value="∞" label="Memory" />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD STRIP */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">

          <DashboardCard
            title="Structured automatically"
            value="98%"
            subtitle="Information preserved"
          />

          <DashboardCard
            title="Instant recall"
            value="<1s"
            subtitle="Any client, anytime"
          />

          <DashboardCard
            title="Zero friction"
            value="0"
            subtitle="Learning curve"
          />

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-light">
            Built for continuity.
            <br />
            Designed for craft.
          </h2>

          <a
            href="/login"
            className="inline-block mt-12 px-14 py-4 rounded-full bg-white text-black text-sm font-medium"
          >
            Start using Tailor Mate
          </a>
        </div>
      </section>

    </div>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-lg font-light">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  )
}

function DashboardCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div className="rounded-2xl bg-black/50 backdrop-blur border border-white/10 p-8">
      <div className="text-xs text-white/40">{title}</div>
      <div className="mt-4 text-4xl font-light">{value}</div>
      <div className="mt-2 text-xs text-white/40">{subtitle}</div>
    </div>
  )
}
