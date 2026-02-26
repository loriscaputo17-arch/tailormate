"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  section?: "primary" | "secondary";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/dashboard",            icon: "◈", section: "primary" },
  { label: "Clients",      href: "/dashboard/customers",  icon: "◎", section: "primary" },
  { label: "Measurements", href: "/dashboard/notes",      icon: "◻", section: "primary" },
  { label: "Calendar",     href: "/dashboard/calendar",   icon: "◷", section: "primary" },
  { label: "Orders",       href: "/dashboard/orders",     icon: "◑", section: "primary" },
  { label: "Settings",     href: "/dashboard/settings",   icon: "◉", section: "secondary" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  return (
    <>
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .sidebar-fade{animation:fadeIn 0.2s ease}
        .nav-item-active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:2px;height:60%;background:#c9a96e;border-radius:0 2px 2px 0}
      `}</style>

      {/* DESKTOP */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 md:flex-col bg-[#080808] border-r border-white/8">
        <SidebarContent />
      </aside>

      {/* MOBILE */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden sidebar-fade" onClick={onClose}>
          <aside className="absolute inset-y-0 left-0 w-64 bg-[#080808] border-r border-white/8" onClick={e => e.stopPropagation()}>
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
  const router   = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = user?.email?.slice(0, 1).toUpperCase() || "?";

  return (
    <div className="flex h-full flex-col">

      {/* ── LOGO ── */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/8 flex-shrink-0">
        <div>
          <span className="text-base font-light tracking-[0.08em] text-white">Tailor</span>
          <span className="text-base font-light tracking-[0.08em] text-[#c9a96e]">Mate</span>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm md:hidden">
            ✕
          </button>
        )}
      </div>

      {/* ── NAV ── */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto">

        {/* PRIMARY */}
        <div>
          <div className="px-3 mb-3 text-[9px] tracking-[0.3em] uppercase text-white/20 font-medium">
            Workspace
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter(i => i.section === "primary").map(item => (
              <NavLink key={item.href} {...item} active={
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              } />
            ))}
          </div>
        </div>

        {/* SECONDARY */}
        <div>
          <div className="px-3 mb-3 text-[9px] tracking-[0.3em] uppercase text-white/20 font-medium">
            Account
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter(i => i.section === "secondary").map(item => (
              <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        </div>
      </nav>

      {/* ── USER CARD ── */}
      <div className="px-3 pb-3 flex-shrink-0">
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center text-[11px] font-medium text-[#c9a96e] flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/50 truncate">{user?.email || "—"}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="text-[10px] uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors">
            Sign out →
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-6 py-3 border-t border-white/6 flex-shrink-0">
        <div className="text-[9px] tracking-[0.25em] uppercase text-white/15">Crafted memory</div>
      </div>
    </div>
  );
}

/* =====================================================
   NAV LINK
===================================================== */

function NavLink({ label, href, icon, active }: { label: string; href: string; icon: string; active?: boolean }) {
  return (
    <a href={href}
      className={`nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
        active
          ? "nav-item-active bg-white/[0.05] text-white"
          : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
      }`}>
      <span className={`text-base leading-none transition-colors ${active ? "text-[#c9a96e]" : "text-white/20 group-hover:text-white/40"}`}>
        {icon}
      </span>
      <span className="font-light tracking-wide text-[13px]">{label}</span>
      {active && (
        <span className="ml-auto w-1 h-1 rounded-full bg-[#c9a96e]/70" />
      )}
    </a>
  );
}