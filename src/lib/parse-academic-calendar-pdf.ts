import type { ParsedCalendarEvent } from "./parse-academic-calendar";

type PdfTextItem = {
  x: number;
  y: number;
  clr?: number | string;
  R: { T: string }[];
};

type PdfPage = {
  Texts?: PdfTextItem[];
};

type PdfData = {
  Pages?: PdfPage[];
};

type PdfItem = {
  text: string;
  clr: number;
  x: number;
  y: number;
};

type MonthColumn = {
  x: number;
  month: number;
  year: number;
};

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const MONTH_HEADER_RE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})$/i;
const DOW_RE =
  /^(M|T|W|TH|F|S|SU|MO|TU|WE|FR|SA|SUN|MON|TUE|WED|THU|FRI|SAT|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunda?y?)$/i;

function decodePdfText(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

function isRedColor(clr?: number | string): boolean {
  if (clr === 1 || clr === "1") return true;
  if (clr === undefined || clr === null) return false;
  const c = String(clr).trim().toLowerCase();
  if (c.startsWith("#")) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return r > 180 && g < 120 && b < 120;
  }
  const parts = c.split(/[,;]/).map((n) => parseFloat(n.trim()));
  if (parts.length >= 3) {
    const [r, g, b] = parts;
    if (r <= 1 && g <= 1) return r > 0.65 && g < 0.35 && b < 0.35;
    return r > 180 && g < 120 && b < 120;
  }
  return c.includes("red");
}

function parseDateFromText(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dmy = trimmed.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const dmyText = trimmed.match(/\b(\d{1,2})[-/.]([A-Za-z]{3})[-/.](\d{4})\b/);
  if (dmyText) {
    const day = parseInt(dmyText[1], 10);
    const month = MONTH_MAP[dmyText[2].toLowerCase()];
    const year = parseInt(dmyText[3], 10);
    if (!month) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const monthName = trimmed.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})\b/i
  );
  if (monthName) {
    const months: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    };
    const m = months[monthName[2].toLowerCase()];
    if (m) {
      return `${monthName[3]}-${String(m).padStart(2, "0")}-${monthName[1].padStart(2, "0")}`;
    }
  }

  return null;
}

function extractPdfItems(pdfData: PdfData): PdfItem[] {
  const items: PdfItem[] = [];
  for (const page of pdfData.Pages || []) {
    for (const item of page.Texts || []) {
      const text = item.R.map((r) => decodePdfText(r.T)).join(" ").trim();
      if (!text) continue;
      items.push({
        text,
        clr: typeof item.clr === "number" ? item.clr : 0,
        x: item.x,
        y: item.y,
      });
    }
  }
  return items;
}

function columnForX(x: number, headers: MonthColumn[]): number {
  let best = 0;
  for (let i = 0; i < headers.length; i++) {
    if (x >= headers[i].x - 1.15) best = i;
  }
  return best;
}

function extractMonthHeaders(items: PdfItem[]): MonthColumn[] {
  return items
    .filter((item) => MONTH_HEADER_RE.test(item.text))
    .map((item) => {
      const match = item.text.match(MONTH_HEADER_RE)!;
      return {
        x: item.x,
        month: MONTH_MAP[match[1].toLowerCase()],
        year: 2000 + parseInt(match[2], 10),
      };
    })
    .sort((a, b) => a.x - b.x);
}

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function cleanCellTitle(raw: string): string {
  return raw
    .replace(/\bSunda\s+y\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\|\s*\|/g, "|")
    .trim();
}

function isInternshipVivaOnly(text: string): boolean {
  return /internship/i.test(text) && /viva/i.test(text) && !/term\s*4/i.test(text);
}

function appliesToMkt(text: string): boolean {
  const t = text.toUpperCase();
  if (/MBA-MKT|\bMKT\b/.test(t)) return true;
  if (/TERM\s*4/.test(t) && /MBA|TERM|EXAM|CLASS|RESULT|START|LAST DAY/i.test(t)) return true;
  if (/ALL PROGRAMS|ALL STUDENTS|NO CLASSES FOR STUDENTS/i.test(t)) return true;
  return false;
}

