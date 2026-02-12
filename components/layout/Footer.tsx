export default function Footer() {
  return (
    <footer className="relative bg-black overflow-hidden">

      {/* Soft glow */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-white/5 blur-2xl -z-10" />

      <div className="max-w-7xl mx-auto px-6 pt-0 pb-12">

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-20" />

        {/* TOP CONTENT */}
        <div
          className="
            flex flex-col gap-16
            lg:flex-row lg:items-start
            text-xs text-white/50
          "
        >
          {/* BRAND */}
          <div className="lg:flex-[2]">
            <div className="text-xs tracking-widest uppercase text-white/70">
              Tailor Mate
            </div>
            <p className="mt-6 max-w-md leading-relaxed">
              A system designed to remember your tailoring work
              with precision, continuity and respect for the craft.
            </p>
          </div>

          {/* COLUMN 1 */}
          <div className="lg:flex-1">
            <div className="text-xs text-white/70 mb-6">Explore</div>
            <ul className="space-y-4">
              <li>
                <a href="#features" className="hover:text-white transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#who" className="hover:text-white transition">
                  Who it’s for
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-white transition">
                  Sign in
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 2 */}
          <div className="lg:flex-1">
            <div className="text-xs text-white/70 mb-6">Company</div>
            <ul className="space-y-4">
              <li>
                <a href="#" className="hover:text-white transition">
                  Philosophy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 */}
          <div className="lg:flex-1">
            <div className="text-xs text-white/70 mb-6">Resources</div>
            <ul className="space-y-4">
              <li>
                <a href="#" className="hover:text-white transition">
                  Docs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Guides
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Updates
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div
          className="
            mt-20 pt-6
            border-t border-white/10
            flex flex-col gap-4
            sm:flex-row sm:items-center
            text-xs text-white/40
          "
        >
          {/* LEFT */}
          <div className="mr-auto">
            © {new Date().getFullYear()} Tailor Mate
          </div>

          {/* RIGHT */}
          <div className="md:ml-auto">
            <a
              href="mailto:contact@tailormate.com"
              className="hover:text-white transition"
            >
              contact@tailormate.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
