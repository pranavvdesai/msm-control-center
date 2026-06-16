"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { formatDate, parseLocalDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

type CalEvent = {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string | null;
  term: string | null;
};

type Tab = "holidays" | "events" | "exams" | "long-weekends";

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: "holidays", label: "Holidays", emoji: "🔴" },
  { id: "events", label: "Major Events", emoji: "⭐" },
  { id: "exams", label: "Term 4 Exams", emoji: "📝" },
  { id: "long-weekends", label: "Long Weekends", emoji: "🏖️" },
];

export default function CalendarPage() {
  const [tab, setTab] = useState<Tab>("holidays");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<{
    holidays: CalEvent[];
    majorEvents: CalEvent[];
    exams: CalEvent[];
    longWeekends: CalEvent[];
    totalInDb?: number;
  } | null>(null);
  const [userName, setUserName] = useState("");
  const [canUpload, setCanUpload] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadCalendar = useCallback(() => {
    setLoading(true);
    fetch(`/api/calendar?month=${month}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUserName(d.user?.name || "");
        setCanUpload(!!d.user?.canUpload);
      });
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") loadCalendar();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadCalendar]);

  const lists: Record<Tab, CalEvent[]> = {
    holidays: data?.holidays || [],
    events: data?.majorEvents || [],
    exams: data?.exams || [],
    "long-weekends": data?.longWeekends || [],
  };

  const active = lists[tab];
  const totalInDb = data?.totalInDb ?? 0;

  return (
    <NavShell userName={userName} canUpload={canUpload}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Academic Calendar</h1>
          <p className="text-zinc-400">
            Holidays (weekdays), major events, Term 4 exams & long weekends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCalendar}
            className="rounded-xl border border-white/10 p-2 text-zinc-400"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm",
              tab === t.id
                ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                : "border border-white/10 text-zinc-400 hover:bg-white/5"
            )}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === "long-weekends" && active.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200">🏖️ Long Weekend Alert!</p>
          <p className="mt-1 text-xs text-amber-200/80">
            Plan your trips — these are extended breaks (Fri holiday + weekend, etc.)
          </p>
        </div>
      )}

      {active.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-zinc-500">
          <p>No entries for this month in the {tabs.find((t) => t.id === tab)?.label} tab.</p>
          {totalInDb > 0 ? (
            <p className="mt-2 text-sm text-cyan-300/80">
              {totalInDb} events exist in other months — try changing the month above.
            </p>
          ) : (
            <p className="mt-2 text-sm">Ask Ram or Bhavya to upload the academic calendar.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-white">{e.title}</p>
                <span className="text-xs text-cyan-300">
                  {formatDate(parseLocalDate(e.date))}
                </span>
              </div>
              {e.description && (
                <p className="mt-1 text-xs text-zinc-500">{e.description}</p>
              )}
              {e.term && (
                <p className="mt-1 text-[10px] uppercase tracking-wider text-violet-400">
                  {e.term}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </NavShell>
  );
}
