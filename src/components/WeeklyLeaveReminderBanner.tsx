"use client";

import { Mail } from "lucide-react";

export function WeeklyLeaveReminderBanner() {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
        <div>
          <p className="font-medium text-white">Weekly leave report</p>
          <p className="mt-1 text-sm text-zinc-400">
            Every Saturday at 5 PM IST you&apos;ll get a personal email with your subject-wise
            leave balance and a reminder to log any missed classes.
          </p>
        </div>
      </div>
    </div>
  );
}
