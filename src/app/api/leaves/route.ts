import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildLeaveFeedMessage, buildClassmateAlert } from "@/lib/alerts";
import { sendOneLeaveLeftAlertIfNeeded } from "@/lib/attendance-alert-email";
import { endOfDay, normalizeTimetableEntries, startOfDay } from "@/lib/utils";
import { maxLeavesForCredits } from "@/lib/utils";
import { isExcludedSubject } from "@/lib/subjects";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  const leaves = await prisma.leave.findMany({
    where: { userId: session.id },
    include: { subject: true, timetableEntry: true },
    orderBy: { date: "desc" },
  });

  if (dateParam) {
    const date = new Date(dateParam);
    const raw = await prisma.timetableEntry.findMany({
      where: { date: { gte: startOfDay(date), lte: endOfDay(date) } },
      include: { subject: true },
    });
    const entries = normalizeTimetableEntries(raw).filter(
      (e) => !isExcludedSubject(e.subject.name)
    );
    return NextResponse.json({ entries, leaves });
  }

  return NextResponse.json({ leaves });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { timetableEntryId, type, reason } = body;

    if (!timetableEntryId || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const entry = await prisma.timetableEntry.findUnique({
      where: { id: timetableEntryId },
      include: { subject: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const existing = await prisma.leave.findFirst({
      where: { userId: session.id, timetableEntryId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Leave already marked for this lecture" },
        { status: 409 }
      );
    }

    const leave = await prisma.leave.create({
      data: {
        userId: session.id,
        subjectId: entry.subjectId,
        timetableEntryId: entry.id,
        date: entry.date,
        type,
        reason: type === "CONDONED" ? reason || "Personal reason" : null,
      },
      include: { subject: true },
    });

    await prisma.activityEvent.create({
      data: {
        userId: session.id,
        message: buildLeaveFeedMessage(session.name, entry.subject.name, type),
        type: "leave",
      },
    });

    if (type === "REGULAR") {
      const regularCount = await prisma.leave.count({
        where: {
          userId: session.id,
          subjectId: entry.subjectId,
          type: "REGULAR",
        },
      });
      const maxLeaves = maxLeavesForCredits(entry.subject.credits);
      if (regularCount >= maxLeaves - 1) {
        await prisma.activityEvent.create({
          data: {
            userId: session.id,
            message: buildClassmateAlert(
              session.name,
              entry.subject.name,
              regularCount,
              maxLeaves
            ),
            type: "social",
          },
        });
      }

      await sendOneLeaveLeftAlertIfNeeded(
        session.id,
        entry.subjectId,
        entry.subject.name,
        entry.subject.credits
      );
    }

    return NextResponse.json({ leave });
  } catch {
    return NextResponse.json({ error: "Failed to mark leave" }, { status: 500 });
  }
}
