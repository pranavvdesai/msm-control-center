import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isWeekend, monthRange, parseLocalDate, toLocalDateKey } from "@/lib/utils";
import { sessionCanUpload } from "@/lib/permissions";

function serializeEvent(e: {
  id: string;
  date: Date;
  type: string;
  title: string;
  description: string | null;
  term: string | null;
}) {
  return {
    id: e.id,
    date: toLocalDateKey(e.date),
    type: e.type,
    title: e.title,
    description: e.description,
    term: e.term,
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const now = new Date();
  const [year, mon] = month
    ? month.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const { start, end } = monthRange(year, mon);

  const events = await prisma.calendarEvent.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });

  const serialized = events.map(serializeEvent);

  const holidays = serialized.filter(
    (e) => e.type === "HOLIDAY" && !isWeekend(parseLocalDate(e.date))
  );
  const majorEvents = serialized.filter((e) => e.type === "EVENT");
  const exams = serialized.filter(
    (e) => e.type === "EXAM" && (!e.term || e.term.toLowerCase().includes("term 4"))
  );
  const longWeekends = serialized.filter((e) => e.type === "LONG_WEEKEND");

  const totalInDb = await prisma.calendarEvent.count();

  return NextResponse.json({
    month: `${year}-${String(mon).padStart(2, "0")}`,
    holidays,
    majorEvents,
    exams,
    longWeekends,
    all: serialized,
    totalInDb,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !(await sessionCanUpload(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { events, replace } = await request.json();
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (replace) {
      await prisma.calendarEvent.deleteMany();
    }

    let created = 0;
    for (const event of events) {
      await prisma.calendarEvent.create({
        data: {
          date: parseLocalDate(event.date),
          type: event.type,
          title: event.title,
          description: event.description || null,
          term: event.term || null,
        },
      });
      created++;
    }

    await prisma.activityEvent.create({
      data: {
        message: `Academic calendar updated — ${created} entries loaded. Holidays, exams & long weekends synced.`,
        type: "admin",
      },
    });

    return NextResponse.json({ created });
  } catch {
    return NextResponse.json({ error: "Calendar upload failed" }, { status: 500 });
  }
}
