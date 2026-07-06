"use client";

import { useEffect, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { formatDate, formatClassTimeRange } from "@/lib/utils";
import { type LeaveType, leaveTypeBadgeClass, leaveTypeLabel } from "@/lib/leaves";

type LeaveRecord = {
  id: string;
  date: string;
  type: LeaveType;
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
      <div className="msm-page-header">
        <h1 className="msm-page-title">Attendance History</h1>
        <p className="msm-page-subtitle">Every leave you&apos;ve marked, with full details.</p>
      </div>

      {leaves.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
          No leaves recorded yet. Perfect attendance so far.
        </p>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{leave.subject.name}</p>
                  <p className="text-sm text-slate-500">{formatDate(leave.date)}</p>
                  {leave.timetableEntry && (
                    <p className="text-xs text-slate-500">
                      {formatClassTimeRange(
                        leave.timetableEntry.startTime,
                        leave.timetableEntry.endTime
                      )}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${leaveTypeBadgeClass(leave.type)}`}
                >
                  {leaveTypeLabel(leave.type)}
                </span>
              </div>
              {leave.reason && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
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
