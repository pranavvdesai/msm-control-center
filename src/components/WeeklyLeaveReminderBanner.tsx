"use client";

import { Mail } from "lucide-react";

export function WeeklyLeaveReminderBanner() {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
        <div>
          <p className="font-medium text-slate-900">Weekly leave report</p>
          <p className="mt-1 text-sm text-slate-600">
            Every Saturday at 5 PM IST — an automated mail to remind you to log any missed classes,
            plus your subject-wise leaves and weekly history.
          </p>
        </div>
      </div>
    </div>
  );
}
