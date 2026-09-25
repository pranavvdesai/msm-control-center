"use client";

import { Clock, Info, Trophy, X } from "lucide-react";

export function SudokuInstructionsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-cyan-600" />
            <h2 className="text-lg font-bold text-slate-900">How Daily Sudoku works</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 text-sm text-slate-700">
          <p>
            Everyone in MSM gets the <strong>same puzzle today</strong> (IST midnight reset). Puzzles
            come from <strong>Sudoku Mountain</strong> at master difficulty.
          </p>

          <div className="rounded-xl bg-cyan-50 p-3">
            <p className="mb-1 flex items-center gap-2 font-semibold text-cyan-900">
              <Clock className="h-4 w-4" /> Timer rules
            </p>
            <ul className="list-inside list-disc space-y-1 text-cyan-950/90">
              <li>Timer runs <strong>only while this Sudoku tab is open</strong>.</li>
              <li>Switch apps, another tab, or lock your phone → timer <strong>pauses</strong>.</li>
              <li>Come back to this page → timer <strong>resumes</strong> automatically.</li>
              <li>Leaderboard ranks by <strong>active solve time</strong> (lower is better).</li>
            </ul>
          </div>

          <ul className="list-inside list-disc space-y-1">
            <li>Tap a cell, then pick 1–9 (or ✕ to clear).</li>
            <li>Gray cells are fixed — you cannot change them.</li>
            <li>Fill all 81 cells, then tap <strong>Submit solution</strong>.</li>
            <li>Wrong submit counts as a mistake — keep trying until correct.</li>
            <li>Progress auto-saves; one completed run per day.</li>
          </ul>

          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Trophy className="h-3.5 w-3.5" />
            Check Today / All-time boards below when you finish.
          </p>
        </div>

        <div className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-cyan-600 py-2.5 font-semibold text-white"
          >
            Got it — start playing
          </button>
        </div>
      </div>
    </div>
  );
}
