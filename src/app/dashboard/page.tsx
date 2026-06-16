"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { NavShell } from "@/components/NavShell";
import { SubjectCard } from "@/components/SubjectCard";
import { SocialFeed } from "@/components/SocialFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { RiskMeter } from "@/components/RiskMeter";
import { RefreshCw } from "lucide-react";

type DashboardData = {
  user: { name: string; role: string };
  settings: { crName: string; cohortName: string; cohortFull: string; termInfo?: string } | null;
  subjectStats: Array<{
    subjectName: string;
    credits: number;
    maxLeaves: number;
    regularAbsences: number;
    condonedLeaves: number;
    effectiveLeaves: number;
    remainingLeaves: number;
    alert: { level: "safe" | "caution" | "warning" | "critical"; message: string };
  }>;
  todayClasses: Array<{
    id: string;
    startTime: string;
    endTime: string;
    room: string | null;
    faculty: string | null;
    subject: { name: string; code: string };
  }>;
  feed: Array<{ id: string; message: string; type: string; createdAt: string }>;
  summary: { totalRegular: number; totalCondoned: number; riskScore: number };
};

type LeaderboardData = {
  leaderboard: Array<{
    id: string;
    name: string;
    rank: number;
    attendanceScore: number;
    regular: number;
    condoned: number;
    isYou: boolean;
  }>;
  cohortStats: { totalStudents: number; leavesToday: number; totalRegular: number };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [dash, lb] = await Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/leaderboard").then((r) => r.json()),
    ]);
    setData(dash);
    setLeaderboard(lb);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  function handleRefresh() {
    setRefreshing(true);
    load();
  }

  if (!data) {
    return (
      <NavShell>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-zinc-500">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500"
          />
          <p>Initializing Control Center...</p>
        </div>
      </NavShell>
    );
  }

  return (
    <NavShell userName={data.user.name} isAdmin={data.user.role === "ADMIN"}>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-[#0a0a1a] to-violet-500/10 p-6"
      >
        <div className="absolute right-4 top-4">
          <button
            onClick={handleRefresh}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:text-cyan-400"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">
          {data.settings?.termInfo || "Term 4 · TAPMI Manipal"}
        </p>
        <h1 className="mt-2 text-2xl font-black text-white md:text-4xl">
          MSM Control Center — CR: {data.settings?.crName || "Raam"}
        </h1>
        <p className="mt-2 text-zinc-400">
          Welcome back, <span className="text-white font-semibold">{data.user.name}</span>.
          Your attendance radar is live.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge label="Regular absences" value={data.summary.totalRegular} color="red" />
          <Badge label="Condoned leaves" value={data.summary.totalCondoned} color="violet" />
          <Badge label="Subjects tracked" value={data.subjectStats.length} color="cyan" />
        </div>
      </motion.section>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <RiskMeter score={data.summary.riskScore} />
        {leaderboard && (
          <Leaderboard entries={leaderboard.leaderboard} stats={leaderboard.cohortStats} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Today&apos;s Classes
            </h2>
            {data.todayClasses.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-zinc-500">
                No classes today. Faculty thinks you&apos;re still sleeping.
              </p>
            ) : (
              <div className="space-y-2">
                {data.todayClasses.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 transition hover:border-cyan-500/20"
                  >
                    <div>
                      <p className="font-medium text-white">{c.subject.name}</p>
                      <p className="text-xs text-zinc-500">
                        {c.startTime} – {c.endTime} · {c.room || "G2"} · {c.faculty || "Faculty"}
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                      {c.subject.code}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Subject Intelligence</h2>
            {data.subjectStats.length === 0 ? (
              <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
                No subjects loaded yet. Admin: upload TERM 4 MBA-MKT TT.xlsx from Upload TT tab.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.subjectStats.map((s) => (
                  <SubjectCard key={s.subjectName} {...s} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div>
          <SocialFeed items={data.feed} />
        </div>
      </div>
    </NavShell>
  );
}

function Badge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "red" | "violet" | "cyan";
}) {
  const colors = {
    red: "border-red-500/20 text-red-300",
    violet: "border-violet-500/20 text-violet-300",
    cyan: "border-cyan-500/20 text-cyan-300",
  };
  return (
    <div className={`rounded-xl border bg-black/30 px-3 py-2 ${colors[color]}`}>
      <p className="text-[10px] uppercase opacity-70">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
