"use client";

import { motion } from "framer-motion";
import { Radio, UserPlus, CalendarOff, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FEED_META: Record<
  string,
  { label: string; icon: typeof Radio; className: string }
> = {
  leave: {
    label: "Leave marked",
    icon: CalendarOff,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  },
  signup: {
    label: "New signup",
    icon: UserPlus,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  },
  alert: {
    label: "Attendance alert",
    icon: AlertTriangle,
    className: "border-red-500/25 bg-red-500/10 text-red-200",
  },
};

export function SocialFeed({
  items,
}: {
  items: Array<{ id: string; message: string; type: string; createdAt: string }>;
}) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Radio className="h-4 w-4 animate-pulse text-violet-400" />
        <h2 className="font-semibold text-violet-200">Live MSM Feed</h2>
        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] uppercase text-red-300">
          Live
        </span>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="rounded-xl border border-white/5 bg-black/20 px-3 py-4 text-sm text-zinc-500">
            No activity yet. Leave marks and new signups will show up here.
          </p>
        ) : (
          items.map((item, i) => {
            const meta = FEED_META[item.type] ?? {
              label: "Update",
              icon: Radio,
              className: "border-white/10 bg-black/30 text-zinc-300",
            };
            const Icon = meta.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm",
                  meta.className
                )}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                    {meta.label}
                  </span>
                </div>
                <p className="leading-relaxed">{item.message}</p>
                <p className="mt-1.5 text-[10px] opacity-60">{formatDate(item.createdAt)}</p>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
