"use client";

import { useEffect, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { formatDate, formatClassTimeRange, formatTimeOfDay } from "@/lib/utils";
import {
  type LeaveType,
  countLeavesByType,
  leaveTypeBadgeClass,
  leaveTypeLabel,
} from "@/lib/leaves";

type LeaveRecord = {
  id: string;
  date: string;
  type: LeaveType;
  reason: string | null;
  subject: { name: string; code: string };
  timetableEntry: { startTime: string; endTime: string } | null;
};

type ArchivedLeave = {
  id: string;
  markedAt: string;
  subjectName: string;
  type: LeaveType;
};

export default function HistoryPage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [term4Leaves, setTerm4Leaves] = useState<ArchivedLeave[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));

    fetch("/api/leaves")
      .then((r) => r.json())
      .then((d) => setLeaves(d.leaves || []));

    fetch("/api/leaves/term4")
      .then((r) => r.json())
      .then((d) => setTerm4Leaves(d.leaves || []));
  }, []);

  const term4Counts = countLeavesByType(term4Leaves);

  return (
    <NavShell userName={userName}>
      <div className="msm-page-header">
        <h1 className="msm-page-title">Attendance History</h1>
        <p className="msm-page-subtitle">Every leave you&apos;ve marked, with full details.</p>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Term 5</h2>
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

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Term 4 archive</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rebuilt from the class feed. Dates show when each leave was marked, not the class date,
          and leaves you removed afterwards may still appear — treat this as a rough record, not
          official attendance.
        </p>

        {term4Leaves.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
            No Term 4 leaves found for you.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-700">
              {term4Leaves.length} marked · {term4Counts.regularAbsences} regular ·{" "}
              {term4Counts.condonedLeaves} condoned · {term4Counts.lateMarks} late
            </p>
            <div className="mt-3 space-y-3">
              {term4Leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{leave.subjectName}</p>
                      <p className="text-sm text-slate-500">
                        Marked {formatDate(leave.markedAt)} · {formatTimeOfDay(leave.markedAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${leaveTypeBadgeClass(leave.type)}`}
                    >
                      {leaveTypeLabel(leave.type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </NavShell>
  );
}
