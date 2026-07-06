"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertLevel = "safe" | "caution" | "warning" | "critical";

const levelStyles: Record<AlertLevel, string> = {
  safe: "border-emerald-200 bg-emerald-50 text-emerald-800",
  caution: "border-amber-200 bg-amber-50 text-amber-800",
  warning: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-800",
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
  lateMarks = 0,
  effectiveLeaves,
  remainingLeaves,
  alert,
}: {
  subjectName: string;
  credits: number;
  maxLeaves: number;
  regularAbsences: number;
  condonedLeaves: number;
  lateMarks: number;
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
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-4"
    >
      <div className="mb-4 flex flex-col gap-2 sm:mb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-bold leading-snug text-slate-900 sm:text-base sm:font-semibold">
            {subjectName}
          </h3>
          <p className="mt-1 text-sm text-slate-500 sm:text-xs">
            {credits} credits · max {maxLeaves} leaves
          </p>
        </div>
        <span
          className={cn(
            "w-fit shrink-0 rounded-full px-3 py-1 text-sm font-semibold sm:px-2 sm:py-0.5 sm:text-xs sm:font-medium",
            remainingLeaves === 0
              ? "bg-red-100 text-red-700"
              : remainingLeaves === 1
                ? "bg-orange-100 text-orange-700"
                : "bg-cyan-100 text-cyan-700"
          )}
        >
          {remainingLeaves} {remainingLeaves === 1 ? "leave" : "leaves"} left
        </span>
      </div>

      <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-slate-200 sm:mb-3 sm:h-2">
        <motion.div
          className={cn(
            "h-full rounded-full",
            usedPct >= 100
              ? "bg-red-500"
              : usedPct >= 66
                ? "bg-orange-500"
                : usedPct >= 33
                  ? "bg-amber-400"
                  : "bg-cyan-500"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(usedPct, 100)}%` }}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-3 sm:gap-2 md:grid-cols-5">
        <Stat label="Regular" value={regularAbsences} />
        <Stat label="Late" value={lateMarks} />
        <Stat label="Condoned" value={condonedLeaves} />
        <Stat label="Effective" value={effectiveLeaves} />
        <Stat label="Remaining" value={remainingLeaves} />
      </div>

      <div
        className={cn(
          "flex items-start gap-2.5 rounded-xl border p-3.5 text-base leading-relaxed sm:gap-2 sm:p-3 sm:text-sm",
          levelStyles[alert.level]
        )}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
        <p>{alert.message}</p>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100 sm:px-2 sm:py-1.5">
      <p className="text-xs font-medium text-slate-500 sm:text-[11px]">{label}</p>
      <p className="text-xl font-bold text-slate-900 sm:text-base sm:font-semibold">{value}</p>
    </div>
  );
}
