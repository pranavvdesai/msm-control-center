import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildSubjectStats, getSubjectAlert } from "@/lib/alerts";
import { countUnmarkedEndedClasses } from "@/lib/class-reminder";
import {
  endOfDay,
  formatDate,
  normalizeTimetableEntries,
  startOfDay,
} from "@/lib/utils";
import { CR_FULL_NAME, CR_PHONE } from "@/lib/cohort";
import { isRamAdmin } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const settings = await prisma.appSettings.findFirst();
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  const leaves = await prisma.leave.findMany({
    where: { userId: session.id },
    include: { subject: true, timetableEntry: true },
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

  const rawTodayClasses = await prisma.timetableEntry.findMany({
    where: {
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    include: { subject: true },
  });

  const todayClasses = normalizeTimetableEntries(rawTodayClasses);

  const todayLeaves = leaves.filter(
    (l) => l.date >= startOfDay(today) && l.date <= endOfDay(today)
  );
  const markedEntryIds = new Set(
    todayLeaves.map((l) => l.timetableEntryId).filter(Boolean) as string[]
  );
  const unmarkedEndedClasses = countUnmarkedEndedClasses(
    todayClasses.map((c) => ({ id: c.id, endTime: c.endTime })),
    markedEntryIds
  );

  const feed = await prisma.activityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const totalRegular = leaves.filter((l) => l.type === "REGULAR").length;
  const totalCondoned = leaves.filter((l) => l.type === "CONDONED").length;

  let riskScore = 100;
  for (const s of subjectStats) {
    if (s.maxLeaves <= 0) continue;
    const usedPct = (s.effectiveLeaves / s.maxLeaves) * 100;
    riskScore -= usedPct / Math.max(subjectStats.length, 1);
  }
  riskScore = Math.max(0, Math.round(riskScore));

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { rollNumber: true, remindersEnabled: true },
  });

  return NextResponse.json({
    user: { ...session, canAdmin: isRamAdmin(dbUser?.rollNumber) },
    settings: settings
      ? settings
      : {
          crName: CR_FULL_NAME,
          crPhone: CR_PHONE,
          cohortName: "MSM",
          cohortFull: "Marketing and Sales Management",
          termInfo: "Term 4 · TAPMI Manipal",
        },
    subjectStats,
    todayClasses,
    todayLabel: formatDate(today),
    unmarkedEndedClasses,
    remindersEnabled: dbUser?.remindersEnabled ?? false,
    feed,
    summary: { totalRegular, totalCondoned, riskScore },
  });
}
