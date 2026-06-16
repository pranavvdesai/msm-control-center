"use client";

import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/5 bg-black/30 px-3 py-2 text-sm text-zinc-300"
          >
            <p>{item.message}</p>
            <p className="mt-1 text-[10px] text-zinc-600">
              {formatDate(item.createdAt)} · {item.type}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
