import React from "react";

/* =====================================================
   TYPES
===================================================== */

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

interface FeatureProps {
  title: string;
  text: string;
  index: number;
}

interface TimelineProps {
  step: string;
  title: string;
  text: string;
}

interface PricingProps {
  name: string;
  price: string;
  featured?: boolean;
  items: string[];
  cta?: string;
  note?: string;
}

interface StatProps {
  value: string;
  label: string;
}

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
}

/* =====================================================
   UI BLOCKS
===================================================== */

const SectionHeader = ({ eyebrow, title, subtitle, center = false }: SectionHeaderProps) => (
  <div className={`mb-20 ${center ? "text-center" : ""}`}>
    {eyebrow && (
      <div className="dm-mono text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-6 flex items-center gap-3"
        style={center ? { justifyContent: "center" } : {}}>
        <span className="inline-block w-8 h-px bg-[#c9a96e]/50" />
        {eyebrow}
      </div>
    )}
    <h2 className="cormorant text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight mb-6">
      {title}
    </h2>
    {subtitle && (
      <p className="text-white/40 max-w-xl leading-relaxed font-light text-lg"
        style={center ? { margin: "0 auto" } : {}}>
        {subtitle}
      </p>
    )}
  </div>
);

const Feature = ({ title, text, index }: FeatureProps) => (
  <div className="group relative p-8 rounded-2xl border border-white/8 bg-white/[0.015] hover:bg-white/[0.03] hover:border-[#c9a96e]/25 transition-all duration-300 overflow-hidden">
    <div className="dm-mono text-[9px] tracking-[0.3em] uppercase text-white/20 mb-5">0{index + 1}</div>
    <h4 className="cormorant text-2xl font-light text-white mb-4 italic">{title}</h4>
    <p className="text-white/45 text-sm leading-relaxed">{text}</p>
    <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-[#c9a96e] to-transparent group-hover:w-full transition-all duration-500" />
  </div>
);

const TimelineStep = ({ step, title, text }: TimelineProps) => (
  <div className="flex gap-8 group">
    <div className="flex-shrink-0 pt-1">
      <span className="dm-mono text-5xl font-light text-white/8 group-hover:text-[#c9a96e]/20 transition-colors duration-300 leading-none">{step}</span>
    </div>
    <div className="pt-1 border-white/6 flex-1">
      <h4 className="cormorant text-3xl font-light italic text-white mb-3">{title}</h4>
      <p className="text-white/45 text-sm leading-relaxed max-w-md">{text}</p>
    </div>
  </div>
);

const Stat = ({ value, label }: StatProps) => (
  <div className="text-center border-r border-white/8 last:border-0 px-10 py-6">
    <div className="cormorant text-5xl font-light text-white mb-2">{value}</div>
    <div className="dm-mono text-[10px] tracking-[0.2em] uppercase text-white/30">{label}</div>
  </div>
);

const Testimonial = ({ quote, name, role }: TestimonialProps) => (
  <div className="p-8 rounded-2xl border border-white/8 bg-white/[0.015] space-y-6">
    <div className="cormorant text-xl font-light italic text-white/70 leading-relaxed">"{quote}"</div>
    <div>
      <div className="text-sm text-white font-light">{name}</div>
      <div className="dm-mono text-[10px] text-white/35 tracking-wider mt-1">{role}</div>
    </div>
  </div>
);

const PricingCard = ({ name, price, items, featured = false, cta, note }: PricingProps) => (
  <div className={`relative p-10 rounded-3xl border transition-all duration-300 ${
    featured
      ? "bg-[#c9a96e] text-black border-[#c9a96e] scale-[1.03] shadow-[0_0_80px_rgba(201,169,110,0.2)]"
      : "bg-white/[0.015] border-white/10 hover:border-white/20"
  }`}>
    {featured && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-black text-[#c9a96e] dm-mono text-[9px] tracking-[0.3em] uppercase px-4 py-1.5 rounded-full border border-[#c9a96e]/30">
        Most popular
      </div>
    )}
    <div className="dm-mono uppercase tracking-[0.25em] text-[10px] mb-6 opacity-60">{name}</div>
    <div className="cormorant text-5xl font-light mb-1">{price}</div>
    <div className={`dm-mono text-[10px] tracking-widest mb-10 ${featured ? "text-black/50" : "text-white/30"}`}>/ month</div>
    <ul className="space-y-4 mb-10">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 text-sm">
          <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${featured ? "bg-black/40" : "bg-[#c9a96e]/60"}`} />
          <span className={featured ? "text-black/80" : "text-white/60"}>{item}</span>
        </li>
      ))}
    </ul>
    {note && <div className={`dm-mono text-[9px] tracking-widest mb-6 ${featured ? "text-black/40" : "text-white/20"}`}>{note}</div>}
    <button className={`w-full py-4 rounded-full dm-mono text-[11px] tracking-widest uppercase font-medium transition-all duration-200 ${
      featured ? "bg-black text-[#c9a96e] hover:bg-black/80" : "bg-white text-black hover:opacity-90"
    }`}>
      {cta || "Select"}
    </button>
  </div>
);

/* =====================================================
   PAGE
===================================================== */

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { from{background-position:200% center} to{background-position:-200% center} }

        .hero-eyebrow { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .hero-title   { animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .hero-sub     { animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.45s both; }
        .hero-cta     { animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.6s both; }
        .hero-card    { animation: fadeIn 1.2s ease 0.9s both, float 7s ease-in-out 2s infinite; }

        .gold-grain {
          background-image:
            radial-gradient(ellipse 90% 70% at 50% -10%, rgba(201,169,110,0.1), transparent),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: cover;
        }

        .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:1px; background:#c9a96e; transition:width 0.3s ease; }
        .nav-link:hover::after { width:100%; }
        .nav-link { position:relative; }

        .gold-shimmer {
          background: linear-gradient(90deg, #c9a96e 0%, #e8d5a3 50%, #c9a96e 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        ::selection { background: #c9a96e; color: black; }

        .divider { height:1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); }
      `}</style>

      <div className="bg-[#080808] text-white overflow-x-hidden">

        {/* ── NAVIGATION ── */}
        <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 md:px-16 h-16 border-b border-white/6 bg-[#080808]/85 backdrop-blur-xl">
          <div className="cormorant text-2xl italic font-semibold">
            Tailor<span className="text-[#c9a96e]">Mate</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            {[["Process","#process"],["Features","#features"],["Testimonials","#testimonials"],["Pricing","#pricing"]].map(([l, h]) => (
              <a key={l} href={h}
                className="nav-link dm-mono text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white/80 transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <a href="/login"
              className="dm-mono text-[11px] tracking-widest uppercase px-5 py-2.5 rounded-full border border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors">
              Sign in
            </a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="gold-grain min-h-screen flex items-center px-6 md:px-16 pt-16">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center py-24">
            <div>
              <div className="hero-eyebrow dm-mono text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-10 flex items-center gap-3">
                <span className="inline-block w-8 h-px bg-[#c9a96e]/50" />
                Artisan Memory Platform
              </div>

              <h1 className="hero-title cormorant text-5xl sm:text-5xl md:text-[5.5rem] font-light leading-[1.0] tracking-tighter mb-8">
                Tailoring,<br />
                <em className="italic text-white/55">remembered<br />forever.</em>
              </h1>

              <p className="hero-sub text-white/45 text-xl max-w-md leading-relaxed font-light mb-14">
                Every measurement, note, and fitting — preserved with the precision your craft deserves. The memory your atelier never had.
              </p>

              <div className="hero-cta flex gap-5 items-center flex-wrap">
                <a href="/login"
                  className="px-10 py-4 bg-white text-black rounded-full dm-mono text-[11px] tracking-widest uppercase font-medium hover:opacity-90 transition-opacity">
                  Join now
                </a>
                <a href="#process"
                  className="dm-mono text-[10px] tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors flex items-center gap-2">
                  See how it works <span className="text-[#c9a96e]/60">↓</span>
                </a>
              </div>
            </div>

            {/* Hero UI mockup */}
            <div className="hero-card relative hidden lg:block">
              <div className="absolute -inset-16 bg-[#c9a96e]/5 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/8">
                  <div className="dm-mono text-[9px] tracking-[0.3em] uppercase text-white/30">Client Archive</div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/60" />
                    <span className="dm-mono text-[9px] text-white/20">3 clients</span>
                  </div>
                </div>
                {[
                  { name: "A. Spagnuolo", fitting: "Feb 2025", orders: "42" },
                  { name: "M. Esposito",  fitting: "Jan 2025", orders: "18" },
                  { name: "L. Ferrara",   fitting: "Dec 2024", orders: "7" },
                ].map((c, i) => (
                  <div key={c.name} className={`flex items-center justify-between px-8 py-4 ${i > 0 ? "border-t border-white/5" : ""} ${i === 0 ? "bg-[#c9a96e]/[0.04]" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center dm-mono text-[10px] text-white/50">{c.name[0]}</div>
                      <span className="text-sm font-light text-white">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-6 dm-mono text-[10px] text-white/30">
                      <span>{c.fitting}</span>
                      <span className={i === 0 ? "text-[#c9a96e]" : ""}>{c.orders} orders</span>
                    </div>
                  </div>
                ))}
                <div className="px-8 py-5 border-t border-white/8 bg-white/[0.01]">
                  <div className="dm-mono text-[9px] tracking-[0.3em] uppercase text-white/20 mb-4">Latest measurements · A. Spagnuolo</div>
                  <div className="grid grid-cols-4 gap-4">
                    {[["Chest","96 cm"],["Waist","80 cm"],["Hip","98 cm"],["Inseam","82 cm"]].map(([k, v]) => (
                      <div key={k}>
                        <div className="dm-mono text-[9px] text-white/25 mb-1">{k}</div>
                        <div className="text-sm text-white font-light">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <div className="divider" />
        <div className="bg-white/[0.01]">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
            <Stat value="1,200+" label="Ateliers worldwide" />
            <Stat value="340k"   label="Measurements stored" />
            <Stat value="99.9%"  label="Uptime guarantee" />
            <Stat value="4.9★"   label="Average rating" />
          </div>
        </div>
        <div className="divider" />

        {/* ── PHILOSOPHY ── */}
        <section className="py-36 px-6 md:px-16">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-24 items-center">
            <div>
              <SectionHeader
                eyebrow="Philosophy"
                title="Continuity is the true luxury"
                subtitle="The finest ateliers are built not just on skill, but on memory. Every detail remembered is a relationship deepened."
              />
              <a href="#process"
                className="dm-mono text-[10px] tracking-widest uppercase text-[#c9a96e] border-b border-[#c9a96e]/30 pb-1 hover:border-[#c9a96e] transition-colors">
                See the process →
              </a>
            </div>
            <div className="space-y-5">
              {[
                { n: "01", t: "Every client is unique", d: "Their proportions, preferences, and history are unlike anyone else's. Generic software forgets that." },
                { n: "02", t: "Time changes everything", d: "Bodies evolve. A shoulder drops. A waist expands. Tailor Mate tracks these changes automatically." },
                { n: "03", t: "Memory is craftsmanship", d: "When a client returns after five years, you should already know everything about them before they speak." },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-5 p-6 rounded-2xl border border-white/6 hover:border-white/12 transition-colors">
                  <span className="dm-mono text-[10px] text-[#c9a96e]/50 pt-1 flex-shrink-0">{n}</span>
                  <div>
                    <div className="text-sm text-white font-light mb-2">{t}</div>
                    <div className="text-xs text-white/40 leading-relaxed">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-36 px-6 md:px-16 border-t border-white/5" id="process">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.5fr] gap-24 items-start">
            <div className="lg:sticky lg:top-32">
              <SectionHeader
                eyebrow="How it works"
                title="From first meeting to final stitch"
                subtitle="A simple three-step flow that fits naturally into your existing process."
              />
              <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, #c9a96e, transparent)" }} />
              <p className="text-xs text-white/25 dm-mono tracking-wider leading-relaxed">
                No training required. No complex onboarding. Just open the app and start capturing.
              </p>
            </div>
            <div className="space-y-0 divide-y divide-white/6 pt-4">
              {[
                { step: "01", title: "Capture everything", text: "Take a photo of handwritten notes, record a voice memo, or type directly. Our AI reads, transcribes, and structures the information into a clean client profile — automatically." },
                { step: "02", title: "Measure with precision", text: "Log measurements that are versioned, never overwritten. Every number tells a story: when it was taken, during which garment, and how it changed over time." },
                { step: "03", title: "Refine without limits", text: "Each alteration, each revision, each fitting is logged. The complete history of every garment is available at a glance — years after the original commission." },
                { step: "04", title: "Deliver with confidence", text: "From first consultation to final delivery, your team always knows where each commission stands. No missed notes. No forgotten preferences. No surprises." },
              ].map(s => (
                <div key={s.step} className="py-10 first:pt-0">
                  <TimelineStep {...s} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT IT REMEMBERS ── */}
        <section className="py-36 px-6 md:px-16 border-t border-white/5"
          style={{ background: "linear-gradient(180deg, transparent, rgba(201,169,110,0.03) 50%, transparent)" }}>
          <div className="max-w-5xl mx-auto">
            <SectionHeader eyebrow="Memory" title="What Tailor Mate never forgets" />
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { i: "01", t: "A shoulder that drops slightly with age", d: "Tracked across sessions. Flagged when the deviation exceeds your threshold." },
                { i: "02", t: "A flaw never fully resolved", d: "Noted on the last fitting. Waiting for the next commission." },
                { i: "03", t: "Preferences never spoken aloud", d: "Narrower lapels. No breast pocket. Single button. Captured the first time." },
                { i: "04", t: "The experience behind the data", d: "Not just measurements — context, character, and craftsmanship decisions." },
              ].map(({ i, t, d }) => (
                <div key={i} className="flex gap-5 p-7 rounded-2xl border border-white/6 hover:border-[#c9a96e]/20 group transition-colors duration-300">
                  <span className="dm-mono text-[10px] text-[#c9a96e]/35 pt-1 flex-shrink-0">{i}</span>
                  <div>
                    <p className="cormorant text-2xl font-light italic text-white/65 group-hover:text-white/85 transition-colors duration-300 mb-2">{t}</p>
                    <p className="text-xs text-white/30 leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-36 px-6 md:px-16 border-t border-white/5" id="features">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              eyebrow="Capabilities"
              title="Designed for real ateliers"
              subtitle="Every feature was built after talking to tailors, not technology teams."
            />
            <div className="grid md:grid-cols-3 gap-5 mb-5">
              {[
                { title: "AI document import", text: "Photograph any handwritten client card, order form, or measurement sheet. Our AI extracts and structures the data in seconds. No manual entry." },
                { title: "Version history", text: "Every measurement, every note, every alteration is versioned. Nothing is ever overwritten. The full timeline is always there." },
                { title: "Smart calendar", text: "Schedule fittings with garment context, client history, and automatic guest notifications — all connected to the client's archive." },
              ].map((f, i) => <Feature key={f.title} {...f} index={i} />)}
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { title: "Order management", text: "Track commissions from first consultation through delivery. Status, timeline, documents, and measurements — unified." },
                { title: "Client archive", text: "A complete profile for every client: contact details, full measurement history, order history, documents, and tailoring notes." },
                { title: "Encrypted & secure", text: "Your client data is encrypted at rest and in transit. Automated backups. GDPR compliant. Your archive is yours, always." },
              ].map((f, i) => <Feature key={f.title} {...f} index={i + 3} />)}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-36 px-6 md:px-16 border-t border-white/5" id="testimonials">
          <div className="max-w-7xl mx-auto">
            <SectionHeader eyebrow="In their words" title="What ateliers say" center />
            <div className="grid md:grid-cols-3 gap-5">
              <Testimonial
                quote="Before Tailor Mate, we kept everything in notebooks. When a client returned after three years, we spent 20 minutes searching. Now it's three seconds."
                name="Marco R."
                role="Master Tailor · Naples, Italy"
              />
              <Testimonial
                quote="The AI import feature alone saved us four hours per week. We photograph the card, the app does the rest. It's quietly become indispensable."
                name="Sophie L."
                role="Atelier Director · Paris, France"
              />
              <Testimonial
                quote="I was skeptical of bringing software into the atelier. But this doesn't feel like software — it feels like an extension of how we already think and work."
                name="James T."
                role="Bespoke Tailor · London, UK"
              />
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="py-36 px-6 md:px-16 border-t border-white/5" id="pricing">
          <div className="max-w-7xl mx-auto">
            <SectionHeader eyebrow="Membership" title="Choose your atelier size" center
              subtitle="All plans include a 14-day free trial. No credit card required." />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-center">
              <PricingCard
                name="Atelier"
                price="€29"
                cta="Start small"
                note="Up to 50 active clients"
                items={[
                  "Full client archive",
                  "Measurement history",
                  "Basic calendar",
                  "AI document import (50/mo)",
                  "Email support",
                ]}
              />
              <PricingCard
                featured
                name="Master Tailor"
                price="€59"
                cta="Go unlimited"
                note="Everything you need, nothing you don't"
                items={[
                  "Unlimited clients",
                  "Unlimited AI imports",
                  "Advanced calendar & notifications",
                  "Order management",
                  "Priority support",
                ]}
              />
              <PricingCard
                name="Heritage"
                price="€129"
                cta="Contact us"
                note="For multi-location houses"
                items={[
                  "Multiple team accounts",
                  "API access",
                  "Custom branding",
                  "Dedicated onboarding",
                  "SLA guarantee",
                ]}
              />
            </div>
            <p className="dm-mono text-[10px] text-white/20 tracking-wider text-center mt-10">
              Annual billing available · All prices exclude VAT · Cancel anytime
            </p>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="py-32 px-6 md:px-16 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <div className="dm-mono text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-8 flex items-center justify-center gap-3">
              <span className="inline-block w-8 h-px bg-[#c9a96e]/50" />
              Begin
            </div>
            <h2 className="cormorant text-5xl md:text-6xl font-light italic leading-tight mb-4 text-white">
              Your archive awaits.
            </h2>
            <p className="text-white/35 text-lg mb-12 font-light">
              Join over 1,200 ateliers already preserving their craft.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <a href="/login"
                className="px-12 py-5 bg-white text-black rounded-full dm-mono text-[11px] tracking-widest uppercase font-medium hover:opacity-90 transition-opacity">
                Login
              </a>
              <a href="mailto:hello@tailormate.com"
                className="px-8 py-5 rounded-full border border-white/15 dm-mono text-[11px] tracking-widest uppercase text-white/50 hover:text-white hover:border-white/30 transition-colors">
                Book a demo
              </a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/8">

          {/* Newsletter + Get started */}
          <div className="max-w-7xl mx-auto px-6 md:px-16 py-16 grid md:grid-cols-2 gap-12 border-b border-white/6">
            <div className="max-w-sm">
              <div className="dm-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-4">Stay updated</div>
              <p className="text-sm text-white/45 leading-relaxed mb-6">
                New features, atelier insights, and occasional dispatches on the craft of tailoring.
              </p>
              <div className="flex gap-2">
                <input type="email" placeholder="Your email"
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
                <button className="bg-white text-black dm-mono text-[10px] tracking-widest uppercase px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                  Join
                </button>
              </div>
            </div>
            <div className="flex md:justify-end items-center">
              <div className="md:text-right">
                <div className="dm-mono text-[10px] tracking-[0.2em] uppercase text-white/25 mb-3">Ready to begin?</div>
                <a href="/login" className="cormorant text-4xl md:text-5xl font-light italic text-white hover:text-white/70 transition-colors">
                  Start now <span className="text-white/20">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Main footer grid */}
          <div className="max-w-7xl mx-auto px-6 md:px-16 py-16 grid grid-cols-2 md:grid-cols-5 gap-12">

            {/* Brand */}
            <div className="col-span-2">
              <div className="cormorant text-2xl italic font-light mb-5">
                Tailor<span className="text-[#c9a96e]">Mate</span>
              </div>
              <p className="text-sm text-white/35 leading-relaxed max-w-[220px] mb-8">
                The digital companion for modern artisans. Precision, continuity, and respect for every stitch.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ animation: "pulse 2s infinite" }} />
                <span className="dm-mono text-[9px] tracking-[0.2em] uppercase text-white/25">All systems operational</span>
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: ["Features", "How it works", "Pricing", "Changelog"]
              },
              {
                title: "Company",
                links: ["About", "Philosophy", "Contact", "Privacy Policy"]
              },
              {
                title: "Connect",
                links: ["Instagram", "LinkedIn", "Twitter / X", "GitHub"]
              }
            ].map(col => (
              <div key={col.title}>
                <h4 className="dm-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-6">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors font-light">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/6">
            <div className="max-w-7xl mx-auto px-6 md:px-16 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 dm-mono text-[9px] tracking-widest text-white/25 uppercase">
                <span>© {new Date().getFullYear()} TailorMate</span>
                <span className="hidden md:block w-1 h-1 rounded-full bg-white/15" />
                <a href="#" className="hover:text-white/50 transition-colors">All rights reserved</a>
                <span className="hidden md:block w-1 h-1 rounded-full bg-white/15" />
                <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
              </div>
              <a href="mailto:hello@tailormate.com"
                className="dm-mono text-[9px] tracking-widest uppercase text-white/25 hover:text-[#c9a96e] transition-colors border-b border-white/10 pb-0.5">
                hello@tailormate.com
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}