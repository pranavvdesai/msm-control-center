"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertLevel = "safe" | "caution" | "warning" | "critical";

const levelStyles: Record<AlertLevel, string> = {
  safe: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  caution: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  warning: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  critical: "border-red-500/30 bg-red-500/10 text-red-300",
};

const icons = {
  safe: Shield,
  caution: Zap,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

export function SubjectCard({
  subjectName,
  credits,
  maxLeaves,
  regularAbsences,
  condonedLeaves,
  effectiveLeaves,
  remainingLeaves,
  alert,
}: {
  subjectName: string;
  credits: number;
  maxLeaves: number;
  regularAbsences: number;
  condonedLeaves: number;
  effectiveLeaves: number;
  remainingLeaves: number;
  alert: { level: AlertLevel; message: string };
}) {
  const Icon = icons[alert.level];
  const usedPct = (effectiveLeaves / maxLeaves) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold text-white">{subjectName}</h3>
          <p className="text-xs text-zinc-500">{credits} credits · max {maxLeaves} leaves</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs",
            remainingLeaves === 0
              ? "bg-red-500/20 text-red-300"
              : remainingLeaves === 1
                ? "bg-orange-500/20 text-orange-300"
                : "bg-cyan-500/20 text-cyan-300"
          )}
        >
          {remainingLeaves} {remainingLeaves === 1 ? "leave" : "leaves"} left
        </span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={cn(
            "h-full rounded-full",
            usedPct >= 100
              ? "bg-red-500"
              : usedPct >= 66
                ? "bg-orange-500"
                : usedPct >= 33
                  ? "bg-amber-400"
                  : "bg-cyan-400"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(usedPct, 100)}%` }}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label="Regular" value={regularAbsences} />
        <Stat label="Condoned" value={condonedLeaves} />
        <Stat label="Effective" value={effectiveLeaves} />
        <Stat label="Remaining" value={remainingLeaves} />
      </div>

      <div className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm", levelStyles[alert.level])}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{alert.message}</p>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-black/30 px-2 py-1.5">
      <p className="text-zinc-500">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}
