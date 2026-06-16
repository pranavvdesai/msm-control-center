import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { maxLeavesForCredits } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true },
  });

  const allLeaves = await prisma.leave.findMany({
    include: { subject: true },
  });

  const leaderboard = users
    .map((user) => {
      const userLeaves = allLeaves.filter((l) => l.userId === user.id);
      const regular = userLeaves.filter((l) => l.type === "REGULAR").length;
      const condoned = userLeaves.filter((l) => l.type === "CONDONED").length;

      let riskScore = 0;
      const subjects = new Map<string, { regular: number; max: number }>();
      for (const leave of userLeaves.filter((l) => l.type === "REGULAR")) {
        const key = leave.subjectId;
        const max = maxLeavesForCredits(leave.subject.credits);
        const current = subjects.get(key) || { regular: 0, max };
        current.regular++;
        subjects.set(key, current);
      }
      for (const { regular, max } of subjects.values()) {
        riskScore += (regular / max) * 100;
      }

      const attendanceScore = Math.max(0, 100 - riskScore / Math.max(subjects.size, 1));

      return {
        id: user.id,
        name: user.name,
        isYou: user.id === session.id,
        regular,
        condoned,
        attendanceScore: Math.round(attendanceScore),
        rank: 0,
      };
    })
    .sort((a, b) => b.attendanceScore - a.attendanceScore)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const cohortStats = {
    totalStudents: users.length,
    leavesToday: await prisma.leave.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    totalRegular: allLeaves.filter((l) => l.type === "REGULAR").length,
  };

  return NextResponse.json({ leaderboard: leaderboard.slice(0, 10), cohortStats });
}