function inferGridEventType(text: string, isRed: boolean): ParsedCalendarEvent["type"] {
  const t = text.toUpperCase();
  if (
    isRed ||
    /\bHOLIDAY\b/.test(t) ||
    /HOLI|JAYANTHI|DEEPAVALI|DIWALI|INDEPENDENCE|REPUBLIC|CHRISTMAS|GOOD FRIDAY|GANESH|DURGA|RAMZAN|LOHRI|KRISHNA|VINAYAKA|VIJAYA|KARNATAKA|MAY DAY|RAJYOTSAVA/.test(
      t
    )
  ) {
    return "HOLIDAY";
  }
  if (/LONG WEEKEND/.test(t)) return "LONG_WEEKEND";
  if (
    (/EXAM|END TERM|MID TERM/.test(t) && /TERM\s*4/.test(t)) ||
    /LAST DAY OF CLASSES.*TERM\s*4|TERM\s*4.*START/i.test(t)
  ) {
    return "EXAM";
  }
  return "EVENT";
}

function buildTitleFromBand(band: PdfItem[], dayMarker: PdfItem): string {
  const chunks: string[] = [];
  let current = "";

  const sorted = [...band].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const part of sorted) {
    if (/^\d{1,2}$/.test(part.text) || DOW_RE.test(part.text)) continue;
    if (part.y > dayMarker.y + 0.35 && current) {
      chunks.push(current.trim());
      current = "";
    }
    current += (current ? " " : "") + part.text;
  }
  if (current.trim()) chunks.push(current.trim());

  return cleanCellTitle(chunks.join(" | "));
}

