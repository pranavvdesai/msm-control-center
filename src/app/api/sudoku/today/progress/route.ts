import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIstDateString } from "@/lib/play/ist-date";
import {
  mergeSudokuProgress,
  completeSudokuAttempt,
  pauseSudokuTimer,
  resumeSudokuTimer,
  finalizeAttemptDuration,
} from "@/lib/play/daily-service";
import { parseGrid } from "@/lib/sudoku/grid";
import { sudokuDailyScore } from "@/lib/sudoku/generator";
import { getAttemptActiveMs } from "@/lib/sudoku/timer";

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const dateStr = getIstDateString();

  const attempt = await prisma.sudokuAttempt.findUnique({
    where: { userId_puzzleDate: { userId: session.id, puzzleDate: dateStr } },
  });
  if (!attempt || attempt.status === "completed") {
    return NextResponse.json({ error: "Cannot update" }, { status: 400 });
  }

  if (body.timer === "pause") {
    const updated = await pauseSudokuTimer(attempt.id);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      elapsedMs: updated.elapsedMs,
      activeMs: updated.elapsedMs,
      timerRunning: false,
    });
  }

  if (body.timer === "resume") {
    const updated = await resumeSudokuTimer(attempt.id);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      elapsedMs: updated.elapsedMs,
      activeMs: getAttemptActiveMs(updated.elapsedMs, updated.timerStartedAt),
      timerRunning: !!updated.timerStartedAt,
    });
  }

  const currentGrid = body.currentGrid as string;
  const mistakes = Number(body.mistakes) || 0;

  if (!currentGrid || currentGrid.length !== 81) {
    return NextResponse.json({ error: "Invalid grid" }, { status: 400 });
  }

  const puzzle = await prisma.dailySudoku.findUnique({ where: { puzzleDate: dateStr } });
  if (!puzzle) return NextResponse.json({ error: "No puzzle today" }, { status: 404 });

  const merged = mergeSudokuProgress(puzzle.initialGrid, currentGrid);
  const updated = await prisma.sudokuAttempt.update({
    where: { id: attempt.id },
    data: {
      currentGrid: merged,
      mistakes: Math.max(attempt.mistakes, mistakes),
    },
  });

  return NextResponse.json({
    ok: true,
    currentGrid: updated.currentGrid,
    activeMs: getAttemptActiveMs(updated.elapsedMs, updated.timerStartedAt),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const submitted = body.currentGrid as string;

  if (!submitted || submitted.length !== 81) {
    return NextResponse.json({ error: "Invalid grid" }, { status: 400 });
  }

  const dateStr = getIstDateString();
  const puzzle = await prisma.dailySudoku.findUnique({ where: { puzzleDate: dateStr } });
  if (!puzzle) return NextResponse.json({ error: "No puzzle today" }, { status: 404 });

  const attempt = await prisma.sudokuAttempt.findUnique({
    where: { userId_puzzleDate: { userId: session.id, puzzleDate: dateStr } },
  });
  if (!attempt || attempt.status === "completed") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  const merged = mergeSudokuProgress(puzzle.initialGrid, submitted);
  const grid = parseGrid(merged);
  const solution = parseGrid(puzzle.solution);

  if (grid.some((n) => n === 0)) {
    return NextResponse.json({ error: "Fill all cells before submitting" }, { status: 400 });
  }

  if (!grid.every((n, i) => n === solution[i])) {
    await prisma.sudokuAttempt.update({
      where: { id: attempt.id },
      data: { mistakes: attempt.mistakes + 1, currentGrid: merged },
    });
    return NextResponse.json({ error: "Incorrect solution — keep trying!", incorrect: true }, { status: 400 });
  }

  const completedAt = new Date();
  const durationMs = finalizeAttemptDuration(
    attempt.elapsedMs,
    attempt.timerStartedAt,
    completedAt
  );

  if (durationMs < 30000) {
    return NextResponse.json(
      { error: "Need at least 30 seconds of active solve time" },
      { status: 400 }
    );
  }

  await prisma.sudokuAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "completed",
      completedAt,
      durationMs,
      elapsedMs: durationMs,
      timerStartedAt: null,
      currentGrid: merged,
    },
  });

  await completeSudokuAttempt(session.id, dateStr, durationMs, attempt.mistakes);

  const rank = await prisma.sudokuAttempt.count({
    where: {
      puzzleDate: dateStr,
      status: "completed",
      OR: [
        { durationMs: { lt: durationMs } },
        { durationMs, completedAt: { lt: completedAt } },
      ],
    },
  });

  return NextResponse.json({
    ok: true,
    durationMs,
    rank: rank + 1,
    dailyScore: sudokuDailyScore(durationMs, attempt.mistakes),
  });
}
