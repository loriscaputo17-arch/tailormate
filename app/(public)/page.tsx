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
}

/* =====================================================
   UI BLOCKS
===================================================== */

const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  center = false,
}: SectionHeaderProps) => (
  <div className={`mb-20 ${center ? "text-center" : ""}`}>
    {eyebrow && (
      <div className="text-xs tracking-[0.3em] uppercase text-white/30 mb-6">
        {eyebrow}
      </div>
    )}
    <h2 className="text-4xl md:text-6xl font-extralight italic tracking-tight mb-6">
      {title}
    </h2>
    {subtitle && (
      <p className="text-white/40 max-w-2xl mx-auto leading-relaxed font-light">
        {subtitle}
      </p>
    )}
  </div>
);

const Feature = ({ title, text }: FeatureProps) => (
  <div className="p-8 rounded-[28px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition">
    <h4 className="text-white text-lg font-light mb-4">{title}</h4>
    <p className="text-white/40 text-sm leading-relaxed">{text}</p>
  </div>
);

const TimelineStep = ({ step, title, text }: TimelineProps) => (
  <div className="flex gap-8">
    <span className="text-5xl font-extralight text-white/10">{step}</span>
    <div>
      <h4 className="text-xl font-light mb-2">{title}</h4>
      <p className="text-white/40 text-sm leading-relaxed max-w-md">
        {text}
      </p>
    </div>
  </div>
);

const PricingCard = ({
  name,
  price,
  items,
  featured = false,
}: PricingProps) => (
  <div
    className={`p-10 rounded-[36px] border transition ${
      featured
        ? "bg-white text-black border-white scale-[1.02]"
        : "bg-white/[0.02] border-white/10"
    }`}
  >
    <h4 className="uppercase tracking-[0.3em] text-xs mb-6 opacity-60">
      {name}
    </h4>
    <div className="text-4xl font-light mb-10">
      {price}
      <span className="text-sm opacity-40"> / month</span>
    </div>
    <ul className="space-y-4 mb-12">
      {items.map((i, idx) => (
        <li key={idx} className="flex gap-3 text-sm italic opacity-80">
          <span className="w-1 h-1 rounded-full bg-current mt-2" />
          {i}
        </li>
      ))}
    </ul>
    <button
      className={`w-full py-4 rounded-full text-xs font-bold tracking-widest uppercase transition ${
        featured
          ? "bg-black text-white"
          : "bg-white text-black hover:opacity-90"
      }`}
    >
      Select
    </button>
  </div>
);

/* =====================================================
   PAGE
===================================================== */

export default function LandingPage() {
  return (
    <div className="bg-[#0a0a0a] text-white selection:bg-white selection:text-black">

      {/* =====================================================
         HERO
      ===================================================== */}
      <section className="min-h-screen flex items-center px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-extralight leading-[1.05] tracking-tighter">
              Tailoring,
              <br />
              <span className="italic text-white/70">remembered forever.</span>
            </h1>
            <p className="mt-10 text-white/50 text-lg max-w-xl leading-relaxed font-light">
              Misure, note, foto e memoria storica.  
              Tutto ciò che rende unica la tua sartoria, preservato nel tempo.
            </p>
            <div className="mt-14 flex gap-6 items-center">
              <button className="px-10 py-4 bg-white text-black rounded-full text-sm font-bold">
                Get started
              </button>
              <span className="text-xs tracking-widest text-white/30 uppercase">
                No setup. No training.
              </span>
            </div>
          </div>

          {/* Visual block */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-white/5 blur-[120px]" />
            <div className="relative rounded-[32px] border border-white/10 bg-black/70 p-10">
              <div className="text-xs tracking-[0.3em] uppercase text-white/30 mb-8">
                Client Archive
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Client</span>
                  <span>A. Spagnuolo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Last fitting</span>
                  <span>Feb 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Orders</span>
                  <span>42</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
         PHILOSOPHY
      ===================================================== */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <SectionHeader
            eyebrow="Philosophy"
            title="Continuity is luxury"
            subtitle="L’eleganza non è ricordare tutto. È non dimenticare nulla."
            center
          />
          <p className="text-white/50 italic leading-relaxed text-lg">
            Un buon sarto evolve con i suoi clienti.  
            Tailor Mate conserva ogni dettaglio, affinché il tempo diventi un alleato.
          </p>
        </div>
      </section>

      {/* =====================================================
         HOW IT WORKS
      ===================================================== */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24">
          <SectionHeader
            eyebrow="Process"
            title="From first meeting to last fitting"
          />
          <div className="space-y-24">
            <TimelineStep
              step="01"
              title="Capture"
              text="Foto, note vocali e osservazioni vengono salvate nel profilo cliente."
            />
            <TimelineStep
              step="02"
              title="Measure"
              text="Ogni misura è storicizzata. Nulla viene sovrascritto."
            />
            <TimelineStep
              step="03"
              title="Refine"
              text="Ogni modifica racconta l’evoluzione del corpo nel tempo."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
         WHAT IT REMEMBERS
      ===================================================== */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Memory"
            title="What Tailor Mate remembers"
          />
          <ul className="space-y-6 text-xl font-light italic text-white/70">
            <li>• Una spalla che cede col tempo</li>
            <li>• Un difetto mai risolto del tutto</li>
            <li>• Preferenze non dette ad alta voce</li>
            <li>• L’esperienza accumulata, non solo i dati</li>
          </ul>
        </div>
      </section>

      {/* =====================================================
         FEATURES
      ===================================================== */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Capabilities"
            title="Designed for real ateliers"
            subtitle="Niente superfluo. Solo ciò che serve davvero."
          />
          <div className="grid md:grid-cols-3 gap-8">
            <Feature
              title="Voice notes"
              text="Detta le modifiche mentre lavori. Pensiamo noi al resto."
            />
            <Feature
              title="Pattern export"
              text="Cartamodelli pronti in PDF, sempre coerenti."
            />
            <Feature
              title="Secure archive"
              text="Backup crittografato, la tua conoscenza è protetta."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
         PRICING
      ===================================================== */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Membership"
            title="Choose your atelier size"
            center
          />
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              name="Atelier"
              price="€29"
              items={["50 clienti", "Archivio misure", "Supporto email"]}
            />
            <PricingCard
              featured
              name="Master Tailor"
              price="€59"
              items={[
                "Clienti illimitati",
                "Note vocali AI",
                "Export cartamodelli",
                "Supporto prioritario",
              ]}
            />
            <PricingCard
              name="Heritage"
              price="€129"
              items={[
                "Multi-account",
                "API access",
                "Training dedicato",
                "Brand personalizzato",
              ]}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
         FOOTER
      ===================================================== */}
      <footer className="py-20 px-6 text-center text-white/30 text-sm">
        Tailor Mate — Preserving craftsmanship through memory
      </footer>
    </div>
  );
}
