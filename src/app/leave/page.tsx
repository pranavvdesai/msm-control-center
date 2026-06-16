"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { NavShell } from "@/components/NavShell";
import { GlowButton } from "@/components/GlowButton";
import { formatDate } from "@/lib/utils";

type Lecture = {
  id: string;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: { name: string; code: string; credits: number };
};

export default function LeavePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [leaveType, setLeaveType] = useState<"REGULAR" | "CONDONED" | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    fetch(`/api/leaves?date=${dateStr}`)
      .then((r) => r.json())
      .then((d) => {
        setLectures(d.entries || []);
        setSelectedLecture(null);
        setLeaveType(null);
        setReason("");
      });
  }, [selectedDate]);

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
        : "Condoned leave saved for your reference."
    );
    setSelectedLecture(null);
    setLeaveType(null);
    setReason("");
  }

  return (
    <NavShell userName={userName}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Mark Leave</h1>
        <p className="text-zinc-400">
          Select a date, pick the lecture, choose absence type.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h2 className="mb-3 font-semibold text-white">Step 1 — Select Date</h2>
          <div className="flex justify-center [&_.rdp]:text-white [&_.rdp-day_button]:text-zinc-200">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={{ after: new Date() }}
            />
          </div>
          {selectedDate && (
            <p className="mt-2 text-center text-sm text-cyan-400">
              {formatDate(selectedDate)}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h2 className="mb-3 font-semibold text-white">Step 2 — Select Lecture</h2>
            {lectures.length === 0 ? (
              <p className="text-sm text-zinc-500">No lectures on this date.</p>
            ) : (
              <div className="space-y-2">
                {lectures.map((lec) => (
                  <button
                    key={lec.id}
                    onClick={() => {
                      setSelectedLecture(lec);
                      setLeaveType(null);
                      setReason("");
                    }}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selectedLecture?.id === lec.id
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-white/10 bg-black/30 hover:bg-white/5"
                    }`}
                  >
                    <p className="font-medium text-white">{lec.subject.name}</p>
                    <p className="text-xs text-zinc-500">
                      {lec.startTime} – {lec.endTime} · Max {lec.subject.credits} leaves
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedLecture && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <h2 className="mb-3 font-semibold text-white">Step 3 — Leave Type</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLeaveType("REGULAR")}
                  className={`rounded-xl border px-3 py-3 text-sm ${
                    leaveType === "REGULAR"
                      ? "border-red-500/50 bg-red-500/10 text-red-300"
                      : "border-white/10 text-zinc-400"
                  }`}
                >
                  Regular Absence
                  <p className="mt-1 text-[10px] opacity-70">Counts against attendance</p>
                </button>
                <button
                  onClick={() => setLeaveType("CONDONED")}
                  className={`rounded-xl border px-3 py-3 text-sm ${
                    leaveType === "CONDONED"
                      ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                      : "border-white/10 text-zinc-400"
                  }`}
                >
                  Condoned Leave
                  <p className="mt-1 text-[10px] opacity-70">Personal reference only</p>
                </button>
              </div>

              {leaveType === "CONDONED" && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason: medical, placement interview, family emergency..."
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                  rows={3}
                />
              )}

              {leaveType && (
                <GlowButton
                  className="mt-4 w-full"
                  onClick={submitLeave}
                  disabled={loading || (leaveType === "CONDONED" && !reason.trim())}
                >
                  {loading ? "Saving..." : "Confirm Leave"}
                </GlowButton>
              )}
            </div>
          )}

          {message && (
            <p className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
              {message}
            </p>
          )}
        </div>
      </div>
    </NavShell>
  );
}
