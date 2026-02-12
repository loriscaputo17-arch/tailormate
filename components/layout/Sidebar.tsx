"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  section?: "primary" | "secondary";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", section: "primary" },
  { label: "Clients", href: "/dashboard/customers", section: "primary" },
  { label: "Measurements", href: "/dashboard/notes", section: "primary" },
  { label: "Calendar", href: "/dashboard/calendar", section: "primary" },
  { label: "Settings", href: "/dashboard/settings", section: "secondary" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* DESKTOP */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col bg-black/70 backdrop-blur-xl border-r border-white/10">
        <SidebarContent />
      </aside>

      {/* MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        >
          <aside
            className="absolute inset-y-0 left-0 w-72 bg-black border-r border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

/* =====================================================
   CONTENT
===================================================== */

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col">

      {/* LOGO */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
        <span className="text-xl font-semibold tracking-tight">
          Tailor<span className="text-white/40 font-light">Mate</span>
        </span>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-white/40 hover:text-white md:hidden"
          >
            ✕
          </button>
        )}
      </div>

      {/* NAV */}
      <nav className="flex-1 px-4 py-8 space-y-10 overflow-y-auto">

        {/* PRIMARY */}
        <div>
          <div className="px-2 mb-4 text-[10px] tracking-widest uppercase text-white/30">
            Workspace
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.filter(i => i.section === "primary").map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                active={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* SECONDARY */}
        <div>
          <div className="px-2 mb-4 text-[10px] tracking-widest uppercase text-white/30">
            Archive
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.filter(i => i.section === "secondary").map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                active={pathname === item.href}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* ACCOUNT CARD */}
      <div className="px-4 pb-4">
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-4">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
              MR
            </div>
            <div className="flex-1">
              <div className="text-sm font-light">Mario Rossi</div>
              <div className="text-xs text-white/40">Milano Atelier</div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/60">
              Pro
            </span>
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-white/40 hover:text-white transition"
          >
            Sign out
          </button>

        </div>
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 text-[10px] tracking-widest uppercase text-white/20 border-t border-white/5">
        Tailor Mate · Crafted memory
      </div>
    </div>
  );
}

/* =====================================================
   ITEM
===================================================== */

function SidebarItem({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition
        ${
          active
            ? "bg-white/10 text-white"
            : "text-white/60 hover:text-white hover:bg-white/[0.06]"
        }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full transition ${
          active ? "bg-white" : "bg-white/30 group-hover:bg-white"
        }`}
      />
      <span className="font-light tracking-tight">
        {label}
      </span>

      {active && (
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none" />
      )}
    </a>
  );
}
