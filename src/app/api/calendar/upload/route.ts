import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseAcademicCalendarExcel } from "@/lib/parse-academic-calendar";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const replace = formData.get("replace") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseAcademicCalendarExcel(buffer);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No calendar events found. Use columns: Date, Type, Title" },
        { status: 400 }
      );
    }

    if (replace) {
      await prisma.calendarEvent.deleteMany();
    }

    for (const event of parsed) {
      await prisma.calendarEvent.create({
        data: {
          date: new Date(event.date),
          type: event.type,
          title: event.title,
          description: event.description || null,
          term: event.term || null,
        },
      });
    }

    await prisma.activityEvent.create({
      data: {
        message: `Academic calendar uploaded — ${parsed.length} entries (holidays, events, exams).`,
        type: "admin",
      },
    });

    return NextResponse.json({ created: parsed.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Calendar parse failed" }, { status: 500 });
  }
}
