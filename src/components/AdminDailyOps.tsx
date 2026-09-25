"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ListChecks,
  Cake,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDashed,
  RefreshCw,
} from "lucide-react";
import type { AdminOpsDashboard } from "@/lib/ops/load-dashboard";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function statusStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "missed":
    case "failed":
      return "bg-red-50 text-red-800 ring-red-200";
    case "running":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "missed" || status === "failed") return <AlertCircle className="h-4 w-4 text-red-600" />;
  if (status === "running") return <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />;
  return <CircleDashed className="h-4 w-4 text-slate-400" />;
}

type Props = {
  onError?: (message: string) => void;
  onMessage?: (message: string) => void;
};

export function AdminDailyOps({ onError, onMessage }: Props) {
  const [ops, setOps] = useState<AdminOpsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningTask, setRunningTask] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    onError?.("");
    try {
      const res = await fetch("/api/admin/ops");
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.error || "Failed to load today's tasks");
      setOps(data);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Failed to load today's tasks");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  async function runTask(taskKey: string, istDate?: string) {
    setRunningTask(taskKey);
    onError?.("");
    try {
      const body: Record<string, string | boolean> = { force: true };
      if (taskKey === "weekly_leave") body.task = "weekly_leave";
      else if (taskKey === "birthday") body.task = "birthday_eve";
      else body.task = "morning_refresh";
      if (istDate) body.istDate = istDate;

      const res = await fetch("/api/admin/ops-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Task failed");

      const sent = data.result?.sent ?? data.result?.emailsSent;
      onMessage?.(
        sent != null
          ? `Task completed — ${sent} email(s) sent.`
          : "Task completed successfully."
      );
      await load();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Task failed");
    } finally {
      setRunningTask(null);
    }
  }

  if (loading && !ops) {
    return (
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Loading today&apos;s tasks…
      </section>
    );
  }

  if (!ops) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ListChecks className="h-5 w-5 text-violet-700" />
            Today&apos;s automated tasks
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {ops.dateLabel} · refreshed each morning with news · tap Run now for missed jobs
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Scheduled" value={ops.summary.total} />
        <Stat label="Completed" value={ops.summary.completed} accent="text-emerald-700" />
        <Stat label="Pending" value={ops.summary.pending} accent="text-cyan-700" />
        <Stat label="Missed / failed" value={ops.summary.missed + ops.summary.failed} accent="text-red-700" />
      </div>

      <div className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        {ops.tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No automated tasks scheduled for today.</p>
        ) : (
          ops.tasks.map((task) => (
            <div key={`${task.istDate}-${task.taskKey}`} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <StatusIcon status={task.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${statusStyle(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {task.scheduledAtIst}
                    {task.completedAt && <> · done {formatTime(task.completedAt.toString())}</>}
                  </p>
                  {(task.status === "pending" || task.status === "missed" || task.status === "failed") &&
                    (task.taskKey === "weekly_leave" || task.taskKey === "birthday") && (
                      <button
                        type="button"
                        disabled={!!runningTask}
                        onClick={() => runTask(task.taskKey, task.istDate)}
                        className="mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        {runningTask === task.taskKey ? "Sending…" : "Run now"}
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-slate-400">Last refreshed {formatTime(ops.refreshedAt)} IST</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Cake className="h-5 w-5 text-pink-600" />
          Upcoming birthdays (14 days)
        </h3>
        {ops.upcomingBirthdays.length === 0 ? (
          <p className="text-sm text-slate-500">No birthdays with profile data in the next 2 weeks.</p>
        ) : (
          <div className="space-y-2">
            {ops.upcomingBirthdays.map((b) => (
              <div
                key={`${b.rollNumber}-${b.istDate}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
              >
                <div>
                  <p className="font-medium text-slate-900">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.rollNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{b.dateLabel}</p>
                  <p className="text-xs text-slate-500">
                    {b.hasEmail ? "11:59 PM eve mail" : "⚠ no college email"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
