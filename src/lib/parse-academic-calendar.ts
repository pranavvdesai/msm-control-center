import * as XLSX from "xlsx";

export type ParsedCalendarEvent = {
  date: string;
  type: "HOLIDAY" | "EVENT" | "EXAM" | "LONG_WEEKEND";
  title: string;
  description?: string;
  term?: string;
};

function parseDate(value: string): string | null {
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const dmyText = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmyText) {
    const months: Record<string, number> = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
    };
    const day = parseInt(dmyText[1], 10);
    const month = months[dmyText[2]];
    const year = parseInt(dmyText[3], 10);
    if (!month) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function normalizeType(raw: string): ParsedCalendarEvent["type"] | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (t.includes("holiday") || t.includes("off") || t === "red" || t === "h") return "HOLIDAY";
  if (t.includes("exam")) return "EXAM";
  if (t.includes("long") && t.includes("weekend")) return "LONG_WEEKEND";
  if (t.includes("weekend")) return "LONG_WEEKEND";
  if (t.includes("event") || t.includes("major")) return "EVENT";
  return "EVENT";
}

export function parseAcademicCalendarExcel(buffer: ArrayBuffer): ParsedCalendarEvent[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: "" });

  const events: ParsedCalendarEvent[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row?.length) continue;

    const cells = row.map((c) => String(c).trim());
    const headerLike = cells[0]?.toLowerCase() === "date" || cells[0]?.toLowerCase().includes("date");
    if (headerLike && i === 0) continue;

    let dateStr: string | null = null;
    let typeRaw = "";
    let title = "";
    let description = "";
    let term = "";

    if (cells.length >= 3 && parseDate(cells[0])) {
      dateStr = parseDate(cells[0]);
      typeRaw = cells[1];
      title = cells[2];
      description = cells[3] || "";
      term = cells[4] || "";
    } else {
      for (const cell of cells) {
        const d = parseDate(cell);
        if (d) {
          dateStr = d;
          break;
        }
      }
      const rest = cells.filter((c) => !parseDate(c) && c);
      typeRaw = rest[0] || "holiday";
      title = rest[1] || rest[0] || "Academic day";
      description = rest.slice(2).join(" ");
    }

    if (!dateStr) continue;
    const type = normalizeType(typeRaw || title);
    if (!type) continue;

    events.push({
      date: dateStr,
      type,
      title: title || typeRaw || "Academic event",
      description: description || undefined,
      term: term || (type === "EXAM" ? "Term 4" : undefined),
    });
  }

  return events;
}
