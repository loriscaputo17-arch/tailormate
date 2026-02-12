export default function Hedaer() {
  return (
    <header className="fixed top-6 inset-x-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-14 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-between px-6 shadow-[0_0_40px_rgba(255,255,255,0.04)]">
          
          {/* Brand */}
          <span className="text-xs tracking-widest uppercase text-white">
            Tailor Mate
          </span>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs text-white/60">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#who" className="hover:text-white transition">Who it’s for</a>
            <a href="#philosophy" className="hover:text-white transition">Philosophy</a>
          </nav>

          {/* CTA */}
          <a
            href="/login"
            className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium hover:opacity-90 transition"
          >
            Sign in
          </a>
        </div>
      </div>
    </header>
  )
}
