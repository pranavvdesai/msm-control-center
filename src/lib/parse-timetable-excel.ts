import * as XLSX from "xlsx";

export type ParsedSubject = {
  code: string;
  msmNumber: string;
  name: string;
  credits: number;
  faculty: string;
};

export type ParsedTimetableEntry = {
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  faculty: string;
  room: string;
  sessionLabel: string;
};

const TIME_COL_START = 3;
const TIME_COL_END = 9;

function parseTimeRange(slot: string): { startTime: string; endTime: string } | null {
  const cleaned = slot.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const sh = parseInt(match[1], 10);
  const sm = match[2];
  const eh = parseInt(match[3], 10);
  const em = match[4];

  let start24 = bareHourTo24(sh);
  let end24 = bareHourTo24(eh);
  if (end24 <= start24) end24 += 12;

  return {
    startTime: format12h(start24, sm),
    endTime: format12h(end24, em),
  };
}

function bareHourTo24(h: number): number {
  if (h >= 8 && h <= 11) return h;
  if (h === 12) return 12;
  if (h >= 1 && h <= 7) return h + 12;
  return h;
}

function format12h(hour24: number, minute: string): string {
  const mer = hour24 >= 12 ? "PM" : "AM";
  let h = hour24 % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${minute} ${mer}`;
}

function parseDate(value: string): string | null {
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

function parseLectureCell(
  cell: string,
  subjectMap: Map<string, ParsedSubject>
): Omit<ParsedTimetableEntry, "date" | "day" | "startTime" | "endTime"> | null {
  const text = cell.trim();
  if (!text) return null;

  const msmMatch = text.match(/MSM\s*(\d{4})\s*-\s*(\w+)\s*-\s*(\d+)\s*@\s*(.+)/i);
  if (msmMatch) {
    const [, msmNumber, initials, session, room] = msmMatch;
    const subject = subjectMap.get(msmNumber);
    if (!subject) return null;

    return {
      subjectCode: subject.code,
      subjectName: subject.name,
      faculty: subject.faculty,
      room: room.trim(),
      sessionLabel: `${initials}-${session}`,
    };
  }

  if (text.toLowerCase().includes("internship") || text.toLowerCase().includes("viva")) {
    return null;
  }

  return null;
}

function extractSubjects(rows: unknown[][]): ParsedSubject[] {
  const subjects: ParsedSubject[] = [];
  const headerIdx = rows.findIndex(
    (r) => String(r[0]).trim() === "Code" && String(r[3]).includes("Course Name")
  );

  if (headerIdx === -1) return subjects;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const rawCode = String(row[0] || "").trim();
    const name = String(row[3] || "").trim();
    const credits = parseInt(String(row[5] || "0"), 10);
    const faculty = String(row[6] || "").trim();

    if (!rawCode || !name || !credits) continue;

    const msmMatch = rawCode.match(/MSM\s*(\d{4})/i);
    if (!msmMatch) continue;

    const msmNumber = msmMatch[1];
    const initials = rawCode.split("/")[1]?.trim() || msmNumber.slice(-3);

    subjects.push({
      code: `MSM${msmNumber}`,
      msmNumber,
      name: name.replace(/\s+/g, " ").trim(),
      credits,
      faculty: faculty || `Prof. ${initials}`,
    });
  }

  return subjects;
}

export function parseTimetableExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const subjects = extractSubjects(rows);
  const subjectMap = new Map(subjects.map((s) => [s.msmNumber, s]));

  const headerIdx = rows.findIndex(
    (r) => String(r[0]).trim() === "Date" && String(r[1]).trim() === "Day"
  );

  if (headerIdx === -1) {
    throw new Error("Could not find timetable header row (Date, Day, ...)");
  }

  const headerRow = rows[headerIdx];
  const timeSlots: Array<{ col: number; startTime: string; endTime: string }> = [];

  for (let col = TIME_COL_START; col <= TIME_COL_END; col++) {
    const slot = String(headerRow[col] || "").trim();
    const times = parseTimeRange(slot);
    if (times) {
      timeSlots.push({ col, ...times });
    }
  }

  const entries: ParsedTimetableEntry[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const dateStr = parseDate(String(row[0] || ""));
    const day = String(row[1] || "").trim();
    const dayType = String(row[2] || "").trim();

    if (!dateStr || dayType === "Weekly Off" || day === "Weekly Off") continue;
    if (String(row[0]).trim() === "Code") break;

    for (const slot of timeSlots) {
      const cell = String(row[slot.col] || "").trim();
      if (!cell) continue;

      const parsed = parseLectureCell(cell, subjectMap);
      if (!parsed) continue;

      entries.push({
        date: dateStr,
        day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        ...parsed,
      });
    }
  }

  const termInfo = rows
    .map((r) => String(r[0] || ""))
    .find((t) => t.includes("Duration"));

  return {
    sheetName,
    termInfo: termInfo || "",
    subjects,
    entries,
  };
}
