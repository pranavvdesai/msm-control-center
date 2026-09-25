"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { Gamepad2, Grid3X3, Brain } from "lucide-react";

export default function GamesHubPage() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));
  }, []);

  return (
    <NavShell userName={userName}>
      <div className="msm-page-header mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="msm-page-title">Play</h1>
            <p className="msm-page-subtitle">
              Fresh challenges every day · same puzzle for the whole cohort · leaderboards reset at midnight IST
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/games/sudoku"
          className="group msm-card block transition hover:border-cyan-300 hover:shadow-md"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
            <Grid3X3 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Daily Sudoku</h2>
          <p className="mt-1 text-sm text-slate-600">
            Expert grid · ~18 clues · race the clock · today + all-time boards
          </p>
          <p className="mt-3 text-sm font-semibold text-cyan-700 group-hover:underline">Play today&apos;s Sudoku →</p>
        </Link>

        <Link
          href="/games/quiz"
          className="group msm-card block transition hover:border-violet-300 hover:shadow-md"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Brain className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Daily Quiz</h2>
          <p className="mt-1 text-sm text-slate-600">
            5 tough questions — geopolitics, history, business, sports &amp; pop culture. Score + speed both count.
          </p>
          <p className="mt-3 text-sm font-semibold text-violet-700 group-hover:underline">Take today&apos;s quiz →</p>
        </Link>
      </div>
    </NavShell>
  );
}
