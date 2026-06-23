import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sessionCanManageTimetable } from "@/lib/permissions";
import { logTimetableActivity, parseEntryPayload, resolveSubjectId } from "@/lib/timetable-manage";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !(await sessionCanManageTimetable(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.timetableEntry.findUnique({
    where: { id },
    include: { subject: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = parseEntryPayload(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const subjectId = await resolveSubjectId(parsed);
    if (!subjectId) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    const entry = await prisma.timetableEntry.update({
      where: { id },
      data: {
        date: parsed.date,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        room: parsed.room,
        faculty: parsed.faculty,
        subjectId,
      },
      include: { subject: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { name: true },
    });

    await logTimetableActivity(
      session.id,
      `${user?.name?.split(" ")[0] || "Admin"} rescheduled ${entry.subject.name}: now ${parsed.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${parsed.startTime} – ${parsed.endTime}.`
    );

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Could not update class." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !(await sessionCanManageTimetable(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.timetableEntry.findUnique({
    where: { id },
    include: { subject: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  await prisma.timetableEntry.delete({ where: { id } });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true },
  });

  await logTimetableActivity(
    session.id,
    `${user?.name?.split(" ")[0] || "Admin"} removed a class: ${existing.subject.name} (${existing.startTime} – ${existing.endTime}).`
  );

  return NextResponse.json({ ok: true });
}
