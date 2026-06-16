"use client";

import { useEffect, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { formatDate } from "@/lib/utils";

type LeaveRecord = {
  id: string;
  date: string;
  type: "REGULAR" | "CONDONED";
  reason: string | null;
  subject: { name: string; code: string };
  timetableEntry: { startTime: string; endTime: string } | null;
};

export default function HistoryPage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));

    fetch("/api/leaves")
      .then((r) => r.json())
      .then((d) => setLeaves(d.leaves || []));
  }, []);

  return (
    <NavShell userName={userName}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Attendance History</h1>
        <p className="text-zinc-400">Every leave you&apos;ve marked, with full details.</p>
      </div>

      {leaves.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-zinc-500">
          No leaves recorded yet. Perfect attendance hero?
        </p>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{leave.subject.name}</p>
                  <p className="text-sm text-zinc-500">{formatDate(leave.date)}</p>
                  {leave.timetableEntry && (
                    <p className="text-xs text-zinc-600">
                      {leave.timetableEntry.startTime} – {leave.timetableEntry.endTime}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    leave.type === "REGULAR"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-violet-500/20 text-violet-300"
                  }`}
                >
                  {leave.type === "REGULAR" ? "Regular Absence" : "Condoned Leave"}
                </span>
              </div>
              {leave.reason && (
                <p className="mt-2 rounded-lg bg-black/30 px-3 py-2 text-sm text-zinc-300">
                  Reason: {leave.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </NavShell>
  );
}
