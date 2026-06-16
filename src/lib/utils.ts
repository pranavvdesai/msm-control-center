import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maxLeavesForCredits(credits: number) {
  return credits;
}

const IST = "Asia/Kolkata";

function istCalendarParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  return {
    year: parseInt(parts.find((p) => p.type === "year")?.value || "1970", 10),
    month: parseInt(parts.find((p) => p.type === "month")?.value || "1", 10),
    day: parseInt(parts.find((p) => p.type === "day")?.value || "1", 10),
  };
}

function istDayString(date: Date | string) {
  const { year, month, day } = istCalendarParts(new Date(date));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function toDateKey(date: Date | string) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export function startOfDay(date: Date | string) {
  const day = istDayString(date);
  return new Date(`${day}T00:00:00+05:30`);
}

export function endOfDay(date: Date | string) {
  const day = istDayString(date);
  return new Date(`${day}T23:59:59.999+05:30`);
}

/** TAPMI Excel slots: 8–11 AM, 12 noon, 1–7 PM when AM/PM omitted; 13–23 = 24h */
function bareHourTo24(h: number): number {
  if (h >= 13 && h <= 23) return h;
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

/** Parse "09:00", "9:00 AM", "14:30", "08:45" into minutes since midnight */
export function timeToMinutes(time: string): number {
  const trimmed = time.trim();
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const pm = ampm[3].toUpperCase() === "PM";
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    return h * 60 + m;
  }
  const bare = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (bare) {
    const h24 = bareHourTo24(parseInt(bare[1], 10));
    const m = parseInt(bare[2], 10);
    return h24 * 60 + m;
  }
  return 0;
}

/** Normalize TAPMI-style times for display + sort (e.g. 2:30 → 02:30 PM) */
export function normalizeClassTimePair(startTime: string, endTime: string) {
  return {
    startTime: normalizeOneTime(startTime),
    endTime: normalizeOneTime(endTime),
  };
}

function normalizeOneTime(time: string): string {
  const t = time.trim();
  const withMer = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (withMer) {
    let h = parseInt(withMer[1], 10);
    const m = withMer[2];
    const pm = withMer[3].toUpperCase() === "PM";
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    return format12h(h, m);
  }
  const bare = t.match(/^(\d{1,2}):(\d{2})/);
  if (!bare) return t;
  const h24 = bareHourTo24(parseInt(bare[1], 10));
  return format12h(h24, bare[2].padStart(2, "0"));
}

/** Always show times with AM/PM for UI (e.g. 08:45 AM – 10:00 AM) */
export function formatClassTime(time: string): string {
  return normalizeOneTime(time);
}

export function formatClassTimeRange(startTime: string, endTime: string): string {
  return `${formatClassTime(startTime)} – ${formatClassTime(endTime)}`;
}

export function sortByStartTime<T extends { startTime: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/** Normalize stored timetable times to canonical 24h slot labels. */
export function normalizeTimetableEntry<T extends { startTime: string; endTime: string }>(
  entry: T
): T {
  const { startTime, endTime } = normalizeClassTimePair(entry.startTime, entry.endTime);
  return { ...entry, startTime, endTime };
}

export function normalizeTimetableEntries<
  T extends { startTime: string; endTime: string; date?: Date | string },
>(entries: T[]): T[] {
  const normalized = entries.map(normalizeTimetableEntry);
  return [...normalized].sort((a, b) => {
    if (a.date != null && b.date != null) {
      const dayA = new Date(a.date).setHours(0, 0, 0, 0);
      const dayB = new Date(b.date).setHours(0, 0, 0, 0);
      if (dayA !== dayB) return dayA - dayB;
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

export function isWeekend(date: Date | string) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

export function firstName(name: string) {
  return name.split(" ")[0];
}

/** Parse YYYY-MM-DD as local noon — avoids timezone shifting on mobile */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function monthRange(year: number, month: number) {
  return {
    start: new Date(year, month - 1, 1, 0, 0, 0, 0),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

export function toLocalDateKey(date: Date | string): string {
  const d = typeof date === "string" ? parseLocalDate(date.slice(0, 10)) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD for the calendar day in IST (India) */
export function toIstDateKey(date: Date | string = new Date()) {
  return istDayString(date);
}
