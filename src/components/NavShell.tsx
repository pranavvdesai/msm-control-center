"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  History,
  LogOut,
  Upload,
  Shield,
  Cake,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leave", label: "Leave", icon: Calendar },
  { href: "/timetable", label: "Timetable", icon: Clock },
  { href: "/cake-radar", label: "Cake Radar", icon: Cake },
  { href: "/history", label: "History", icon: History },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
  { href: "/admin/timetable", label: "Upload", icon: Upload, uploadOnly: true },
];

function firstName(name: string) {
  return name.split(" ")[0];
}

export function NavShell({
  children,
  userName,
  canUpload,
  isAdmin,
  canAdmin,
}: {
  children: React.ReactNode;
  userName?: string;
  canUpload?: boolean;
  isAdmin?: boolean;
  canAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mePerms, setMePerms] = useState<{ canAdmin: boolean; canUpload: boolean }>({
    canAdmin: false,
    canUpload: false,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const u = d.user;
        if (!u) return;
        const roll = u.rollNumber?.toUpperCase();
        setMePerms({
          canAdmin: !!u.canAdmin || roll === "25M136",
          canUpload: !!u.canUpload || u.role === "ADMIN",
        });
      })
      .catch(() => {});
  }, []);

  const showAdmin = !!(canAdmin ?? mePerms.canAdmin);
  const showUpload = !!(canUpload || isAdmin || mePerms.canUpload);

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
  }

  const visibleNav = navItems.filter((item) => {
    if ("adminOnly" in item && item.adminOnly) return showAdmin;
    if ("uploadOnly" in item && item.uploadOnly) return showUpload;
    return true;
  });

  return (
    <div className="relative min-h-screen bg-[#030014] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <header className="safe-top sticky top-0 z-40 border-b border-white/5 bg-[#030014]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <Link href="/dashboard" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20 sm:h-9 sm:w-9">
              <Shield className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400 sm:text-[10px] sm:tracking-[0.25em]">
                TAPMI · MSM
              </p>
              <h1 className="truncate text-xs font-bold text-white sm:text-sm">Control Center</h1>
            </div>
          </Link>
          {userName && (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="max-w-[5.5rem] truncate rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white sm:hidden">
                {firstName(userName)}
              </div>
              <div className="hidden max-w-[10rem] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 sm:block">
                <span className="text-xs font-semibold text-white">{userName}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-white/10 p-2 transition hover:border-red-500/30 hover:bg-red-500/10 sm:p-2.5"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          )}
        </div>

        <nav className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 pb-3 md:flex">
          {visibleNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === href
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 ring-1 ring-cyan-500/30"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-3 py-4 pb-nav-mobile sm:px-4 sm:py-6 md:pb-nav-desktop">
        {children}
      </main>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030014]/95 backdrop-blur-2xl md:hidden">
        <div className="scrollbar-none flex gap-0.5 overflow-x-auto px-1 py-1.5">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[4.25rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[9px] font-medium transition active:scale-95",
                  active ? "bg-cyan-500/15 text-cyan-400" : "text-zinc-500"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-cyan-400")} />
                <span className="max-w-[4rem] truncate text-center leading-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
