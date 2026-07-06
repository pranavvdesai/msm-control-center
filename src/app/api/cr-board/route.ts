import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildSubjectStats } from "@/lib/alerts";
import { countLeavesByType } from "@/lib/leaves";
import { sessionCanAccessCrBoard } from "@/lib/permissions";
import { isExcludedSubject } from "@/lib/subjects";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await sessionCanAccessCrBoard(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, subjects, leaves] = await Promise.all([
    prisma.user.findMany({
      orderBy: { rollNumber: "asc" },
      select: { id: true, name: true, rollNumber: true },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.leave.findMany({
      select: { userId: true, subjectId: true, type: true },
    }),
  ]);

  const trackableSubjects = subjects.filter((s) => !isExcludedSubject(s.name));

  const leavesByUser = new Map<string, typeof leaves>();
  for (const leave of leaves) {
    const list = leavesByUser.get(leave.userId) ?? [];
    list.push(leave);
    leavesByUser.set(leave.userId, list);
  }

  let atRiskCount = 0;

  const students = users.map((user) => {
    const userLeaves = leavesByUser.get(user.id) ?? [];
    let studentAtRisk = false;

    const subjectRows = trackableSubjects.map((subject) => {
      const subjectLeaves = userLeaves.filter((l) => l.subjectId === subject.id);
      const { regularAbsences, condonedLeaves, lateMarks } = countLeavesByType(subjectLeaves);
      const stats = buildSubjectStats(
        subject.name,
        subject.credits,
        regularAbsences,
        condonedLeaves,
        lateMarks
      );

      if (stats.remainingLeaves <= 1) {
        studentAtRisk = true;
      }

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        credits: subject.credits,
        maxLeaves: stats.maxLeaves,
        regularAbsences: stats.regularAbsences,
        condonedLeaves: stats.condonedLeaves,
        lateMarks: stats.lateMarks,
        effectiveLeaves: stats.effectiveLeaves,
        remainingLeaves: stats.remainingLeaves,
      };
    });

    if (studentAtRisk) atRiskCount++;

    const totalRegular = userLeaves.filter((l) => l.type === "REGULAR").length;
    const totalCondoned = userLeaves.filter((l) => l.type === "CONDONED").length;

    return {
      id: user.id,
      name: user.name,
      rollNumber: user.rollNumber,
      totalRegular,
      totalCondoned,
      subjects: subjectRows,
      atRisk: studentAtRisk,
    };
  });

  return NextResponse.json({
    subjects: trackableSubjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      credits: s.credits,
      maxLeaves: s.credits,
    })),
    students,
    summary: {
      totalStudents: students.length,
      atRiskCount,
      criticalCount: students.filter((s) =>
        s.subjects.some((sub) => sub.remainingLeaves === 0)
      ).length,
    },
  });
}
