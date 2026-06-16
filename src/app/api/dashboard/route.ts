import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildSubjectStats, getSubjectAlert } from "@/lib/alerts";
import { endOfDay, startOfDay } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const settings = await prisma.appSettings.findFirst();
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  const leaves = await prisma.leave.findMany({
    where: { userId: session.id },
    include: { subject: true },
  });

  const subjectStats = subjects.map((subject) => {
    const subjectLeaves = leaves.filter((l) => l.subjectId === subject.id);
    const regularAbsences = subjectLeaves.filter((l) => l.type === "REGULAR").length;
    const condonedLeaves = subjectLeaves.filter((l) => l.type === "CONDONED").length;
    const stats = buildSubjectStats(
      subject.name,
      subject.credits,
      regularAbsences,
      condonedLeaves
    );
    return { ...stats, alert: getSubjectAlert(stats) };
  });

  const todayClasses = await prisma.timetableEntry.findMany({
    where: {
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    include: { subject: true },
    orderBy: { startTime: "asc" },
  });

  const feed = await prisma.activityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const totalRegular = leaves.filter((l) => l.type === "REGULAR").length;
  const totalCondoned = leaves.filter((l) => l.type === "CONDONED").length;

  let riskScore = 100;
  const atRisk = subjectStats.filter((s) => s.remainingLeaves <= 1);
  if (subjectStats.length > 0) {
    const avgRemaining =
      subjectStats.reduce((sum, s) => sum + s.remainingLeaves / s.maxLeaves, 0) /
      subjectStats.length;
    riskScore = Math.round(avgRemaining * 100);
  }

  return NextResponse.json({
    user: session,
    settings,
    subjectStats,
    todayClasses,
    feed,
    summary: { totalRegular, totalCondoned, riskScore },
  });
}
