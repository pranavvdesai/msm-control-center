import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDuration, getIstDateString } from "@/lib/play/ist-date";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") === "alltime" ? "alltime" : "today";
  const dateStr = getIstDateString();

  if (scope === "today") {
    const rows = await prisma.quizAttempt.findMany({
      where: { quizDate: dateStr, status: "completed" },
      include: { user: { select: { id: true, name: true, rollNumber: true } } },
      orderBy: [{ score: "desc" }, { durationMs: "asc" }, { completedAt: "asc" }],
      take: 30,
    });

    const leaderboard = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user.id,
      name: r.user.name.split(" ")[0],
      rollNumber: r.user.rollNumber,
      score: r.score,
      correctCount: r.correctCount,
      durationMs: r.durationMs!,
      durationLabel: formatDuration(r.durationMs!),
      isYou: r.user.id === session.id,
    }));

    return NextResponse.json({
      scope: "today",
      date: dateStr,
      leaderboard,
      totalCompleted: rows.length,
    });
  }

  const stats = await prisma.quizUserStats.findMany({
    include: { user: { select: { id: true, name: true, rollNumber: true } } },
    orderBy: [{ allTimeScore: "desc" }, { bestScore: "desc" }],
    take: 30,
  });

  const leaderboard = stats.map((s, i) => ({
    rank: i + 1,
    userId: s.user.id,
    name: s.user.name.split(" ")[0],
    rollNumber: s.user.rollNumber,
    allTimeScore: s.allTimeScore,
    totalCompleted: s.totalCompleted,
    bestScore: s.bestScore,
    totalCorrect: s.totalCorrect,
    totalQuestions: s.totalQuestions,
    currentStreak: s.currentStreak,
    isYou: s.user.id === session.id,
  }));

  return NextResponse.json({ scope: "alltime", leaderboard });
}
