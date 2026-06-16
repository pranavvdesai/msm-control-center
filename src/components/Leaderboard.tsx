"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, Users, Zap } from "lucide-react";

type LeaderboardEntry = {
  id: string;
  name: string;
  rank: number;
  attendanceScore: number;
  regular: number;
  condoned: number;
  isYou: boolean;
};

export function Leaderboard({
  entries,
  stats,
}: {
  entries: LeaderboardEntry[];
  stats: { totalStudents: number; leavesToday: number; totalRegular: number };
}) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="font-semibold text-amber-200">Class Leaderboard</h2>
        </div>
        <span className="text-xs text-zinc-500">By attendance score</span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <MiniStat icon={Users} label="Cohort" value={stats.totalStudents} />
        <MiniStat icon={Zap} label="Leaves today" value={stats.leavesToday} />
        <MiniStat icon={TrendingUp} label="Total absences" value={stats.totalRegular} />
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-500">No rankings yet. Be the first hero.</p>
        ) : (
          entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                entry.isYou
                  ? "border border-cyan-500/40 bg-cyan-500/10"
                  : "bg-black/30"
              }`}
            >
              <span className="w-6 text-center text-lg">
                {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-white">
                  {entry.name}
                  {entry.isYou && (
                    <span className="ml-1 text-xs text-cyan-400">(You)</span>
                  )}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {entry.regular} regular · {entry.condoned} condoned
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-bold ${
                    entry.attendanceScore >= 80
                      ? "text-emerald-400"
                      : entry.attendanceScore >= 50
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {entry.attendanceScore}%
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-black/30 px-2 py-2 text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-zinc-500" />
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
      <p className="text-[9px] uppercase text-zinc-600">{label}</p>
    </div>
  );
}
