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
  Users,
  Settings,
  ClipboardList,
  Gamepad2,
  Newspaper,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageVisitTracker } from "@/components/PageVisitTracker";

const navItems = [
  { href: "/about", label: "About", icon: Users },
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leave", label: "Leave", icon: Calendar },
  { href: "/timetable", label: "Timetable", icon: Clock },
  { href: "/cake-radar", label: "Cake Radar", icon: Cake },
  { href: "/games", label: "Play", icon: Gamepad2 },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/history", label: "History", icon: History },
  { href: "/cr-board", label: "CR Board", icon: ClipboardList, crOnly: true },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3, adminOnly: true },
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
  canCrBoard,
}: {
  children: React.ReactNode;
  userName?: string;
  canUpload?: boolean;
  isAdmin?: boolean;
  canAdmin?: boolean;
  canCrBoard?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mePerms, setMePerms] = useState<{
    canAdmin: boolean;
    canUpload: boolean;
    canCrBoard: boolean;
  }>({
    canAdmin: false,
    canUpload: false,
    canCrBoard: false,
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
          canCrBoard: !!u.canCrBoard || roll === "25M149",
        });
      })
      .catch(() => {});
  }, []);

  const showAdmin = !!(canAdmin ?? mePerms.canAdmin);
  const showUpload = !!(canUpload || isAdmin || mePerms.canUpload);
  const showCrBoard = !!(canCrBoard ?? mePerms.canCrBoard);

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
  }

  const visibleNav = navItems.filter((item) => {
    if ("adminOnly" in item && item.adminOnly) return showAdmin;
    if ("uploadOnly" in item && item.uploadOnly) return showUpload;
    if ("crOnly" in item && item.crOnly) return showCrBoard;
    return true;
  });

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900">
      <PageVisitTracker />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-0 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
      </div>

      <header className="safe-top sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <Link href="/dashboard" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-violet-600 shadow-md sm:h-9 sm:w-9">
              <Shield className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-700 sm:text-[10px]">
                TAPMI · MSM
              </p>
              <h1 className="truncate text-xs font-bold text-slate-900 sm:text-sm">Control Center</h1>
            </div>
          </Link>
          {userName && (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="max-w-[5.5rem] truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-800 sm:hidden">
                {firstName(userName)}
              </div>
              <div className="hidden max-w-[10rem] truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1 sm:block">
                <span className="text-xs font-semibold text-slate-800">{userName}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-200 bg-white p-2 transition hover:border-red-200 hover:bg-red-50 sm:p-2.5"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 text-slate-600" />
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
                pathname === href ||
                (href === "/games" && pathname.startsWith("/games")) ||
                (href === "/news" && pathname.startsWith("/news")) ||
                (href === "/analytics" && pathname.startsWith("/analytics"))
                  ? "bg-cyan-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
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

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/98 shadow-[0_-2px_16px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden">
        <div className="scrollbar-none flex gap-0.5 overflow-x-auto px-1 py-1.5">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href === "/games" && pathname.startsWith("/games")) ||
              (href === "/news" && pathname.startsWith("/news")) ||
              (href === "/analytics" && pathname.startsWith("/analytics"));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[4.25rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[9px] font-semibold transition active:scale-95",
                  active ? "bg-cyan-600 text-white" : "text-slate-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-[4rem] truncate text-center leading-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
