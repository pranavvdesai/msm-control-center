import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sessionCanUpload } from "@/lib/permissions";
import { parseTimetableExcel } from "@/lib/parse-timetable-excel";
import { normalizeClassTimePair } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !(await sessionCanUpload(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const replace = formData.get("replace") !== "false";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Please upload an Excel file (.xlsx)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseTimetableExcel(buffer);

    if (parsed.entries.length === 0) {
      return NextResponse.json(
        { error: "No timetable entries found in the file. Check the format." },
        { status: 400 }
      );
    }

    if (replace) {
      await prisma.timetableEntry.deleteMany();
    }

    let subjectsCreated = 0;
    for (const subject of parsed.subjects) {
      await prisma.subject.upsert({
        where: { code: subject.code },
        update: {
          name: subject.name,
          credits: subject.credits,
        },
        create: {
          code: subject.code,
          name: subject.name,
          credits: subject.credits,
        },
      });
      subjectsCreated++;
    }

    const dbSubjects = await prisma.subject.findMany();
    const codeMap = new Map(dbSubjects.map((s) => [s.code, s.id]));

    let created = 0;
    for (const entry of parsed.entries) {
      const subjectId = codeMap.get(entry.subjectCode);
      if (!subjectId) continue;

      const { startTime, endTime } = normalizeClassTimePair(entry.startTime, entry.endTime);

      await prisma.timetableEntry.create({
        data: {
          date: new Date(entry.date),
          startTime,
          endTime,
          room: entry.room,
          faculty: entry.faculty,
          subjectId,
        },
      });
      created++;
    }

    await prisma.activityEvent.create({
      data: {
        userId: session.id,
        message: `Term timetable uploaded! ${created} lectures loaded from ${file.name}. Faculty calendars updated (probably).`,
        type: "admin",
      },
    });

    return NextResponse.json({
      created,
      subjects: subjectsCreated,
      termInfo: parsed.termInfo,
      preview: parsed.entries.slice(0, 5),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
