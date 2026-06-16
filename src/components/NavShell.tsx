"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  History,
  LogOut,
  Upload,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeveloperBadge } from "./DeveloperBadge";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leave", label: "Leave", icon: Calendar },
  { href: "/timetable", label: "Schedule", icon: Clock },
  { href: "/history", label: "History", icon: History },
  { href: "/admin/timetable", label: "Upload", icon: Upload, admin: true },
];

export function NavShell({
  children,
  userName,
  isAdmin,
}: {
  children: React.ReactNode;
  userName?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
  }

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

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#030014]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">
                TAPMI · MSM
              </p>
              <h1 className="text-sm font-bold text-white">Control Center</h1>
            </div>
          </Link>
          {userName && (
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 sm:block">
                <span className="text-xs text-zinc-400">Agent </span>
                <span className="text-xs font-semibold text-white">{userName}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-white/10 p-2.5 transition hover:border-red-500/30 hover:bg-red-500/10"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          )}
        </div>

        <nav className="mx-auto hidden max-w-6xl gap-1 px-4 pb-3 md:flex">
          {navItems
            .filter((item) => !item.admin || isAdmin)
            .map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
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

      <main className="relative mx-auto max-w-6xl px-4 py-6 pb-28 md:pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030014]/95 backdrop-blur-2xl md:hidden">
        <div className="flex justify-around px-2 py-2">
          {navItems
            .filter((item) => !item.admin || isAdmin)
            .map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] transition",
                  pathname === href ? "text-cyan-400" : "text-zinc-500"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
        </div>
      </nav>

      <DeveloperBadge />
    </div>
  );
}
