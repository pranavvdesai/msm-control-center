import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parseTimetableExcel } from "../src/lib/parse-timetable-excel";
import { endOfDay, normalizeClassTimePair, startOfDay } from "../src/lib/utils";

const prisma = new PrismaClient();

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

async function importExcel(filePath: string, onlyMonths?: string[]) {
  const buffer = fs.readFileSync(filePath);
  const parsed = parseTimetableExcel(buffer);

  let entries = parsed.entries;
  if (onlyMonths?.length) {
    entries = entries.filter((entry) => onlyMonths.includes(entry.date.slice(0, 7)));
  }

  if (entries.length === 0) {
    throw new Error(`No entries found in ${filePath}${onlyMonths ? ` for months ${onlyMonths.join(", ")}` : ""}`);
  }

  for (const subject of parsed.subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {
        name: subject.name,
        credits: subject.credits,
        faculty: subject.faculty,
      },
      create: {
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        faculty: subject.faculty,
      },
    });
  }

  const uploadDates = uniqueUploadDates(entries);
  await clearEntriesForDates(uploadDates);

  const dbSubjects = await prisma.subject.findMany();
  const codeMap = new Map(dbSubjects.map((s) => [s.code, s.id]));

  let created = 0;
  for (const entry of entries) {
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

  return {
    file: path.basename(filePath),
    created,
    dates: uploadDates.length,
    months: [...new Set(entries.map((e) => e.date.slice(0, 7)))].sort(),
  };
}

async function main() {
  const fileArg = process.argv[2];
  const monthsArg = process.argv[3];

  if (!fileArg) {
    console.error("Usage: tsx scripts/restore-timetable-from-excel.ts <path-to-xlsx> [months=2026-06,2026-05]");
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  const onlyMonths = monthsArg
    ?.split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const before = await prisma.timetableEntry.groupBy({
    by: ["date"],
    _count: true,
  });

  const result = await importExcel(filePath, onlyMonths);

  const after = await prisma.timetableEntry.findMany({
    select: { date: true },
    orderBy: { date: "asc" },
  });

  const monthCounts = after.reduce<Record<string, number>>((acc, row) => {
    const key = row.date.toISOString().slice(0, 7);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    JSON.stringify(
      {
        restored: result,
        previousEntryDays: before.length,
        monthCounts,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
