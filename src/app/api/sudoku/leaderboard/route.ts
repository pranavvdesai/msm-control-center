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
    const rows = await prisma.sudokuAttempt.findMany({
      where: { puzzleDate: dateStr, status: "completed" },
      include: { user: { select: { id: true, name: true, rollNumber: true } } },
      orderBy: [{ durationMs: "asc" }, { completedAt: "asc" }],
      take: 30,
    });

    const leaderboard = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user.id,
      name: r.user.name.split(" ")[0],
      rollNumber: r.user.rollNumber,
      durationMs: r.durationMs!,
      durationLabel: formatDuration(r.durationMs!),
      mistakes: r.mistakes,
      isYou: r.user.id === session.id,
    }));

    const myAttempt = await prisma.sudokuAttempt.findUnique({
      where: { userId_puzzleDate: { userId: session.id, puzzleDate: dateStr } },
    });

    return NextResponse.json({
      scope: "today",
      date: dateStr,
      leaderboard,
      myRank:
        myAttempt?.status === "completed"
          ? leaderboard.find((e) => e.isYou)?.rank ?? null
          : null,
      totalCompleted: rows.length,
    });
  }

  const stats = await prisma.sudokuUserStats.findMany({
    include: { user: { select: { id: true, name: true, rollNumber: true } } },
    orderBy: [{ allTimeScore: "desc" }, { bestDurationMs: "asc" }],
    take: 30,
  });

  const leaderboard = stats.map((s, i) => ({
    rank: i + 1,
    userId: s.user.id,
    name: s.user.name.split(" ")[0],
    rollNumber: s.user.rollNumber,
    allTimeScore: s.allTimeScore,
    totalCompleted: s.totalCompleted,
    bestDurationMs: s.bestDurationMs,
    bestDurationLabel: s.bestDurationMs ? formatDuration(s.bestDurationMs) : "—",
    currentStreak: s.currentStreak,
    isYou: s.user.id === session.id,
  }));

  return NextResponse.json({ scope: "alltime", leaderboard });
}
