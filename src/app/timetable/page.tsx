"use client";

import { useEffect, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { formatDate, formatClassTimeRange, sortByStartTime } from "@/lib/utils";

type Entry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string | null;
  faculty: string | null;
  subject: { name: string; code: string };
};

export default function TimetablePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [canAdmin, setCanAdmin] = useState(false);

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
    fetch(`/api/timetable?month=${month}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []));
  }, [month]);

  const grouped = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    const key = entry.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <NavShell userName={userName} isAdmin={isAdmin} canAdmin={canAdmin}>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Timetable</h1>
          <p className="text-sm text-zinc-400">Full schedule — chronological order.</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white sm:w-auto"
        />
      </div>

      {sortedDates.length === 0 ? (
        <p className="text-zinc-500">No timetable entries for this month.</p>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dayEntries = sortByStartTime(grouped[date]);
            return (
              <div
                key={date}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <h2 className="mb-3 font-semibold text-cyan-300">{formatDate(date)}</h2>
                <div className="space-y-2">
                  {dayEntries.map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-col gap-2 rounded-xl bg-black/30 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="break-words font-medium text-white">{e.subject.name}</p>
                        <p className="text-xs text-cyan-400">{e.subject.code}</p>
                        <p className="text-xs text-zinc-500">
                          Prof. {e.faculty || "TBA"} · {e.room || "Room TBA"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-violet-300">
                        {formatClassTimeRange(e.startTime, e.endTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </NavShell>
  );
}
