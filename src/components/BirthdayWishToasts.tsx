"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake } from "lucide-react";
import { buildWishToastMessage } from "@/lib/birthday-celebration";

type IncomingWish = {
  id: string;
  fromName: string;
  fromFirstName: string;
  createdAt: string;
};

export function BirthdayWishToasts({
  incomingWishes,
}: {
  incomingWishes: IncomingWish[];
}) {
  const seenIds = useRef<Set<string>>(new Set());
  const [toasts, setToasts] = useState<IncomingWish[]>([]);

  useEffect(() => {
    const fresh = incomingWishes.filter((w) => !seenIds.current.has(w.id));
    if (fresh.length === 0) return;

    for (const wish of fresh) {
      seenIds.current.add(wish.id);
    }

    setToasts((prev) => [...fresh, ...prev].slice(0, 5));

    for (const wish of fresh) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== wish.id));
      }, 6000);
    }
  }, [incomingWishes]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-3 right-3 top-[max(4.5rem,env(safe-area-inset-top))] z-[9998] flex flex-col gap-2 sm:left-auto sm:right-4 sm:max-w-sm">
      <AnimatePresence>
        {toasts.map((wish) => (
          <motion.div
            key={wish.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="flex items-start gap-2 rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-500/95 to-fuchsia-500/90 px-4 py-3 text-white shadow-lg backdrop-blur-sm"
          >
            <Cake className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium leading-snug italic">
              {buildWishToastMessage(wish.fromFirstName)}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
