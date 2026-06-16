"use client";

import { useEffect, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { cn } from "@/lib/utils";

type Birthday = {
  name: string;
  firstName: string;
  rollNumber: string;
  month: number;
  day: number;
};

type Tab = "month" | "calendar";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CakeRadarPage() {
  const [tab, setTab] = useState<Tab>("month");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthBirthdays, setMonthBirthdays] = useState<Birthday[]>([]);
  const [allBirthdays, setAllBirthdays] = useState<Birthday[]>([]);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [canAdmin, setCanAdmin] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUserName(d.user?.name || "");
        setIsAdmin(d.user?.role === "ADMIN");
        setCanAdmin(!!d.user?.canAdmin);
      });
  }, []);

  useEffect(() => {
    fetch(`/api/birthdays?month=${month}`)
      .then((r) => r.json())
      .then((d) => setMonthBirthdays(d.birthdays || []));
  }, [month]);

  useEffect(() => {
    fetch("/api/birthdays")
      .then((r) => r.json())
      .then((d) => setAllBirthdays(d.birthdays || []));
  }, []);

  const year = new Date().getFullYear();
  const daysInMonth = new Date(year, calMonth + 1, 0).getDate();
  const firstDow = new Date(year, calMonth, 1).getDay();

  function birthdaysOnDay(day: number) {
    return allBirthdays.filter((b) => b.month === calMonth + 1 && b.day === day);
  }

  return (
    <NavShell userName={userName} isAdmin={isAdmin} canAdmin={canAdmin}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🎂 Cake Radar</h1>
        <p className="text-zinc-400">
          MSM birthday intelligence — another trip around the sun, another reason to celebrate.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("month")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition",
            tab === "month"
              ? "bg-pink-500/20 text-pink-200 ring-1 ring-pink-500/40"
              : "border border-white/10 text-zinc-400"
          )}
        >
          This Month&apos;s Birthdays
        </button>
        <button
          onClick={() => setTab("calendar")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition",
            tab === "calendar"
              ? "bg-pink-500/20 text-pink-200 ring-1 ring-pink-500/40"
              : "border border-white/10 text-zinc-400"
          )}
        >
          Birthday Calendar
        </button>
      </div>

      {tab === "month" && (
        <>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mb-4 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
          />
          {monthBirthdays.length === 0 ? (
            <p className="text-zinc-500">No birthdays this month yet — complete your profile!</p>
          ) : (
            <div className="space-y-2">
              {monthBirthdays.map((b) => (
                <div
                  key={b.rollNumber}
                  className="flex items-center justify-between rounded-xl border border-pink-500/20 bg-pink-500/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{b.name}</p>
                    <p className="text-xs text-zinc-500">{b.rollNumber}</p>
                  </div>
                  <span className="text-sm text-pink-300">
                    🎂 {b.day} {MONTH_NAMES[b.month - 1]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "calendar" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setCalMonth((m) => (m === 0 ? 11 : m - 1))}
              className="rounded-lg border border-white/10 px-3 py-1 text-sm text-zinc-400"
            >
              ←
            </button>
            <h2 className="font-semibold text-white">{MONTH_NAMES[calMonth]} {year}</h2>
            <button
              onClick={() => setCalMonth((m) => (m === 11 ? 0 : m + 1))}
              className="rounded-lg border border-white/10 px-3 py-1 text-sm text-zinc-400"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1 font-medium">{d}</div>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const bdays = birthdaysOnDay(day);
              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-[4.5rem] rounded-lg border p-1 text-left",
                    bdays.length > 0
                      ? "border-pink-500/40 bg-pink-500/10"
                      : "border-white/5 bg-black/20"
                  )}
                >
                  <span className="text-xs text-zinc-400">{day}</span>
                  {bdays.map((b) => (
                    <p
                      key={b.rollNumber}
                      className="mt-0.5 truncate text-[9px] font-medium text-pink-200"
                      title={b.name}
                    >
                      {b.firstName}&apos;s day
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </NavShell>
  );
}
