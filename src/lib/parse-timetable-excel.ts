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

  const [, sh, sm, eh, em] = match;
  let endHour = parseInt(eh, 10);
  const startHour = parseInt(sh, 10);
  if (endHour < startHour) endHour += 12;

  const pad = (h: number, m: string) =>
    `${String(h).padStart(2, "0")}:${m}`;

  return {
    startTime: pad(startHour, sm),
    endTime: pad(endHour, em),
  };
}

function parseDate(value: string): string | null {
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const dmyMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmyMatch) {
    const months: Record<string, number> = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
    };
    const day = parseInt(dmyMatch[1], 10);
    const month = months[dmyMatch[2]];
    const year = parseInt(dmyMatch[3], 10);
    if (!month) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
    return {
      subjectCode: "INTERN",
      subjectName: "Internship Viva Voce",
      faculty: "Faculty Panel",
      room: "G2",
      sessionLabel: text.slice(0, 40),
    };
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
