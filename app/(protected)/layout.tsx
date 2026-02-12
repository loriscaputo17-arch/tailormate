"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* SIDEBAR */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* MAIN */}
      <div className="md:ml-64 flex min-h-screen flex-col">

        {/* TOP BAR (mobile) */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 md:hidden">
          <span className="text-sm font-semibold">
            Tailor<span className="text-white/50 font-light">Mate</span>
          </span>

          <button
            onClick={() => setMobileOpen(true)}
            className="text-xs text-white/60"
          >
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" width={"24px"} height={"24px"} viewBox="0 0 640 640"><path d="M64 160C64 142.3 78.3 128 96 128L480 128C497.7 128 512 142.3 512 160C512 177.7 497.7 192 480 192L96 192C78.3 192 64 177.7 64 160zM128 320C128 302.3 142.3 288 160 288L544 288C561.7 288 576 302.3 576 320C576 337.7 561.7 352 544 352L160 352C142.3 352 128 337.7 128 320zM512 480C512 497.7 497.7 512 480 512L96 512C78.3 512 64 497.7 64 480C64 462.3 78.3 448 96 448L480 448C497.7 448 512 462.3 512 480z"/></svg>
          </button>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
