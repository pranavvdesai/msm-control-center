"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { NavShell } from "@/components/NavShell";
import { SubjectCard } from "@/components/SubjectCard";
import { SocialFeed } from "@/components/SocialFeed";
import { RiskMeter } from "@/components/RiskMeter";
import { CrContact } from "@/components/CrContact";
import { BirthdayDayBanner } from "@/components/BirthdayDayBanner";
import { BirthdayWishToasts } from "@/components/BirthdayWishToasts";
import { CR_FULL_NAME, CR_PHONE } from "@/lib/cohort";
import { formatClassTimeRange } from "@/lib/utils";
import {
  clearBirthdayReplayFlag,
  clearBirthdaySplashSeen,
  enableBirthdayReplay,
} from "@/lib/birthday-celebration";
import { RefreshCw } from "lucide-react";

type BirthdayToday = {
  active: boolean;
  birthdayPeople: Array<{ id: string; name: string; firstName: string; rollNumber: string }>;
  viewer: {
    isBirthdayPerson: boolean;
    pendingWishUserIds: string[];
    wishCount: number;
  };
  incomingWishes: Array<{
    id: string;
    fromName: string;
    fromFirstName: string;
    createdAt: string;
  }>;
};

type DashboardData = {
  user: { name: string; role: string; canAdmin?: boolean };
  settings: { crName: string; crPhone?: string; cohortName: string; cohortFull: string; termInfo?: string } | null;
  subjectStats: Array<{
    subjectName: string;
    credits: number;
    maxLeaves: number;
    regularAbsences: number;
    condonedLeaves: number;
    effectiveLeaves: number;
    remainingLeaves: number;
    alert: { level: "safe" | "caution" | "warning" | "critical"; message: string };
  }>;
  todayClasses: Array<{
    id: string;
    startTime: string;
    endTime: string;
    room: string | null;
    faculty: string | null;
    subject: { name: string; code: string };
  }>;
  todayLabel: string;
  unmarkedEndedClasses: number;
  remindersEnabled: boolean;
  feed: Array<{ id: string; message: string; type: string; createdAt: string }>;
  summary: { totalRegular: number; totalCondoned: number; riskScore: number };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [birthday, setBirthday] = useState<BirthdayToday | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingWish, setSendingWish] = useState(false);

  const loadBirthday = useCallback(async () => {
    const res = await fetch("/api/birthday/today", { credentials: "include", cache: "no-store" });
    if (!res.ok) return;
    const b = (await res.json()) as BirthdayToday;
    setBirthday(b);
    if (b.active) {
      window.dispatchEvent(new CustomEvent("msm-birthday-active", { detail: b }));
    }
  }, []);

  const load = useCallback(async () => {
    const [dash] = await Promise.all([
      fetch("/api/dashboard", { credentials: "include", cache: "no-store" }).then((r) => r.json()),
      loadBirthday(),
    ]);
    setData(dash);
    setRefreshing(false);
  }, [loadBirthday]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  function handleRefresh() {
    setRefreshing(true);
    load();
  }

  function openBirthdaySplash() {
    clearBirthdaySplashSeen();
    enableBirthdayReplay();
    if (birthday?.active) {
      window.dispatchEvent(new CustomEvent("msm-birthday-active", { detail: birthday }));
    } else {
      window.dispatchEvent(new Event("msm-replay-birthday"));
    }
  }

  async function sendWishes() {
    if (!birthday?.active) return;
    setSendingWish(true);
    try {
      const res = await fetch("/api/birthday/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ toUserIds: birthday.viewer.pendingWishUserIds }),
      });
      if (res.ok) {
        clearBirthdaySplashSeen();
        markDismissAndReload();
      }
      await loadBirthday();
    } finally {
      setSendingWish(false);
    }
  }

  function markDismissAndReload() {
    clearBirthdayReplayFlag();
  }

  if (!data) {
    return (
      <NavShell>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 rounded-full border-2 border-cyan-200 border-t-cyan-500"
          />
          <p>Initializing Control Center...</p>
        </div>
      </NavShell>
    );
  }

  return (
    <NavShell
      userName={data.user.name}
      isAdmin={data.user.role === "ADMIN"}
      canAdmin={data.user.canAdmin}
    >
      {birthday?.active && birthday.viewer.isBirthdayPerson && (
        <BirthdayWishToasts incomingWishes={birthday.incomingWishes} />
      )}

      {birthday?.active && (
        <BirthdayDayBanner
          isBirthdayPerson={birthday.viewer.isBirthdayPerson}
          birthdayPeople={birthday.birthdayPeople}
          pendingCount={birthday.viewer.pendingWishUserIds.length}
          onOpenSplash={openBirthdaySplash}
          onSendWishes={sendWishes}
          sending={sendingWish}
        />
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:rounded-3xl sm:p-6"
      >
        <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
          <button
            onClick={handleRefresh}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:text-cyan-700"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="min-w-0 pr-8 sm:pr-0">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700 sm:text-xs sm:tracking-[0.3em]">
            {data.settings?.termInfo || "Term 4 · TAPMI Manipal"}
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-slate-900 sm:text-2xl md:text-4xl">
            MSM Control Center
          </h1>
          <p className="mt-2 text-base text-slate-600 sm:mt-1 sm:text-sm">
            Class Representative:{" "}
            <span className="font-bold text-slate-900">
              {data.settings?.crName || CR_FULL_NAME}
            </span>
          </p>
          <CrContact
            crName={data.settings?.crName || CR_FULL_NAME}
            crPhone={data.settings?.crPhone || CR_PHONE}
          />
          <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-sm">
            Welcome back, <span className="font-semibold text-slate-900">{data.user.name}</span>.
            Your attendance radar is live.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:gap-3">
            <Badge label="Regular absences" value={data.summary.totalRegular} color="red" />
            <Badge label="Condoned leaves" value={data.summary.totalCondoned} color="violet" />
            <Badge label="Subjects tracked" value={data.subjectStats.length} color="cyan" />
          </div>
        </div>
      </motion.section>

      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:mb-6 sm:p-5">
        <p className="text-base leading-relaxed text-slate-800 sm:text-sm">
          When the weary soul finally left the mortal world and stood before the gates of eternity,
          the Almighty smiled… then sighed softly —
        </p>
        <p className="mt-3 border-l-4 border-amber-500 pl-4 text-base font-medium italic leading-relaxed text-amber-950 sm:text-sm">
          &lsquo;My child, heaven welcomes all… but not those below 75%.
          <br />
          Track your attendance wisely… destiny keeps a record of everything.&rsquo;
        </p>
      </div>

      <div className="mb-6">
        <RiskMeter score={data.summary.riskScore} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 sm:text-lg">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                Today&apos;s Classes
              </h2>
              <p className="text-sm font-medium text-cyan-700 sm:text-base">{data.todayLabel}</p>
            </div>
            {data.todayClasses.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-base text-slate-500 shadow-sm sm:text-sm">
                No classes today. Faculty thinks you&apos;re still sleeping.
              </p>
            ) : (
              <div className="space-y-3">
                {data.todayClasses.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-cyan-300 sm:px-4 sm:py-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-base font-semibold text-slate-900 sm:text-sm sm:font-medium">
                          {c.subject.name}
                        </p>
                        <p className="mt-1 text-sm font-medium text-cyan-700 sm:text-xs">{c.subject.code}</p>
                      </div>
                      <span className="w-fit shrink-0 rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-800 sm:px-2.5 sm:py-0.5 sm:text-xs">
                        {formatClassTimeRange(c.startTime, c.endTime)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 sm:text-xs">
                      Prof. {c.faculty || "TBA"} · {c.room || "G2"}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900 sm:mb-3 sm:text-lg sm:font-semibold">
              Subject Intelligence
            </h2>
            {data.subjectStats.length === 0 ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900 sm:text-sm">
                No subjects loaded yet. Admin: upload TERM 4 MBA-MKT TT.xlsx from Upload TT tab.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.subjectStats.map((s) => (
                  <SubjectCard key={s.subjectName} {...s} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="xl:sticky xl:top-36 xl:self-start">
          <SocialFeed items={data.feed} />
        </div>
      </div>
    </NavShell>
  );
}

function Badge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "red" | "violet" | "cyan";
}) {
  const colors = {
    red: "border-red-200 text-red-700 bg-red-50",
    violet: "border-violet-200 text-violet-700 bg-violet-50",
    cyan: "border-cyan-200 text-cyan-700 bg-cyan-50",
  };
  return (
    <div className={`rounded-2xl border px-3 py-3 text-center sm:rounded-xl sm:px-3 sm:py-2 sm:text-left ${colors[color]}`}>
      <p className="text-xs font-medium uppercase opacity-80 sm:text-[10px] sm:opacity-70">{label}</p>
      <p className="text-2xl font-bold text-slate-900 sm:text-xl">{value}</p>
    </div>
  );
}
