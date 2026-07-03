"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, PartyPopper, Sparkles, X } from "lucide-react";
import { GlowButton } from "@/components/GlowButton";
import {
  clearRamBirthdayReplayFlag,
  clearRamBirthdaySplashSeen,
  enableRamBirthdayReplay,
  isRamRoll,
  markRamBirthdaySplashSeen,
  RAM_DISPLAY_NAME,
  RAM_FIRST_NAME,
  ramBirthdayWhatsAppUrl,
  shouldReplayRamBirthdaySplash,
  wasRamBirthdaySplashSeenToday,
} from "@/lib/ram-birthday";
import { RAM_ROLL } from "@/lib/permissions";

const BLOCKED_PATHS = ["/login", "/register", "/welcome"];

type BirthdayPayload = {
  active: boolean;
  istDate?: string;
  isRam?: boolean;
  firstName?: string;
  displayName?: string;
  poem?: string | null;
};

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
  const [mounted, setMounted] = useState(false);
  const [payload, setPayload] = useState<BirthdayPayload | null>(null);
  const [open, setOpen] = useState(false);
  const [rollNumber, setRollNumber] = useState<string | null>(null);

  const shouldBlockPath = useMemo(
    () => BLOCKED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
    [pathname]
  );

  const isRam = payload?.isRam ?? isRamRoll(rollNumber);

  const tryOpen = useCallback(
    (data: BirthdayPayload, force = false) => {
      if (!data.active || shouldBlockPath) return;

      if (
        force ||
        shouldReplayRamBirthdaySplash() ||
        (typeof window !== "undefined" &&
          window.location.search.includes("replay-birthday=1"))
      ) {
        clearRamBirthdaySplashSeen();
        setOpen(true);
        return;
      }

      if (wasRamBirthdaySplashSeenToday()) return;
      setOpen(true);
    },
    [shouldBlockPath]
  );

  const loadBirthday = useCallback(async () => {
    if (typeof window !== "undefined" && window.location.search.includes("replay-birthday=1")) {
      enableRamBirthdayReplay();
    }

    try {
      const res = await fetch("/api/ram-birthday", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as BirthdayPayload;
      setPayload(data);

      if (data.active) {
        const me = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
          .then((r) => (r.ok ? r.json() : { user: null }))
          .catch(() => ({ user: null }));
        setRollNumber(me.user?.rollNumber?.toUpperCase() ?? null);
        tryOpen(data);
      }
    } catch {
      /* network */
    }
  }, [tryOpen]);

  useEffect(() => {
    setMounted(true);
    loadBirthday();
  }, [loadBirthday]);

  useEffect(() => {
    function onReplay() {
      if (payload?.active) tryOpen(payload, true);
      else loadBirthday().then(() => {
        /* loadBirthday sets payload and opens */
      });
    }
    function onActive(e: Event) {
      const detail = (e as CustomEvent<BirthdayPayload>).detail;
      if (detail?.active) {
        setPayload(detail);
        tryOpen(detail, true);
      }
    }
    window.addEventListener("msm-replay-birthday", onReplay);
    window.addEventListener("msm-ram-birthday-active", onActive);
    return () => {
      window.removeEventListener("msm-replay-birthday", onReplay);
      window.removeEventListener("msm-ram-birthday-active", onActive);
    };
  }, [payload, tryOpen, loadBirthday]);

  function dismiss() {
    markRamBirthdaySplashSeen();
    clearRamBirthdayReplayFlag();
    setOpen(false);
  }

  if (!mounted || !open || !payload?.active) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
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
          className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-300/30 bg-gradient-to-br from-[#0a0a1a] via-[#12082a] to-[#0a1628] p-6 shadow-2xl shadow-amber-500/20 sm:p-8"
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
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-fuchsia-500 to-cyan-400 shadow-lg shadow-amber-500/30">
              <Cake className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          <motion.p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            MSM Control Center
            <Sparkles className="ml-1 inline h-3.5 w-3.5" />
          </motion.p>

          {isRam ? (
            <>
              <motion.h1 className="mt-3 text-center text-3xl font-black leading-tight text-white sm:text-4xl">
                Happy Birthday,
                <span className="block bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  {payload.firstName || RAM_FIRST_NAME}! 🎂
                </span>
              </motion.h1>
              <motion.p className="mt-2 text-center text-sm text-zinc-400">
                The builder of this universe gets the spotlight today.
              </motion.p>
              <motion.div className="mt-6 rounded-2xl border border-amber-400/20 bg-black/30 p-5">
                <p className="whitespace-pre-line text-center text-sm leading-8 text-amber-50/90 italic">
                  {payload.poem}
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
              <motion.p className="mt-3 text-center text-base leading-relaxed text-zinc-300">
                Today we celebrate{" "}
                <strong className="text-white">{payload.displayName || RAM_DISPLAY_NAME}</strong> —
                the legend who built MSM Control Center for all of us.
              </motion.p>
              <motion.div className="mt-5 flex items-start gap-3 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/10 p-4">
                <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-300" />
                <p className="text-sm leading-relaxed text-fuchsia-100">
                  <strong>Your mission today:</strong> wish Ram a happy birthday!
                  Drop him a message, say it in class, or ping him on WhatsApp —
                  let&apos;s make his day unforgettable.
                </p>
              </motion.div>
            </>
          )}

          <motion.div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
    </AnimatePresence>,
    document.body
  );
}
