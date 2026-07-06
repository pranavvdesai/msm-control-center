"use client";

import { useCallback, useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { NavShell } from "@/components/NavShell";
import { GlowButton } from "@/components/GlowButton";
import { formatDate, formatClassTimeRange, toIstDateKey } from "@/lib/utils";
import { CalendarDays, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LeaveType,
  leaveTypeBadgeClass,
  leaveTypeLabel,
  leaveTypeShortLabel,
} from "@/lib/leaves";

type Lecture = {
  id: string;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: { name: string; code: string; credits: number };
};

type MarkedLeave = {
  id: string;
  type: LeaveType;
  reason: string | null;
  timetableEntryId: string | null;
  subject: { name: string; code: string };
  timetableEntry: { startTime: string; endTime: string } | null;
};

function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-xs font-bold text-white">
        {n}
      </span>
      <h2 className="font-semibold text-slate-900">{label}</h2>
    </div>
  );
}

export default function LeavePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [markedLeaves, setMarkedLeaves] = useState<MarkedLeave[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));
  }, []);

  const loadDate = useCallback(async (date: Date) => {
    const dateStr = toIstDateKey(date);
    const data = await fetch(`/api/leaves?date=${dateStr}`).then((r) => r.json());
    setLectures(data.entries || []);
    setMarkedLeaves(data.leaves || []);
    setSelectedLecture(null);
    setLeaveType(null);
    setReason("");
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    loadDate(selectedDate);
  }, [selectedDate, loadDate]);

  function leaveForLecture(lectureId: string) {
    return markedLeaves.find((l) => l.timetableEntryId === lectureId);
  }

  async function submitLeave() {
    if (!selectedLecture || !leaveType) return;
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timetableEntryId: selectedLecture.id,
        type: leaveType,
        reason: leaveType === "CONDONED" ? reason : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to mark leave");
      return;
    }

    setMessage(
      leaveType === "REGULAR"
        ? "Regular absence recorded. Faculty radar updated."
        : leaveType === "LATE"
          ? "Late marked for your records."
          : "Condoned leave saved for your reference."
    );
    if (selectedDate) loadDate(selectedDate);
  }

  async function deleteLeave(leave: MarkedLeave) {
    if (
      !confirm(
        `Remove this ${leaveTypeLabel(leave.type).toLowerCase()} for ${leave.subject.name}?`
      )
    ) {
      return;
    }

    setDeletingId(leave.id);
    setMessage("");

    const res = await fetch(`/api/leaves/${leave.id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Failed to delete leave");
      return;
    }

    setMessage("Leave removed. You can mark again if needed.");
    if (selectedDate) loadDate(selectedDate);
  }

  return (
    <NavShell userName={userName}>
      <div className="msm-page-header">
        <h1 className="msm-page-title">Mark Leave</h1>
        <p className="msm-page-subtitle">
          Pick a date and lecture, choose the absence type. Made a mistake? Delete it from the list.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="msm-card p-3 sm:p-5">
          <StepBadge n={1} label="Select date" />
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <div className="flex min-w-[280px] justify-center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={{ after: new Date() }}
              />
            </div>
          </div>
          {selectedDate && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-cyan-700">
              <CalendarDays className="h-4 w-4" />
              {formatDate(selectedDate)}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {markedLeaves.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-amber-900">Marked on this date</h2>
              <div className="space-y-2">
                {markedLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-amber-200/80 bg-white px-3 py-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{leave.subject.name}</p>
                      {leave.timetableEntry && (
                        <p className="text-xs text-slate-500">
                          {formatClassTimeRange(
                            leave.timetableEntry.startTime,
                            leave.timetableEntry.endTime
                          )}
                        </p>
                      )}
                      <span
                        className={cn(
                          "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          leaveTypeBadgeClass(leave.type)
                        )}
                      >
                        {leaveTypeShortLabel(leave.type)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteLeave(leave)}
                      disabled={deletingId === leave.id}
                      className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      aria-label="Delete leave"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="msm-card">
            <StepBadge n={2} label="Select lecture" />
            {lectures.length === 0 ? (
              <p className="text-sm text-slate-500">No lectures on this date.</p>
            ) : (
              <div className="space-y-2">
                {lectures.map((lec) => {
                  const marked = leaveForLecture(lec.id);
                  return (
                    <button
                      key={lec.id}
                      type="button"
                      onClick={() => {
                        if (marked) return;
                        setSelectedLecture(lec);
                        setLeaveType(null);
                        setReason("");
                      }}
                      disabled={!!marked}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition",
                        marked
                          ? "cursor-not-allowed border-emerald-200 bg-emerald-50"
                          : selectedLecture?.id === lec.id
                            ? "border-cyan-400 bg-cyan-50 ring-2 ring-cyan-200"
                            : "border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">{lec.subject.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatClassTimeRange(lec.startTime, lec.endTime)} · Max{" "}
                            {lec.subject.credits} leaves
                          </p>
                        </div>
                        {marked && (
                          <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Marked
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedLecture && !leaveForLecture(selectedLecture.id) && (
            <div className="msm-card">
              <StepBadge n={3} label="Leave type" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setLeaveType("REGULAR")}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm transition",
                    leaveType === "REGULAR"
                      ? "border-red-300 bg-red-50 text-red-800 ring-2 ring-red-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-red-200"
                  )}
                >
                  <span className="font-semibold">Regular absence</span>
                  <p className="mt-1 text-[10px] text-slate-500">Counts as 1 absence</p>
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveType("LATE")}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm transition",
                    leaveType === "LATE"
                      ? "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-amber-200"
                  )}
                >
                  <span className="font-semibold">Late</span>
                  <p className="mt-1 text-[10px] text-slate-500">Professor marked you late</p>
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveType("CONDONED")}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm transition",
                    leaveType === "CONDONED"
                      ? "border-violet-300 bg-violet-50 text-violet-800 ring-2 ring-violet-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-violet-200"
                  )}
                >
                  <span className="font-semibold">Condoned leave</span>
                  <p className="mt-1 text-[10px] text-slate-500">Personal reference only</p>
                </button>
              </div>

              {leaveType === "CONDONED" && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason: medical, placement interview, family emergency..."
                  className="msm-input mt-3 min-h-[5rem] resize-none py-2"
                  rows={3}
                />
              )}

              {leaveType && (
                <GlowButton
                  className="mt-4 w-full"
                  onClick={submitLeave}
                  disabled={loading || (leaveType === "CONDONED" && !reason.trim())}
                >
                  {loading ? "Saving..." : "Confirm leave"}
                </GlowButton>
              )}
            </div>
          )}

          {message && (
            <p
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm",
                message.toLowerCase().includes("fail") || message.toLowerCase().includes("error")
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-cyan-200 bg-cyan-50 text-cyan-900"
              )}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </NavShell>
  );
}