/** TAPMI academic calendar PDFs use a month-column grid (not inline dates). */
function parseTapmiGridCalendar(items: PdfItem[]): ParsedCalendarEvent[] {
  const headers = extractMonthHeaders(items);
  if (headers.length < 6) return [];

  const byColumn: PdfItem[][] = Array.from({ length: headers.length }, () => []);
  for (const item of items) {
    if (MONTH_HEADER_RE.test(item.text) || /ACADEMIC CALENDAR/i.test(item.text)) continue;
    byColumn[columnForX(item.x, headers)].push(item);
  }

  const events: ParsedCalendarEvent[] = [];

  for (let col = 0; col < headers.length; col++) {
    const columnItems = byColumn[col];
    const dayMarkers = columnItems
      .filter((item) => /^\d{1,2}$/.test(item.text))
      .sort((a, b) => a.y - b.y);
    const header = headers[col];

    for (let i = 0; i < dayMarkers.length; i++) {
      const dayMarker = dayMarkers[i];
      const day = parseInt(dayMarker.text, 10);
      if (day < 1 || day > 31) continue;
      if (!isValidDate(header.year, header.month, day)) continue;

      const yMin = dayMarker.y - 0.15;
      const yMax = (dayMarkers[i + 1]?.y ?? dayMarker.y + 1.4) - 0.05;
      const band = columnItems.filter((item) => item.y >= yMin && item.y <= yMax);
      const isRed = band.some((item) => isRedColor(item.clr));
      const date = `${header.year}-${String(header.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      let title = buildTitleFromBand(band, dayMarker);
      if (!title) {
        if (isRed) {
          events.push({ date, type: "HOLIDAY", title: "Holiday" });
        }
        continue;
      }

      if (isInternshipVivaOnly(title)) continue;

      const type = inferGridEventType(title, isRed);
      if (type === "EVENT" && !appliesToMkt(title) && !isRed) continue;

      events.push({
        date,
        type,
        title: title.slice(0, 180),
        term: type === "EXAM" ? "Term 4" : undefined,
      });
    }
  }

  return dedupeEvents(events);
}

function inferType(text: string, isRed: boolean): ParsedCalendarEvent["type"] {
  const t = text.toLowerCase();
  if (isRed || t.includes("holiday") || t.includes("weekly off")) return "HOLIDAY";
  if (t.includes("long weekend") || t.includes("long-weekend")) return "LONG_WEEKEND";
  if (t.includes("exam") || t.includes("term 4")) return "EXAM";
  if (t.includes("event") || t.includes("orientation") || t.includes("convocation")) return "EVENT";
  return "EVENT";
}

function cleanTitle(text: string, dateStr: string): string {
  let title = text
    .replace(new RegExp(dateStr.replace(/-/g, "[-/]"), "g"), "")
    .replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title || title.length < 2) return "Academic day";
  return title.slice(0, 120);
}

function dedupeEvents(events: ParsedCalendarEvent[]): ParsedCalendarEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = `${e.date}|${e.type}|${e.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseTextToCalendarEvents(fullText: string): ParsedCalendarEvent[] {
  const events: ParsedCalendarEvent[] = [];
  let section: ParsedCalendarEvent["type"] | null = null;

  const lines = fullText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/holiday/i.test(lower)) section = "HOLIDAY";
    else if (/long weekend/i.test(lower)) section = "LONG_WEEKEND";
    else if (/exam|examination|term\s*4/i.test(lower)) section = "EXAM";
    else if (/major event|events/i.test(lower)) section = "EVENT";

    const datePatterns = [
      /\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/g,
      /\d{1,2}[-/.][A-Za-z]{3}[-/.]\d{4}/g,
      /\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}/gi,
    ];

    for (const pattern of datePatterns) {
      const matches = line.match(pattern);
      if (!matches) continue;
      for (const match of matches) {
        const dateStr = parseDateFromText(match);
        if (!dateStr) continue;
        const type = inferType(line, false) || section || "EVENT";
        events.push({
          date: dateStr,
          type,
          title: cleanTitle(line, dateStr),
          term: type === "EXAM" ? "Term 4" : undefined,
        });
      }
    }
  }

  return dedupeEvents(events);
}

function extractFromPdfData(pdfData: PdfData): ParsedCalendarEvent[] {
  const items = extractPdfItems(pdfData);
  const gridEvents = parseTapmiGridCalendar(items);
  if (gridEvents.length > 0) return gridEvents;

  const events: ParsedCalendarEvent[] = [];
  const fullTextParts: string[] = [];

  for (const item of items) {
    fullTextParts.push(item.text);
    const red = isRedColor(item.clr);
    const dateStr = parseDateFromText(item.text);
    if (dateStr) {
      events.push({
        date: dateStr,
        type: inferType(item.text, red),
        title: cleanTitle(item.text, dateStr),
        term: inferType(item.text, red) === "EXAM" ? "Term 4" : undefined,
      });
      continue;
    }

    const inlineDates = item.text.match(
      /\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{1,2}[-/.][A-Za-z]{3}[-/.]\d{4}/g
    );
    if (inlineDates) {
      for (const d of inlineDates) {
        const parsed = parseDateFromText(d);
        if (!parsed) continue;
        events.push({
          date: parsed,
          type: inferType(item.text, red),
          title: cleanTitle(item.text, parsed),
          term: inferType(item.text, red) === "EXAM" ? "Term 4" : undefined,
        });
      }
    }
  }

  const textEvents = parseTextToCalendarEvents(fullTextParts.join("\n"));
  return dedupeEvents([...events.filter((e) => e.date), ...textEvents]);
}

export function parseAcademicCalendarPdf(buffer: Buffer): Promise<ParsedCalendarEvent[]> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFParser = require("pdf2json");
    const parser = new PDFParser(null, 1);

    parser.on("pdfParser_dataError", (err: { parserError?: Error } | Error) => {
      const message =
        err instanceof Error ? err.message : err.parserError?.message || "PDF parse failed";
      reject(new Error(message));
    });

    parser.on("pdfParser_dataReady", (pdfData: PdfData) => {
      try {
        const events = extractFromPdfData(pdfData);
        resolve(events);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("PDF extraction failed"));
      }
    });

    parser.parseBuffer(buffer);
  });
}

export async function parseAcademicCalendarFile(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParsedCalendarEvent[]> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return parseAcademicCalendarPdf(Buffer.from(buffer));
  }
  const { parseAcademicCalendarExcel } = await import("./parse-academic-calendar");
  return parseAcademicCalendarExcel(buffer);
}
