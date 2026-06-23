"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { BarChart3, RefreshCw, Users, MousePointerClick, CalendarDays } from "lucide-react";
import type { AnalyticsReport } from "@/lib/analytics/query";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState<string>("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user?.canAdmin && me.user?.rollNumber?.toUpperCase() !== "25M136") {
        router.replace("/dashboard");
        return;
      }
      setUserName(me.user?.name || "");

      const res = await fetch("/api/analytics");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load analytics");
      setReport(data);
      setActiveDay((prev) => prev || data.dates?.[0] || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const day = report?.byDate.find((d) => d.date === activeDay);

  return (
    <NavShell userName={userName} canAdmin>
      <div className="msm-page-header mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="msm-page-title">Analytics</h1>
              <p className="msm-page-subtitle">
                Tab visits · last {report?.lookbackDays ?? 5} days (IST) · Ram only
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !report && (
        <div className="msm-card py-12 text-center text-sm text-slate-500">Loading insights…</div>
      )}

      {error && (
        <div className="msm-card border-red-200 bg-red-50 py-8 text-center text-sm text-red-800">{error}</div>
      )}

      {report && (
        <>
          <p className="mb-4 text-sm font-medium text-slate-600">{report.rangeLabel}</p>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={MousePointerClick}
              label="Total visits"
              value={report.summary.totalVisits}
              accent="from-cyan-500 to-blue-600"
            />
            <SummaryCard
              icon={Users}
              label="Unique visitors"
              value={report.summary.uniqueVisitors}
              accent="from-violet-500 to-purple-600"
            />
            <SummaryCard
              icon={CalendarDays}
              label="Days tracked"
              value={report.lookbackDays}
              accent="from-emerald-500 to-teal-600"
            />
          </div>

          <section className="mb-6 msm-card">
            <h2 className="mb-4 text-base font-bold text-slate-900">Tab popularity (5-day total)</h2>
            {report.summary.byTab.length === 0 ? (
              <p className="text-sm text-slate-500">No visits recorded yet. Data appears as people use the app.</p>
            ) : (
              <div className="space-y-3">
                {report.summary.byTab.map((t) => {
                  const pct =
                    report.summary.totalVisits > 0
                      ? Math.round((t.visits / report.summary.totalVisits) * 100)
                      : 0;
                  return (
                    <div key={t.tab}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-800">{t.tab}</span>
                        <span className="text-slate-500">
                          {t.visits} visits · {t.uniqueUsers} users
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-4">
            <h2 className="mb-3 text-base font-bold text-slate-900">Day by day</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {report.byDate.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setActiveDay(d.date)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeDay === d.date
                      ? "bg-cyan-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {d.dateLabel.split(",")[0]}
                </button>
              ))}
            </div>
          </section>

          {day && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="msm-card">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{day.dateLabel}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{day.totalVisits}</p>
                  <p className="text-sm text-slate-500">total visits</p>
                </div>
                <div className="msm-card">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Unique visitors</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{day.uniqueVisitors}</p>
                  <p className="text-sm text-slate-500">students that day</p>
                </div>
              </div>

              <section className="msm-card">
                <h3 className="mb-3 text-sm font-bold text-slate-900">Tabs visited · {day.dateLabel}</h3>
                {day.byTab.length === 0 ? (
                  <p className="text-sm text-slate-500">No activity this day.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[320px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                          <th className="py-2 pr-4">Tab</th>
                          <th className="py-2 pr-4">Visits</th>
                          <th className="py-2">Unique users</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.byTab.map((t) => (
                          <tr key={t.tab} className="border-b border-slate-50">
                            <td className="py-2.5 pr-4 font-medium text-slate-800">{t.tab}</td>
                            <td className="py-2.5 pr-4 text-slate-600">{t.visits}</td>
                            <td className="py-2.5 text-slate-600">{t.uniqueUsers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="msm-card">
                <h3 className="mb-3 text-sm font-bold text-slate-900">Who visited what · {day.dateLabel}</h3>
                {day.visitors.length === 0 ? (
                  <p className="text-sm text-slate-500">No visitors recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {day.visitors.map((v) => (
                      <div
                        key={v.userId}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 sm:px-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{v.name}</p>
                            <p className="text-xs text-slate-500">{v.rollNumber}</p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <p>{v.visits} visits</p>
                            <p>Last · {formatTime(v.lastVisitAt)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {v.tabs.map((tab) => (
                            <span
                              key={tab}
                              className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100"
                            >
                              {tab}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </NavShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="msm-card flex items-center gap-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
