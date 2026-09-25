import { prisma } from "@/lib/db";
import { getIstDateString } from "@/lib/play/ist-date";
import { ensurePlaySchema } from "@/lib/play/ensure-schema";
import { sudokuDailyScore } from "@/lib/sudoku/generator";
import { resolveDailySudoku } from "@/lib/sudoku/mtsudoku";
import { getAttemptActiveMs } from "@/lib/sudoku/timer";
import { pickDailyQuizQuestions } from "@/lib/quiz/question-bank";
import { parseGrid, serializeGrid } from "@/lib/sudoku/grid";

export async function ensureDailySudoku(dateStr = getIstDateString()) {
  await ensurePlaySchema();

  const existing = await prisma.dailySudoku.findUnique({ where: { puzzleDate: dateStr } });
  if (existing) return existing;

  const generated = await resolveDailySudoku(dateStr);
  return prisma.dailySudoku.create({
    data: {
      puzzleDate: dateStr,
      initialGrid: generated.initialGrid,
      solution: generated.solution,
      difficulty: generated.difficulty,
      clueCount: generated.clueCount,
      source: generated.source,
      seed: generated.seed,
    },
  });
}

export async function ensureDailyQuiz(dateStr = getIstDateString()) {
  const existing = await prisma.dailyQuiz.findUnique({ where: { quizDate: dateStr } });
  if (existing) return existing;

  const questions = pickDailyQuizQuestions(dateStr);
  return prisma.dailyQuiz.create({
    data: {
      quizDate: dateStr,
      questions: JSON.stringify(questions),
    },
  });
}

export async function ensureDailyPlayContent(dateStr = getIstDateString()) {
  const [sudoku, quiz] = await Promise.all([
    ensureDailySudoku(dateStr),
    ensureDailyQuiz(dateStr),
  ]);
  return { sudoku, quiz, dateStr };
}

export async function getOrCreateSudokuAttempt(userId: string, puzzleId: string, puzzleDate: string, initialGrid: string) {
  let attempt = await prisma.sudokuAttempt.findUnique({
    where: { userId_puzzleDate: { userId, puzzleDate } },
  });
  if (!attempt) {
    const now = new Date();
    attempt = await prisma.sudokuAttempt.create({
      data: {
        userId,
        puzzleId,
        puzzleDate,
        currentGrid: initialGrid,
        elapsedMs: 0,
        timerStartedAt: now,
      },
    });
  } else if (attempt.status === "in_progress" && !attempt.timerStartedAt) {
    attempt = await prisma.sudokuAttempt.update({
      where: { id: attempt.id },
      data: { timerStartedAt: new Date() },
    });
  }
  return attempt;
}

export async function pauseSudokuTimer(attemptId: string) {
  const attempt = await prisma.sudokuAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.status !== "in_progress" || !attempt.timerStartedAt) {
    return attempt;
  }
  const now = new Date();
  const activeMs = getAttemptActiveMs(attempt.elapsedMs, attempt.timerStartedAt, now.getTime());
  return prisma.sudokuAttempt.update({
    where: { id: attemptId },
    data: { elapsedMs: activeMs, timerStartedAt: null },
  });
}

export async function resumeSudokuTimer(attemptId: string) {
  const attempt = await prisma.sudokuAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.status !== "in_progress" || attempt.timerStartedAt) {
    return attempt;
  }
  return prisma.sudokuAttempt.update({
    where: { id: attemptId },
    data: { timerStartedAt: new Date() },
  });
}

export function finalizeAttemptDuration(
  elapsedMs: number,
  timerStartedAt: Date | null,
  now = new Date()
) {
  return getAttemptActiveMs(elapsedMs, timerStartedAt, now.getTime());
}

export async function getOrCreateQuizAttempt(userId: string, quizId: string, quizDate: string) {
  let attempt = await prisma.quizAttempt.findUnique({
    where: { userId_quizDate: { userId, quizDate } },
  });
  if (!attempt) {
    attempt = await prisma.quizAttempt.create({
      data: { userId, quizId, quizDate },
    });
  }
  return attempt;
}

export function updateStreak(
  lastDate: string | null | undefined,
  today: string,
  current: number
): { currentStreak: number; longestIncrement: number } {
  if (!lastDate) return { currentStreak: 1, longestIncrement: 1 };
  const [y1, m1, d1] = lastDate.split("-").map(Number);
  const [y2, m2, d2] = today.split("-").map(Number);
  const prev = new Date(Date.UTC(y1, m1 - 1, d1));
  const curr = new Date(Date.UTC(y2, m2 - 1, d2));
  const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
  if (diffDays === 0) return { currentStreak: current, longestIncrement: 0 };
  if (diffDays === 1) return { currentStreak: current + 1, longestIncrement: 1 };
  return { currentStreak: 1, longestIncrement: 1 };
}

export async function completeSudokuAttempt(
  userId: string,
  puzzleDate: string,
  durationMs: number,
  mistakes: number
) {
  const dailyPoints = sudokuDailyScore(durationMs, mistakes);

  const stats = await prisma.sudokuUserStats.findUnique({ where: { userId } });
  const streak = updateStreak(stats?.lastCompletedDate, puzzleDate, stats?.currentStreak ?? 0);

  await prisma.sudokuUserStats.upsert({
    where: { userId },
    create: {
      userId,
      totalCompleted: 1,
      allTimeScore: dailyPoints,
      bestDurationMs: durationMs,
      totalDurationMs: durationMs,
      currentStreak: streak.currentStreak,
      longestStreak: streak.currentStreak,
      lastCompletedDate: puzzleDate,
    },
    update: {
      totalCompleted: { increment: 1 },
      allTimeScore: { increment: dailyPoints },
      bestDurationMs:
        stats?.bestDurationMs == null
          ? durationMs
          : Math.min(stats.bestDurationMs, durationMs),
      totalDurationMs: { increment: durationMs },
      currentStreak: streak.currentStreak,
      longestStreak: Math.max(stats?.longestStreak ?? 0, streak.currentStreak),
      lastCompletedDate: puzzleDate,
    },
  });
}

export async function completeQuizAttempt(
  userId: string,
  quizDate: string,
  correctCount: number,
  score: number,
  durationMs: number
) {
  const stats = await prisma.quizUserStats.findUnique({ where: { userId } });
  const streak = updateStreak(stats?.lastCompletedDate, quizDate, stats?.currentStreak ?? 0);

  await prisma.quizUserStats.upsert({
    where: { userId },
    create: {
      userId,
      totalCompleted: 1,
      allTimeScore: score,
      bestScore: score,
      totalCorrect: correctCount,
      totalQuestions: 5,
      currentStreak: streak.currentStreak,
      longestStreak: streak.currentStreak,
      lastCompletedDate: quizDate,
    },
    update: {
      totalCompleted: { increment: 1 },
      allTimeScore: { increment: score },
      bestScore: Math.max(stats?.bestScore ?? 0, score),
      totalCorrect: { increment: correctCount },
      totalQuestions: { increment: 5 },
      currentStreak: streak.currentStreak,
      longestStreak: Math.max(stats?.longestStreak ?? 0, streak.currentStreak),
      lastCompletedDate: quizDate,
    },
  });
}

export function mergeSudokuProgress(initial: string, current: string) {
  const init = parseGrid(initial);
  const cur = parseGrid(current);
  return serializeGrid(
    cur.map((v, i) => (init[i] !== 0 ? init[i] : v))
  );
}
