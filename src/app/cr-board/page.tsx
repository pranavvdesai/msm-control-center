"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { cn } from "@/lib/utils";
import { Search, AlertTriangle, Users, ClipboardList } from "lucide-react";

type SubjectCol = {
  id: string;
  name: string;
  code: string;
  credits: number;
  maxLeaves: number;
};

type StudentRow = {
  id: string;
  name: string;
  rollNumber: string;
  totalRegular: number;
  totalCondoned: number;
  atRisk: boolean;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    credits: number;
    maxLeaves: number;
    regularAbsences: number;
    condonedLeaves: number;
    effectiveLeaves: number;
    remainingLeaves: number;
  }>;
};

type BoardData = {
  subjects: SubjectCol[];
  students: StudentRow[];
  summary: { totalStudents: number; atRiskCount: number; criticalCount: number };
};

type Filter = "all" | "at-risk" | "has-leaves";

function leaveCellClass(remaining: number) {
  if (remaining === 0) return "bg-red-100 text-red-800 ring-1 ring-red-200";
  if (remaining === 1) return "bg-orange-100 text-orange-800 ring-1 ring-orange-200";
  return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
}

export default function CrBoardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user?.canCrBoard && d.user?.rollNumber?.toUpperCase() !== "25M149") {
          router.replace("/dashboard");
          return;
        }
        setUserName(d.user?.name || "");
      });

    fetch("/api/cr-board")
      .then((r) => {
        if (r.status === 403) {
          router.replace("/dashboard");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      });
  }, [router]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.students.filter((s) => {
      if (filter === "at-risk" && !s.atRisk) return false;
      if (filter === "has-leaves" && s.totalRegular === 0 && s.totalCondoned === 0) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
      );
    });
  }, [data, search, filter]);

  if (loading || !data) {
    return (
      <NavShell userName={userName}>
        <div className="flex h-64 items-center justify-center text-slate-500">Loading CR Board...</div>
      </NavShell>
    );
  }

  return (
    <NavShell userName={userName} canCrBoard>
      <div className="msm-page-header">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="msm-page-title">CR&apos;s Board</h1>
            <p className="msm-page-subtitle">
              Cohort leave overview — every student, every subject. For Bhavya&apos;s eyes only.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3">
        <div className="msm-card py-3 text-center">
          <Users className="mx-auto mb-1 h-4 w-4 text-cyan-700" />
          <p className="text-lg font-bold text-slate-900">{data.summary.totalStudents}</p>
          <p className="text-[10px] uppercase text-slate-500">Students</p>
        </div>
        <div className="msm-card py-3 text-center">
          <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-orange-600" />
          <p className="text-lg font-bold text-orange-700">{data.summary.atRiskCount}</p>
          <p className="text-[10px] uppercase text-slate-500">≤1 leave left</p>
        </div>
        <div className="msm-card py-3 text-center">
          <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-red-600" />
          <p className="text-lg font-bold text-red-700">{data.summary.criticalCount}</p>
          <p className="text-[10px] uppercase text-slate-500">0 leaves left</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or roll number..."
            className="msm-input pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {(
            [
              ["all", "All"],
              ["at-risk", "At risk"],
              ["has-leaves", "Has leaves"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                filter === key
                  ? "bg-cyan-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: accordion cards */}
      <div className="space-y-2 md:hidden">
        {filtered.map((student) => (
          <div key={student.id} className="msm-card overflow-hidden p-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              onClick={() =>
                setExpandedId(expandedId === student.id ? null : student.id)
              }
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{student.name}</p>
                <p className="text-xs text-slate-500">{student.rollNumber}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs">
                {student.atRisk && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
                    At risk
                  </span>
                )}
                <span className="text-slate-500">
                  R:{student.totalRegular} C:{student.totalCondoned}
                </span>
              </div>
            </button>
            {expandedId === student.id && (
              <div className="space-y-2 border-t border-slate-100 px-4 py-3">
                {student.subjects.map((sub) => (
                  <div
                    key={sub.subjectId}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{sub.subjectName}</p>
                        <p className="text-[10px] text-slate-500">
                          {sub.subjectCode} · {sub.credits} cr · max {sub.maxLeaves} leaves
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          leaveCellClass(sub.remainingLeaves)
                        )}
                      >
                        {sub.remainingLeaves} left
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-600">
                      Regular {sub.regularAbsences} · Condoned {sub.condonedLeaves} · Effective{" "}
                      {sub.effectiveLeaves}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: scrollable matrix */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Student
                </th>
                <th className="px-2 py-3 text-xs font-semibold uppercase text-slate-500">Roll</th>
                {data.subjects.map((sub) => (
                  <th
                    key={sub.id}
                    className="min-w-[7.5rem] px-2 py-3 text-center text-[10px] font-semibold uppercase text-slate-500"
                  >
                    <span className="block leading-tight text-slate-800">{sub.name}</span>
                    <span className="font-normal text-slate-400">
                      {sub.credits} cr · max {sub.maxLeaves}
                    </span>
                  </th>
                ))}
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                  Totals
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  className={cn(
                    "border-b border-slate-100 transition hover:bg-slate-50/80",
                    student.atRisk && "bg-orange-50/40"
                  )}
                >
                  <td className="sticky left-0 z-10 bg-white px-3 py-2.5 font-medium text-slate-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    {student.name}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-xs text-slate-600">
                    {student.rollNumber}
                  </td>
                  {student.subjects.map((sub) => (
                    <td key={sub.subjectId} className="px-1 py-2 text-center">
                      <div
                        className={cn(
                          "mx-auto inline-flex min-w-[4.5rem] flex-col rounded-lg px-2 py-1 text-[10px] leading-tight",
                          leaveCellClass(sub.remainingLeaves)
                        )}
                        title={`Regular: ${sub.regularAbsences}, Condoned: ${sub.condonedLeaves}`}
                      >
                        <span className="font-bold">{sub.remainingLeaves} left</span>
                        <span className="opacity-80">
                          R{sub.regularAbsences}/C{sub.condonedLeaves}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center text-xs text-slate-600">
                    <span className="font-semibold text-red-700">{student.totalRegular}</span>
                    <span className="text-slate-300"> / </span>
                    <span className="font-semibold text-violet-700">{student.totalCondoned}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">No students match your search.</p>
      )}
    </NavShell>
  );
}
