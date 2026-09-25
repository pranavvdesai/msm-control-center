import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatIstDisplay, getIstDateString } from "@/lib/play/ist-date";
import {
  ensureDailySudoku,
  getOrCreateSudokuAttempt,
} from "@/lib/play/daily-service";
import { sudokuSourceLabel } from "@/lib/sudoku/mtsudoku";
import { getAttemptActiveMs, isTimerRunning } from "@/lib/sudoku/timer";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const dateStr = getIstDateString();
    const puzzle = await ensureDailySudoku(dateStr);
    const attempt = await getOrCreateSudokuAttempt(
      session.id,
      puzzle.id,
      dateStr,
      puzzle.initialGrid
    );

    const completedCount = await prisma.sudokuAttempt.count({
      where: { puzzleDate: dateStr, status: "completed" },
    });

    const activeMs = getAttemptActiveMs(attempt.elapsedMs, attempt.timerStartedAt);

    return NextResponse.json({
      date: dateStr,
      dateLabel: formatIstDisplay(dateStr),
      difficulty: puzzle.difficulty,
      source: puzzle.source ?? "mtsudoku",
      sourceLabel: sudokuSourceLabel(puzzle.source ?? "mtsudoku", puzzle.difficulty),
      clueCount: puzzle.clueCount,
      initialGrid: puzzle.initialGrid,
      attempt: {
        id: attempt.id,
        status: attempt.status,
        currentGrid: attempt.currentGrid,
        mistakes: attempt.mistakes,
        durationMs: attempt.durationMs,
        elapsedMs: attempt.elapsedMs ?? 0,
        activeMs,
        timerRunning: isTimerRunning(attempt.timerStartedAt),
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      },
      cohortCompleted: completedCount,
    });
  } catch (e) {
    console.error("Sudoku today error:", e);
    const message = e instanceof Error ? e.message : "Failed to load puzzle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
