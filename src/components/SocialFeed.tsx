"use client";

import { motion } from "framer-motion";
import { Radio, UserPlus, CalendarOff, AlertTriangle, LogIn, Cake } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FEED_META: Record<
  string,
  { label: string; icon: typeof Radio; className: string }
> = {
  login: {
    label: "Logged in",
    icon: LogIn,
    className: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
  leave: {
    label: "Leave marked",
    icon: CalendarOff,
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  alert: {
    label: "Attendance alert",
    icon: AlertTriangle,
    className: "border-red-200 bg-red-50 text-red-900",
  },
  birthday_wish: {
    label: "Birthday wish",
    icon: Cake,
    className: "border-pink-200 bg-pink-50 text-pink-900",
  },
  signup: {
    label: "New signup",
    icon: UserPlus,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
};

export function SocialFeed({
  items,
}: {
  items: Array<{ id: string; message: string; type: string; createdAt: string }>;
}) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 shadow-sm sm:p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Radio className="h-5 w-5 animate-pulse text-violet-600 sm:h-4 sm:w-4" />
        <h2 className="text-lg font-semibold text-violet-900 sm:text-base">Live MSM Feed</h2>
        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-red-700 sm:text-[10px]">
          Live
        </span>
        <span className="text-xs text-slate-500 sm:text-[10px]">Top 10</span>
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1 sm:max-h-72 sm:space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-base text-slate-500 sm:text-sm">
            Logins, leave marks, and attendance alerts will show up here.
          </p>
        ) : (
          items.map((item, i) => {
            const meta = FEED_META[item.type] ?? {
              label: "Update",
              icon: Radio,
              className: "border-slate-200 bg-white text-slate-700",
            };
            const Icon = meta.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "rounded-xl border px-3.5 py-3 text-base sm:px-3 sm:py-2.5 sm:text-sm",
                  meta.className
                )}
              >
                <div className="mb-2 flex items-center gap-1.5 sm:mb-1.5">
                  <Icon className="h-4 w-4 shrink-0 opacity-80 sm:h-3.5 sm:w-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-80 sm:text-[10px]">
                    {meta.label}
                  </span>
                </div>
                <p className="leading-relaxed">{item.message}</p>
                <p className="mt-2 text-xs opacity-60 sm:mt-1.5 sm:text-[10px]">{formatDate(item.createdAt)}</p>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
