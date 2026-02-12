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
            Menu
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
