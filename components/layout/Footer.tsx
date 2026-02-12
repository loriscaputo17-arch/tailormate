import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black pt-24 pb-12 overflow-hidden">
      {/* Elementi Decorativi di Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        
        {/* SECTION 1: PRE-FOOTER / NEWSLETTER */}
        <div className="grid lg:grid-cols-2 gap-12 pb-20 border-b border-white/5">
          <div className="max-w-sm">
            <h3 className="text-white text-lg font-semibold mb-4">Stay in the loop</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Ricevi aggiornamenti sulle nuove funzionalità e consigli su come gestire al meglio la tua sartoria.
            </p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors w-full"
              />
              <button className="bg-white text-black text-xs font-bold px-6 py-2 rounded-full hover:bg-white/90 transition-all">
                Join
              </button>
            </form>
          </div>
          
          <div className="flex lg:justify-end items-center">
             <div className="text-right">
                <p className="text-white/30 text-xs uppercase tracking-[0.2em] mb-2">Ready to start?</p>
                <a href="/login" className="text-3xl md:text-4xl font-light text-white hover:text-white/70 transition-colors tracking-tight">
                  Get Started for free <span className="text-white/20">→</span>
                </a>
             </div>
          </div>
        </div>

        {/* SECTION 2: LINKS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 py-20">
          
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-black rotate-45" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white uppercase">
                Tailor Mate
              </span>
            </div>
            <p className="text-white/40 text-[13px] leading-relaxed max-w-[240px]">
              Il compagno digitale per l'artigianato moderno. Precisione, continuità e rispetto per ogni singolo punto.
            </p>
          </div>

          {/* Links Columns */}
          {[
            {
              title: "Product",
              links: ["Features", "Who it's for", "Showcase", "Pricing"]
            },
            {
              title: "Company",
              links: ["Philosophy", "Contact", "Support", "Privacy"]
            },
            {
              title: "Social",
              links: ["Instagram", "LinkedIn", "Twitter", "GitHub"]
            }
          ].map((column) => (
            <div key={column.title}>
              <h4 className="text-white text-[13px] font-medium mb-6">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-white/40 text-[13px] hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* SECTION 3: BOTTOM BAR */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-[11px] text-white/30 uppercase tracking-widest">
            <span>© {currentYear} Tailor Mate</span>
            <span className="hidden md:block w-1 h-1 bg-white/10 rounded-full" />
            <a href="#" className="hover:text-white transition-colors">All rights reserved</a>
          </div>
          
          <div className="flex items-center gap-8">
            <a href="mailto:hello@tailormate.com" className="text-[11px] text-white/40 hover:text-white transition-colors border-b border-white/10 pb-1">
              hello@tailormate.com
            </a>
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[11px] text-white/30 uppercase tracking-widest">System Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}