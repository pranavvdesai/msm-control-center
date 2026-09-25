"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NavShell } from "@/components/NavShell";
import { PlayLeaderboard } from "@/components/play/PlayLeaderboard";
import { SudokuGrid, getConflictIndices } from "@/components/sudoku/SudokuGrid";
import { SudokuInstructionsModal } from "@/components/sudoku/SudokuInstructionsModal";
import { formatDuration } from "@/lib/play/ist-date";
import { parseGrid, serializeGrid } from "@/lib/sudoku/grid";
import { ArrowLeft, Clock, Flame, Info, Pause, Trophy } from "lucide-react";

const INSTRUCTIONS_KEY = "msm-sudoku-instructions-v1";

type TodayData = {
  dateLabel: string;
  difficulty: string;
  sourceLabel: string;
  clueCount: number;
  initialGrid: string;
  attempt: {
    id: string;
    status: string;
    currentGrid: string;
    mistakes: number;
    durationMs: number | null;
    elapsedMs: number;
    activeMs: number;
    timerRunning: boolean;
  };
  cohortCompleted: number;
};

export default function SudokuPage() {
  const [userName, setUserName] = useState("");
  const [data, setData] = useState<TodayData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [grid, setGrid] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [activeMs, setActiveMs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finish, setFinish] = useState<{ rank: number; durationMs: number; dailyScore: number } | null>(null);
  const [lbScope, setLbScope] = useState<"today" | "alltime">("today");
  const [leaderboard, setLeaderboard] = useState<Array<Record<string, unknown>>>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickAnchor = useRef({ baseMs: 0, startedAt: 0 });

  const finished = data?.attempt.status === "completed" || !!finish;

  const syncTimerAnchor = useCallback((ms: number, running: boolean) => {
    tickAnchor.current = { baseMs: ms, startedAt: running ? Date.now() : 0 };
    setActiveMs(ms);
    setTimerRunning(running);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/sudoku/today");
      const d = await res.json();
      if (!res.ok) {
        setLoadError(d.error || "Could not load today's puzzle. Try again in a moment.");
        return;
      }
      setData(d);
      setGrid(d.initialGrid || d.attempt.currentGrid);
      setMistakes(d.attempt.mistakes);
      if (d.attempt.status === "completed" && d.attempt.durationMs) {
        syncTimerAnchor(d.attempt.durationMs, false);
      } else {
        syncTimerAnchor(d.attempt.activeMs ?? 0, d.attempt.timerRunning ?? true);
      }
      if (d.attempt.status !== "completed" && !localStorage.getItem(INSTRUCTIONS_KEY)) {
        setShowInstructions(true);
      }
    } catch {
      setLoadError("Network error — check your connection and refresh.");
    } finally {
      setLoading(false);
    }
  }, [syncTimerAnchor]);

  const loadLb = useCallback(async () => {
    const res = await fetch(`/api/sudoku/leaderboard?scope=${lbScope}`);
    if (res.ok) {
      const d = await res.json();
      setLeaderboard(d.leaderboard ?? []);
    }
  }, [lbScope]);

  const setTimerState = useCallback(async (action: "pause" | "resume") => {
    if (finished) return;
    const res = await fetch("/api/sudoku/today/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timer: action }),
    });
    if (res.ok) {
      const d = await res.json();
      syncTimerAnchor(d.activeMs, d.timerRunning);
    }
  }, [finished, syncTimerAnchor]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));
    load();
  }, [load]);

  useEffect(() => {
    loadLb();
    const t = setInterval(loadLb, 30000);
    return () => clearInterval(t);
  }, [loadLb]);

  useEffect(() => {
    if (finished || !timerRunning) return;
    const id = setInterval(() => {
      const { baseMs, startedAt } = tickAnchor.current;
      if (startedAt) setActiveMs(baseMs + (Date.now() - startedAt));
    }, 1000);
    return () => clearInterval(id);
  }, [finished, timerRunning]);

  useEffect(() => {
    if (finished) return;

    function onVisibility() {
      if (document.hidden) setTimerState("pause");
      else setTimerState("resume");
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [finished, setTimerState]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (finished) return;
      fetch("/api/sudoku/today/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timer: "pause" }),
        keepalive: true,
      }).catch(() => {});
    };
  }, [finished]);

  function closeInstructions() {
    localStorage.setItem(INSTRUCTIONS_KEY, "1");
    setShowInstructions(false);
  }

  function scheduleSave(nextGrid: string, nextMistakes: number) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch("/api/sudoku/today/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentGrid: nextGrid, mistakes: nextMistakes }),
      });
    }, 800);
  }

  function setCell(index: number, value: number) {
    if (finished || !data) return;
    const initial = parseGrid(data.initialGrid);
    if (initial[index] !== 0) return;
    const next = parseGrid(grid);
    next[index] = value;
    const nextStr = serializeGrid(next);
    setGrid(nextStr);
    scheduleSave(nextStr, mistakes);
  }

  async function submit() {
    if (finished || submitting) return;
    setSubmitting(true);
    try {
      await setTimerState("pause");
      const res = await fetch("/api/sudoku/today/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentGrid: grid }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.incorrect) setMistakes((m) => m + 1);
        setToast(d.error || "Submit failed");
        if (!document.hidden) await setTimerState("resume");
        return;
      }
      setFinish({ rank: d.rank, durationMs: d.durationMs, dailyScore: d.dailyScore });
      syncTimerAnchor(d.durationMs, false);
      setToast(`Solved in ${formatDuration(d.durationMs)} — #${d.rank} today!`);
      load();
      loadLb();
    } finally {
      setSubmitting(false);
    }
  }

  const conflicts = getConflictIndices(parseGrid(grid));

  return (
    <NavShell userName={userName}>
      <SudokuInstructionsModal open={showInstructions} onClose={closeInstructions} />

      <Link href="/games" className="mb-4 flex items-center gap-1 text-sm font-semibold text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Back to Play
      </Link>

      <div className="msm-page-header mb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="msm-page-title">Daily Sudoku</h1>
            <p className="msm-page-subtitle">
              {data?.dateLabel ?? "Loading…"} · {data?.sourceLabel ?? "Master"} ·{" "}
              {data?.clueCount ?? "—"} clues · {data?.cohortCompleted ?? 0} finished
            </p>
          </div>
          {!finished && (
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <Info className="h-3.5 w-3.5" /> How it works
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
          <button
            type="button"
            onClick={() => load()}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {toast && (
        <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-900">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <Clock className="h-4 w-4 text-cyan-600" />
          <span className="font-mono font-bold">{formatDuration(activeMs)}</span>
          {!finished && !timerRunning && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
              <Pause className="h-3 w-3" /> Paused
            </span>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          Mistakes: <span className="font-bold text-red-600">{mistakes}</span>
        </div>
        {finish && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
            <Trophy className="h-4 w-4" /> #{finish.rank} today · +{finish.dailyScore} pts
          </div>
        )}
      </div>

      <div className="msm-card mb-4">
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading today&apos;s puzzle…</p>
        ) : loadError ? (
          <p className="py-12 text-center text-sm text-slate-500">Puzzle unavailable.</p>
        ) : (
          <>
            <SudokuGrid
              initialGrid={data?.initialGrid ?? ""}
              currentGrid={grid}
              selected={selected}
              onSelect={setSelected}
              onSetValue={setCell}
              readOnly={finished}
              conflictIndices={conflicts}
            />
            {!finished && (
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="mt-4 w-full rounded-2xl bg-cyan-600 py-3 font-semibold text-white shadow-md disabled:opacity-60"
              >
                {submitting ? "Checking…" : "Submit solution"}
              </button>
            )}
          </>
        )}
      </div>

      <PlayLeaderboard
        title="Sudoku leaderboard"
        scope={lbScope}
        onScopeChange={setLbScope}
        entries={leaderboard as never[]}
        emptyMessage={
          lbScope === "today"
            ? "No one has finished today's Sudoku yet. Be the first!"
            : "All-time board fills up as classmates complete daily puzzles."
        }
        columns={
          lbScope === "today"
            ? [
                { key: "durationLabel", label: "Time" },
                { key: "mistakes", label: "Mistakes" },
              ]
            : [
                { key: "allTimeScore", label: "Score" },
                { key: "bestDurationLabel", label: "Best" },
                {
                  key: "currentStreak",
                  label: "Streak",
                  render: (e) => (
                    <span>
                      {(e.currentStreak as number) > 0 && (
                        <Flame className="mr-1 inline h-3 w-3 text-orange-500" />
                      )}
                      {String(e.currentStreak)}
                    </span>
                  ),
                },
              ]
        }
      />
    </NavShell>
  );
}
