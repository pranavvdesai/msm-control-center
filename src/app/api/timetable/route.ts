import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { endOfDay, normalizeTimetableEntries, startOfDay } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const date = searchParams.get("date");

  if (date) {
    const d = new Date(date);
    const raw = await prisma.timetableEntry.findMany({
      where: { date: { gte: startOfDay(d), lte: endOfDay(d) } },
      include: { subject: true },
    });
    const entries = normalizeTimetableEntries(raw);
    return NextResponse.json({ entries });
  }

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59, 999);
    const raw = await prisma.timetableEntry.findMany({
      where: { date: { gte: start, lte: end } },
      include: { subject: true },
      orderBy: { date: "asc" },
    });
    const entries = normalizeTimetableEntries(raw);
    return NextResponse.json({ entries });
  }

  const raw = await prisma.timetableEntry.findMany({
    include: { subject: true },
    orderBy: { date: "asc" },
    take: 100,
  });
  const entries = normalizeTimetableEntries(raw);

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { entries } = await request.json();
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const subjects = await prisma.subject.findMany();
    const subjectMap = new Map(subjects.map((s) => [s.code, s.id]));

    let created = 0;
    for (const entry of entries) {
      const subjectId = subjectMap.get(entry.subjectCode);
      if (!subjectId) continue;

      await prisma.timetableEntry.create({
        data: {
          date: new Date(entry.date),
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room || null,
          faculty: entry.faculty || null,
          subjectId,
        },
      });
      created++;
    }

    await prisma.activityEvent.create({
      data: {
        message: `Monthly timetable updated. ${created} lectures loaded.`,
        type: "admin",
      },
    });

    return NextResponse.json({ created });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
