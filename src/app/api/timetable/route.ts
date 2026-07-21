import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { endOfDay, normalizeTimetableEntries, startOfDay, timeToMinutes } from "@/lib/utils";
import { isExcludedSubject } from "@/lib/subjects";

function filterTrackableEntries<T extends { subject: { name: string } }>(entries: T[]): T[] {
  return entries.filter((e) => !isExcludedSubject(e.subject.name));
}

/**
 * Session number = position of a class within its subject across the whole
 * term (ordered by date, then start time). The 17th lecture of a subject is
 * "Session 17", matching the numbering in the uploaded Excel.
 */
async function buildSessionNumberMap(): Promise<Map<string, number>> {
  const all = await prisma.timetableEntry.findMany({
    select: { id: true, date: true, startTime: true, subjectId: true },
  });

  all.sort((a, b) => {
    const dayDiff = a.date.getTime() - b.date.getTime();
    if (dayDiff !== 0) return dayDiff;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  const counters = new Map<string, number>();
  const sessionByEntryId = new Map<string, number>();
  for (const entry of all) {
    const next = (counters.get(entry.subjectId) ?? 0) + 1;
    counters.set(entry.subjectId, next);
    sessionByEntryId.set(entry.id, next);
  }
  return sessionByEntryId;
}

function attachSessionNumbers<T extends { id: string }>(
  entries: T[],
  sessionMap: Map<string, number>
): Array<T & { sessionNumber: number | null }> {
  return entries.map((e) => ({ ...e, sessionNumber: sessionMap.get(e.id) ?? null }));
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const date = searchParams.get("date");

  const sessionMap = await buildSessionNumberMap();

  if (date) {
    const d = new Date(date);
    const raw = await prisma.timetableEntry.findMany({
      where: { date: { gte: startOfDay(d), lte: endOfDay(d) } },
      include: { subject: true },
    });
    const entries = attachSessionNumbers(
      filterTrackableEntries(normalizeTimetableEntries(raw)),
      sessionMap
    );
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
    const entries = attachSessionNumbers(
      filterTrackableEntries(normalizeTimetableEntries(raw)),
      sessionMap
    );
    return NextResponse.json({ entries });
  }

  const raw = await prisma.timetableEntry.findMany({
    include: { subject: true },
    orderBy: { date: "asc" },
    take: 100,
  });
  const entries = attachSessionNumbers(
    filterTrackableEntries(normalizeTimetableEntries(raw)),
    sessionMap
  );

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
