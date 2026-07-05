import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sessionCanUpload } from "@/lib/permissions";
import { parseTimetableExcel } from "@/lib/parse-timetable-excel";
import { normalizeClassTimePair, startOfDay, endOfDay } from "@/lib/utils";

function uniqueUploadDates(entries: { date: string }[]) {
  return [...new Set(entries.map((entry) => entry.date))];
}

async function clearEntriesForDates(dateKeys: string[]) {
  for (const dateKey of dateKeys) {
    await prisma.timetableEntry.deleteMany({
      where: {
        date: {
          gte: startOfDay(dateKey),
          lte: endOfDay(dateKey),
        },
      },
    });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !(await sessionCanUpload(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const replaceAll = formData.get("replaceAll") === "true";

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

    const uploadDates = uniqueUploadDates(parsed.entries);

    if (replaceAll) {
      await prisma.timetableEntry.deleteMany();
    } else {
      await clearEntriesForDates(uploadDates);
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
        message: replaceAll
          ? `Full timetable replaced from ${file.name} — ${created} lectures loaded.`
          : `Timetable updated for ${uploadDates.length} day(s) from ${file.name}. ${created} lectures loaded — older months kept.`,
        type: "admin",
      },
    });

    return NextResponse.json({
      created,
      subjects: subjectsCreated,
      termInfo: parsed.termInfo,
      preview: parsed.entries.slice(0, 5),
      replacedDates: uploadDates.length,
      replaceAll,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
