"use client"

import React, { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  const navItems = ["Features", "Who it’s for", "Philosophy"];

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-4 inset-x-0 z-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between px-2 pl-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

            {/* BRAND */}
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <div className="w-2 h-2 bg-black rotate-45" />
              </div>
              <span className="text-sm tracking-tight font-semibold text-white">
                Tailor<span className="text-white/50 font-light">Mate</span>
              </span>
            </div>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "")}`}
                  className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2">
              {/* MOBILE MENU BUTTON */}
              <button
                onClick={() => setOpen(true)}
                className="md:hidden px-4 py-2 rounded-full text-xs font-medium text-white/70 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" width={"24px"} height={"24px"} viewBox="0 0 640 640"><path d="M64 160C64 142.3 78.3 128 96 128L480 128C497.7 128 512 142.3 512 160C512 177.7 497.7 192 480 192L96 192C78.3 192 64 177.7 64 160zM128 320C128 302.3 142.3 288 160 288L544 288C561.7 288 576 302.3 576 320C576 337.7 561.7 352 544 352L160 352C142.3 352 128 337.7 128 320zM512 480C512 497.7 497.7 512 480 512L96 512C78.3 512 64 497.7 64 480C64 462.3 78.3 448 96 448L480 448C497.7 448 512 462.3 512 480z"/></svg>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm">
          <div className="absolute top-6 inset-x-4 rounded-[32px] bg-[#0a0a0a] border border-white/10 p-8 shadow-2xl">

            {/* TOP */}
            <div className="flex items-center justify-between mb-10">
              <span className="text-xl font-semibold tracking-tight">
                Tailor<span className="text-white/50 font-light">Mate</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-white/50 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" width={"24px"} height={"24px"} viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>
              </button>
            </div>

            {/* NAV */}
            <nav className="flex flex-col gap-4">
              {navItems.map((item, i) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "")}`}
                  onClick={() => setOpen(false)}
                  className="text-xl font-extralight tracking-tight text-white/80 hover:text-white transition"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* CTA */}
            <div className="mt-12">
              <a
                href="/login"
                className="block w-full text-center py-4 rounded-full bg-white text-black text-xs font-bold"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
