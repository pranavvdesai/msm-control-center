import fs from "fs";
import { parseTimetableExcel } from "../src/lib/parse-timetable-excel";

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx scripts/inspect-timetable-excel.ts <path>");
  process.exit(1);
}

const parsed = parseTimetableExcel(fs.readFileSync(file));
const monthCounts = parsed.entries.reduce<Record<string, number>>((acc, e) => {
  const m = e.date.slice(0, 7);
  acc[m] = (acc[m] ?? 0) + 1;
  return acc;
}, {});

console.log(
  JSON.stringify(
    {
      file,
      termInfo: parsed.termInfo,
      subjects: parsed.subjects.length,
      entries: parsed.entries.length,
      monthCounts,
      firstDates: parsed.entries.slice(0, 5).map((e) => e.date),
      lastDates: parsed.entries.slice(-5).map((e) => e.date),
    },
    null,
    2
  )
);
