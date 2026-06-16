"use client";

import { motion } from "framer-motion";

export function DeveloperBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-full border border-cyan-500/30 bg-black/70 px-4 py-1.5 text-center text-xs backdrop-blur-md"
    >
      <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text font-semibold text-transparent">
        Developed by Raam
      </span>
      <span className="ml-1 text-zinc-400">— Naam toh suna hoga !!</span>
    </motion.div>
  );
}
