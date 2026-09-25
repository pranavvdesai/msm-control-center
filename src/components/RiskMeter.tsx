"use client";

import { motion } from "framer-motion";

export function RiskMeter({ score }: { score: number }) {
  const level =
    score >= 80 ? "safe" : score >= 50 ? "caution" : score >= 25 ? "warning" : "critical";

  const config = {
    safe: {
      color: "from-emerald-500 to-cyan-500",
      label: "All Clear",
      message: "All is well. Attendance under control.",
      glow: "shadow-emerald-500/10",
    },
    caution: {
      color: "from-amber-500 to-yellow-500",
      label: "Caution Zone",
      message: "Ek aur leave… picture abhi baaki hai.",
      glow: "shadow-amber-500/10",
    },
    warning: {
      color: "from-orange-500 to-red-500",
      label: "Danger Zone",
      message: "Faculty has started noticing your patterns.",
      glow: "shadow-orange-500/10",
    },
    critical: {
      color: "from-red-600 to-rose-600",
      label: "Subgrade Mode",
      message: "Beta… ek aur leave liya toh problem hoga.",
      glow: "shadow-red-500/15",
    },
  };

  const c = config[level];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${c.glow}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium uppercase tracking-widest text-slate-500 sm:text-xs">Attendance Health</p>
          <p className="mt-1 text-2xl font-black text-slate-900 sm:text-xl">{c.label}</p>
          <p className="mt-2 text-base leading-relaxed text-slate-600 sm:mt-3 sm:text-sm">{c.message}</p>
        </div>
        <motion.div
          className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center sm:mx-0 sm:h-20 sm:w-20"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="8" />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#riskGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score * 2.64} 264`}
              initial={{ strokeDasharray: "0 264" }}
              animate={{ strokeDasharray: `${score * 2.64} 264` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className={`${c.color.split(" ")[0].replace("from-", "text-")}`} stopColor="currentColor" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute text-xl font-black text-slate-900 sm:text-lg">{score}%</span>
        </motion.div>
      </div>
    </div>
  );
}
