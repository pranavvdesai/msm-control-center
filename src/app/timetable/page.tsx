"use client";

import { useCallback, useEffect, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { GlowButton } from "@/components/GlowButton";
import {
  formatDate,
  formatClassTimeRange,
  sortByStartTime,
  toLocalDateKey,
} from "@/lib/utils";
import { Pencil, Plus, Trash2, X } from "lucide-react";

type Entry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string | null;
  faculty: string | null;
  subject: { id?: string; name: string; code: string };
};

type Subject = {
  id: string;
  name: string;
  code: string;
  credits: number;
  faculty: string | null;
};

type FormState = {
  date: string;
  subjectId: string;
  newSubject: boolean;
  subjectCode: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  faculty: string;
  room: string;
};

const emptyForm = (): FormState => ({
  date: toLocalDateKey(new Date()),
  subjectId: "",
  newSubject: false,
  subjectCode: "",
  subjectName: "",
  startTime: "09:00",
  endTime: "10:30",
  faculty: "",
  room: "G2",
});

function timeInputValue(time: string): string {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return "09:00";
  let h = parseInt(m[1], 10);
  const min = m[2];
  const mer = m[3]?.toUpperCase();
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function formFromEntry(entry: Entry): FormState {
  return {
    date: entry.date.slice(0, 10),
    subjectId: entry.subject.id || "",
    newSubject: false,
    subjectCode: entry.subject.code,
    subjectName: entry.subject.name,
    startTime: timeInputValue(entry.startTime),
    endTime: timeInputValue(entry.endTime),
    faculty: entry.faculty || "",
    room: entry.room || "",
  };
}

export default function TimetablePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [canAdmin, setCanAdmin] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadEntries = useCallback(() => {
    fetch(`/api/timetable?month=${month}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []));
  }, [month]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUserName(d.user?.name || "");
        setIsAdmin(d.user?.role === "ADMIN");
        setCanAdmin(!!d.user?.canAdmin);
        setCanManage(!!d.user?.canManageTimetable);
      });
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (!canManage) return;
    fetch("/api/timetable/subjects")
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects || []));
  }, [canManage]);

  function openAdd(date?: string) {
    setEditingId(null);
    setForm({ ...emptyForm(), date: date || emptyForm().date });
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(entry: Entry) {
    setEditingId(entry.id);
    setForm(formFromEntry(entry));
    setMessage("");
    setModalOpen(true);
  }

  async function saveClass() {
    setSaving(true);
    setMessage("");

    const payload: Record<string, string | number | boolean> = {
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      faculty: form.faculty,
      room: form.room,
    };

    if (form.newSubject) {
      payload.subjectCode = form.subjectCode.trim();
      payload.subjectName = form.subjectName.trim();
    } else {
      payload.subjectId = form.subjectId;
    }

    try {
      const url = editingId ? `/api/timetable/${editingId}` : "/api/timetable/entry";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setModalOpen(false);
      loadEntries();
      if (form.newSubject) {
        fetch("/api/timetable/subjects")
          .then((r) => r.json())
          .then((d) => setSubjects(d.subjects || []));
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    }
    setSaving(false);
  }

  async function deleteClass(entry: Entry) {
    if (
      !confirm(
        `Remove ${entry.subject.name} on ${formatDate(entry.date)} (${formatClassTimeRange(entry.startTime, entry.endTime)})?`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/timetable/${entry.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Could not delete class");
      return;
    }
    loadEntries();
  }

  const grouped = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    const key = entry.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <NavShell userName={userName} isAdmin={isAdmin} canAdmin={canAdmin}>
      <div className="msm-page-header flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="msm-page-title">Timetable</h1>
          <p className="msm-page-subtitle">
            Full schedule — chronological order.
            {canManage && (
              <span className="mt-1 block text-cyan-700">
                You can add, edit, or remove classes — changes are visible to everyone.
              </span>
            )}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {canManage && (
            <GlowButton type="button" onClick={() => openAdd()} className="w-full sm:w-auto">
              <Plus className="mr-2 inline h-4 w-4" />
              Add class
            </GlowButton>
          )}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="msm-input w-full sm:w-auto"
          />
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">No timetable entries for this month.</p>
          {canManage && (
            <GlowButton type="button" className="mt-4" onClick={() => openAdd()}>
              Add first class
            </GlowButton>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dayEntries = sortByStartTime(grouped[date]);
            return (
              <div key={date} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-cyan-700">{formatDate(date)}</h2>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => openAdd(date)}
                      className="text-xs font-medium text-cyan-700 hover:text-cyan-900"
                    >
                      + Add on this day
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {dayEntries.map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-col gap-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium text-slate-900">{e.subject.name}</p>
                        <p className="text-xs text-cyan-700">{e.subject.code}</p>
                        <p className="text-xs text-slate-500">
                          Prof. {e.faculty || "TBA"} · {e.room || "Room TBA"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium text-violet-700">
                          {formatClassTimeRange(e.startTime, e.endTime)}
                        </span>
                        {canManage && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(e)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-cyan-700"
                              title="Edit class"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteClass(e)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-red-600"
                              title="Remove class"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingId ? "Edit class" : "Add class"}
                </h2>
                <p className="text-sm text-slate-500">
                  Updates apply for the whole cohort immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="msm-input w-full"
                />
              </label>

              <div className="flex items-center gap-2">
                <input
                  id="newSubject"
                  type="checkbox"
                  checked={form.newSubject}
                  onChange={(e) => setForm({ ...form, newSubject: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="newSubject" className="text-sm text-slate-700">
                  Add new subject
                </label>
              </div>

              {form.newSubject ? (
                <>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Subject code</span>
                    <input
                      type="text"
                      placeholder="e.g. MSM 6503"
                      value={form.subjectCode}
                      onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
                      className="msm-input w-full"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Subject name</span>
                    <input
                      type="text"
                      placeholder="Course title"
                      value={form.subjectName}
                      onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                      className="msm-input w-full"
                    />
                  </label>
                </>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Subject</span>
                  <select
                    value={form.subjectId}
                    onChange={(e) => {
                      const sub = subjects.find((s) => s.id === e.target.value);
                      setForm({
                        ...form,
                        subjectId: e.target.value,
                        subjectCode: sub?.code || "",
                        subjectName: sub?.name || "",
                        faculty: sub?.faculty || form.faculty,
                      });
                    }}
                    className="msm-input w-full"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Start time</span>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="msm-input w-full"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">End time</span>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="msm-input w-full"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Faculty</span>
                <input
                  type="text"
                  placeholder="Professor name"
                  value={form.faculty}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                  className="msm-input w-full"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Room</span>
                <input
                  type="text"
                  placeholder="G2"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="msm-input w-full"
                />
              </label>
            </div>

            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}

            <div className="mt-5 flex gap-2">
              <GlowButton
                type="button"
                className="flex-1"
                onClick={saveClass}
                disabled={saving}
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Add class"}
              </GlowButton>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </NavShell>
  );
}
