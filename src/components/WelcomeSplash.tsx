"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function WelcomeSplash({ name }: { name: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.user && !data.user.profileComplete) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    }, 4200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030014]">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.25),_transparent_55%)]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {[...Array(20)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyan-300"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className="relative z-10 text-center"
      >
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-2 text-sm uppercase tracking-[0.5em] text-cyan-400"
        >
          MSM Control Center
        </motion.p>
        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-black uppercase md:text-7xl"
        >
          <span className="bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Welcome
          </span>
        </motion.h1>
        <motion.h2
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 text-3xl font-bold text-white md:text-4xl"
        >
          {name}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-zinc-400"
        >
          Loading your dashboard...
        </motion.p>
        <motion.div
          className="mx-auto mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, delay: 1.5 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
