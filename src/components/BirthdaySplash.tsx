"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, PartyPopper, Sparkles, X } from "lucide-react";
import { GlowButton } from "@/components/GlowButton";
import {
  clearBirthdayReplayFlag,
  clearBirthdaySplashSeen,
  enableBirthdayReplay,
  getSendWishButtonLabel,
  getWisherSplashCopy,
  markBirthdaySplashSeen,
  shouldReplayBirthdaySplash,
  wasBirthdaySplashSeenToday,
} from "@/lib/birthday-celebration";

const BLOCKED_PATHS = ["/login", "/register", "/welcome"];

type BirthdayPerson = {
  id: string;
  name: string;
  firstName: string;
  rollNumber: string;
  poem?: string | null;
};

type BirthdayPayload = {
  active: boolean;
  istDate?: string;
  birthdayPeople?: BirthdayPerson[];
  viewer?: {
    isBirthdayPerson?: boolean;
    pendingWishUserIds?: string[];
    poem?: string | null;
  };
};

export function BirthdaySplash() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [payload, setPayload] = useState<BirthdayPayload | null>(null);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const shouldBlockPath = useMemo(
    () => BLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
    [pathname]
  );

  const birthdayPeople = payload?.birthdayPeople ?? [];
  const isBirthdayPerson = !!payload?.viewer?.isBirthdayPerson;
  const pendingIds = payload?.viewer?.pendingWishUserIds ?? [];
  const poem = payload?.viewer?.poem ?? birthdayPeople.find((p) => p.poem)?.poem ?? null;

  const tryOpen = useCallback(
    (data: BirthdayPayload, force = false) => {
      if (!mounted || !data.active || !data.birthdayPeople?.length || shouldBlockPath) return;

      if (
        force ||
        shouldReplayBirthdaySplash() ||
        (typeof window !== "undefined" && window.location.search.includes("replay-birthday=1"))
      ) {
        clearBirthdaySplashSeen();
        setOpen(true);
        return;
      }

      if (wasBirthdaySplashSeenToday()) return;
      setOpen(true);
    },
    [mounted, shouldBlockPath]
  );

  const loadBirthday = useCallback(async () => {
    if (typeof window !== "undefined" && window.location.search.includes("replay-birthday=1")) {
      enableBirthdayReplay();
    }

    try {
      const res = await fetch("/api/birthday/today", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as BirthdayPayload;
      setPayload(data);
      if (data.active) tryOpen(data);
    } catch {
      /* network */
    }
  }, [tryOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadBirthday();
  }, [mounted, loadBirthday]);

  useEffect(() => {
    if (!mounted || shouldBlockPath || !payload?.active) return;
    tryOpen(payload);
  }, [mounted, shouldBlockPath, payload, tryOpen]);

  useEffect(() => {
    function onReplay() {
      if (payload?.active) tryOpen(payload, true);
      else loadBirthday();
    }
    function onTryOpen(e: Event) {
      const detail = (e as CustomEvent<BirthdayPayload>).detail;
      if (detail?.active) {
        setPayload(detail);
        tryOpen(detail);
      }
    }
    window.addEventListener("msm-replay-birthday", onReplay);
    window.addEventListener("msm-birthday-try-open", onTryOpen);
    return () => {
      window.removeEventListener("msm-replay-birthday", onReplay);
      window.removeEventListener("msm-birthday-try-open", onTryOpen);
    };
  }, [payload, tryOpen, loadBirthday]);

  function dismiss() {
    markBirthdaySplashSeen();
    clearBirthdayReplayFlag();
    setOpen(false);
    setFeedback("");
  }

  async function sendWishes() {
    setSending(true);
    setFeedback("");
    try {
      const res = await fetch("/api/birthday/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ toUserIds: pendingIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send wish");
      setFeedback(data.message || "Wish sent!");
      setTimeout(dismiss, 700);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Could not send wish");
    }
    setSending(false);
  }

  if (!mounted || !open || !payload?.active) return null;

  const single = birthdayPeople.length === 1 && !isBirthdayPerson;
  const wisherCopy =
    !isBirthdayPerson && birthdayPeople.length > 0
      ? getWisherSplashCopy(birthdayPeople, payload.istDate)
      : null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-[#030014]/95 backdrop-blur-md" />

        <motion.div
          className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-300/30 bg-gradient-to-br from-[#0a0a1a] via-[#12082a] to-[#0a1628] p-6 shadow-2xl sm:p-8"
          initial={{ scale: 0.5, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-fuchsia-500 to-cyan-400 shadow-lg">
              <Cake className="h-10 w-10 text-white" />
            </div>
          </div>

          <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            MSM Cake Radar
            <Sparkles className="ml-1 inline h-3.5 w-3.5" />
          </p>

          {isBirthdayPerson ? (
            <>
              <h1 className="mt-3 text-center text-3xl font-black text-white sm:text-4xl">
                Happy Birthday,
                <span className="block bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  {birthdayPeople.find((p) => p.id)?.firstName ?? "friend"}! 🎂
                </span>
              </h1>
              <p className="mt-2 text-center text-sm text-zinc-400">
                The whole MSM family is celebrating you today.
              </p>
              {poem && (
                <div className="mt-6 rounded-2xl border border-amber-400/20 bg-black/30 p-5">
                  <p className="whitespace-pre-line text-center text-sm leading-8 text-amber-50/90 italic">
                    {poem}
                  </p>
                </div>
              )}
              <GlowButton type="button" className="mt-6 w-full py-3" onClick={dismiss}>
                Thank you, MSM family 🙏
              </GlowButton>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-center text-3xl font-black text-white sm:text-4xl">
                {single ? (
                  <>
                    IT&apos;S{" "}
                    <span className="bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                      {birthdayPeople[0]?.firstName}&apos;S BIRTHDAY!
                    </span>
                  </>
                ) : (
                  <span className="bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                    🎂 {birthdayPeople.length} MSM birthdays today!
                  </span>
                )}
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-zinc-300 italic">
                {wisherCopy}
              </p>

              {!single && (
                <ul className="mt-4 space-y-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100">
                  {birthdayPeople.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <PartyPopper className="h-4 w-4 shrink-0" />
                      <span>
                        {p.name} · {p.rollNumber}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <GlowButton
                  type="button"
                  className="w-full py-3"
                  onClick={sendWishes}
                  disabled={sending || pendingIds.length === 0}
                >
                  {getSendWishButtonLabel(birthdayPeople, pendingIds.length, sending)}
                </GlowButton>
                <GlowButton type="button" variant="secondary" className="w-full py-3" onClick={dismiss}>
                  I&apos;ll wish them in person
                </GlowButton>
              </div>
              {feedback && <p className="mt-3 text-center text-xs italic text-amber-200">{feedback}</p>}
              <p className="mt-3 text-center text-[11px] text-zinc-500">
                Your wish lands on their Home — one gentle celebration, once today.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
