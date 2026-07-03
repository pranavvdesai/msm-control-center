"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, PartyPopper, Sparkles, X } from "lucide-react";
import { GlowButton } from "@/components/GlowButton";
import {
  clearRamBirthdayReplayFlag,
  clearRamBirthdaySplashSeen,
  enableRamBirthdayReplay,
  isRamBirthdayToday,
  isRamRoll,
  markRamBirthdaySplashSeen,
  RAM_BIRTHDAY_POEM,
  RAM_DISPLAY_NAME,
  RAM_FIRST_NAME,
  ramBirthdayWhatsAppUrl,
  shouldReplayRamBirthdaySplash,
  wasRamBirthdaySplashSeenToday,
} from "@/lib/ram-birthday";
import { RAM_ROLL } from "@/lib/permissions";

const BLOCKED_PATHS = ["/login", "/register", "/welcome"];

const CONFETTI_COLORS = [
  "#fbbf24",
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fb7185",
  "#fcd34d",
];

function ConfettiBurst({ count = 48 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 2,
        size: 6 + Math.random() * 10,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 720 - 360,
        xDrift: (Math.random() - 0.5) * 180,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.left}%`,
            top: "-8%",
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
          }}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            opacity: [0, 1, 1, 0],
            rotate: p.rotate,
            x: [0, p.xDrift],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

function Firework({ x, delay }: { x: string; delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute top-[18%]"
      style={{ left: x }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 1.2, delay, repeat: Infinity, repeatDelay: 2.2 }}
    >
      <div className="relative h-24 w-24">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-8 origin-left rounded-full bg-gradient-to-r from-amber-300 to-fuchsia-400"
            style={{ rotate: `${i * 45}deg` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function RamBirthdaySplash() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const replayFromUrl = searchParams.get("replay-birthday") === "1";
  const [rollNumber, setRollNumber] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const isRam = isRamRoll(rollNumber);

  const shouldBlockPath = useMemo(
    () => BLOCKED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
    [pathname]
  );

  const tryOpenSplash = useCallback(
    (forceReplay = false) => {
      if (!rollNumber || !isRamBirthdayToday() || shouldBlockPath) return;

      if (forceReplay || replayFromUrl || shouldReplayRamBirthdaySplash()) {
        clearRamBirthdaySplashSeen();
        setOpen(true);
        return;
      }

      if (wasRamBirthdaySplashSeenToday()) return;
      setOpen(true);
    },
    [rollNumber, replayFromUrl, shouldBlockPath]
  );

  useEffect(() => {
    if (replayFromUrl) enableRamBirthdayReplay();
  }, [replayFromUrl]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => {
        const roll = d.user?.rollNumber?.toUpperCase() ?? null;
        setRollNumber(roll);
      })
      .catch(() => setRollNumber(null));
  }, []);

  useEffect(() => {
    tryOpenSplash();
  }, [tryOpenSplash]);

  useEffect(() => {
    function onReplay() {
      tryOpenSplash(true);
    }
    window.addEventListener("msm-replay-birthday", onReplay);
    return () => window.removeEventListener("msm-replay-birthday", onReplay);
  }, [tryOpenSplash]);

  function dismiss() {
    markRamBirthdaySplashSeen();
    clearRamBirthdayReplayFlag();
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-[#030014]/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.25),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(167,139,250,0.22),transparent_40%)]"
            animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <ConfettiBurst />
          <Firework x="12%" delay={0.2} />
          <Firework x="78%" delay={0.9} />
          <Firework x="48%" delay={1.5} />

          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-[#0a0a1a] via-[#12082a] to-[#0a1628] p-6 shadow-2xl shadow-amber-500/20 sm:p-8"
            initial={{ scale: 0.4, rotate: -8, y: 80, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              className="mb-4 flex justify-center"
              animate={{ y: [0, -10, 0], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-4 rounded-full bg-amber-400/20 blur-xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-fuchsia-500 to-cyan-400 shadow-lg shadow-amber-500/30">
                  <Cake className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.p
              className="text-center text-xs font-bold uppercase tracking-[0.35em] text-amber-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Sparkles className="mr-1 inline h-3.5 w-3.5" />
              MSM Control Center
              <Sparkles className="ml-1 inline h-3.5 w-3.5" />
            </motion.p>

            {isRam ? (
              <>
                <motion.h1
                  className="mt-3 text-center text-3xl font-black leading-tight text-white sm:text-4xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 1.06, 1], opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                >
                  Happy Birthday,
                  <span className="block bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                    {RAM_FIRST_NAME}! 🎂
                  </span>
                </motion.h1>
                <motion.p
                  className="mt-2 text-center text-sm text-zinc-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  The builder of this universe gets the spotlight today.
                </motion.p>
                <motion.div
                  className="mt-6 rounded-2xl border border-amber-400/20 bg-black/30 p-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <p className="whitespace-pre-line text-center text-sm leading-8 text-amber-50/90 italic">
                    {RAM_BIRTHDAY_POEM}
                  </p>
                </motion.div>
              </>
            ) : (
              <>
                <motion.h1
                  className="mt-3 text-center text-3xl font-black leading-tight text-white sm:text-4xl"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  IT&apos;S{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                    RAM&apos;S BIRTHDAY!
                  </span>
                </motion.h1>
                <motion.p
                  className="mt-3 text-center text-base leading-relaxed text-zinc-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Today we celebrate <strong className="text-white">{RAM_DISPLAY_NAME}</strong> —
                  the legend who built MSM Control Center for all of us.
                </motion.p>
                <motion.div
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/10 p-4"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-300" />
                  <p className="text-sm leading-relaxed text-fuchsia-100">
                    <strong>Your mission today:</strong> wish Ram a happy birthday!
                    Drop him a message, say it in class, or ping him on WhatsApp —
                    let&apos;s make his day unforgettable.
                  </p>
                </motion.div>
              </>
            )}

            <motion.div
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              {!isRam && (
                <a
                  href={ramBirthdayWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <GlowButton type="button" className="w-full py-3">
                    💬 Wish Ram on WhatsApp
                  </GlowButton>
                </a>
              )}
              <GlowButton
                type="button"
                variant={isRam ? "primary" : "secondary"}
                className="flex-1 py-3"
                onClick={dismiss}
              >
                {isRam ? "Thank you, MSM family 🙏" : "Got it — I'll wish him!"}
              </GlowButton>
            </motion.div>
            {isRam && rollNumber === RAM_ROLL && (
              <p className="mt-4 text-center text-[11px] text-zinc-500">
                Tap the MSM logo 3× anytime today to replay this.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
