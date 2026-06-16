"use client";

import { motion } from "framer-motion";

export function RiskMeter({ score }: { score: number }) {
  const level =
    score >= 80 ? "safe" : score >= 50 ? "caution" : score >= 25 ? "warning" : "critical";

  const config = {
    safe: {
      color: "from-emerald-500 to-cyan-500",
      label: "Hero Mode",
      message: "All is well. Attendance under control.",
      glow: "shadow-emerald-500/20",
    },
    caution: {
      color: "from-amber-500 to-yellow-500",
      label: "Caution Zone",
      message: "Ek aur leave… picture abhi baaki hai.",
      glow: "shadow-amber-500/20",
    },
    warning: {
      color: "from-orange-500 to-red-500",
      label: "Danger Zone",
      message: "Faculty has started noticing your patterns.",
      glow: "shadow-orange-500/20",
    },
    critical: {
      color: "from-red-600 to-rose-600",
      label: "Subgrade Mode",
      message: "Beta… ek aur leave liya toh problem hoga.",
      glow: "shadow-red-500/30",
    },
  };

  const c = config[level];

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg ${c.glow}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Attendance Health</p>
          <p className="mt-1 text-xl font-black text-white">{c.label}</p>
        </div>
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
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
          <span className="absolute text-lg font-black text-white">{score}%</span>
        </motion.div>
      </div>
      <p className="mt-3 text-sm text-zinc-400">{c.message}</p>
    </div>
  );
}
