export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-white/5 blur-[200px]" />
      </div>

      {/* LOGIN CARD */}
      <div className="relative w-full max-w-2xl px-6">
        <div className="rounded-[28px] bg-black/60 backdrop-blur border border-white/10 p-10 shadow-[0_0_80px_rgba(255,255,255,0.06)]">

          {/* BRAND */}
          <div className="mb-12 text-center">
            <div className="text-xs tracking-widest uppercase text-white/60">
              Tailor Mate
            </div>
            <h1 className="mt-4 text-3xl font-light">
              Welcome back
            </h1>
            <p className="mt-3 text-sm text-white/50">
              Your memory is waiting.
            </p>
          </div>

          {/* FORM */}
          <form className="space-y-6">

            <Field
              label="Email"
              type="email"
              placeholder="you@atelier.com"
            />

            <Field
              label="Password"
              type="password"
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-xs text-white/50">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-white bg-transparent"
                />
                Remember me
              </label>

              <a href="#" className="hover:text-white transition">
                Forgot password
              </a>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:opacity-90 transition"
            >
              Sign in
            </button>
          </form>

          {/* FOOT */}
          <div className="mt-10 text-center text-xs text-white/40">
            No account yet?{" "}
            <a href="/register" className="text-white hover:underline">
              Create one
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  type,
  placeholder,
}: {
  label: string
  type: string
  placeholder: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-white/50">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
      />
    </div>
  )
}
