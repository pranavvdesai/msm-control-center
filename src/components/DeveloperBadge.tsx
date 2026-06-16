"use client";

import { motion } from "framer-motion";

export function DeveloperBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-3 left-1/2 z-50 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-full border border-cyan-500/30 bg-black/70 px-3 py-1.5 text-center text-[10px] backdrop-blur-md sm:bottom-3 sm:max-w-none sm:px-4 sm:text-xs"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text font-semibold text-transparent">
        Developed by Raam
      </span>
      <span className="ml-1 hidden text-zinc-400 sm:inline">— Naam toh suna hoga !!</span>
    </motion.div>
  );
}
