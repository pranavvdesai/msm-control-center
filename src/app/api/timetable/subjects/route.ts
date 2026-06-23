import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sessionCanManageTimetable } from "@/lib/permissions";
import { isExcludedSubject } from "@/lib/subjects";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, credits: true, faculty: true },
  });

  const canManage = await sessionCanManageTimetable(session);

  return NextResponse.json({
    subjects: subjects.filter((s) => !isExcludedSubject(s.name)),
    canManage,
  });
}
