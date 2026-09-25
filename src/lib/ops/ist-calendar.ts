import { istMonthDay } from "@/lib/analytics/ist-date-utils";

const IST = "Asia/Kolkata";

export function getIstNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: get("weekday"),
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export function addIstDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function isSaturdayIst(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
  return dow === 6;
}

export function formatIstDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dt);
}

export function birthdayMatchesDate(birthday: Date, targetDateStr: string): boolean {
  const target = istMonthDay(new Date(`${targetDateStr}T12:00:00.000Z`));
  const b = istMonthDay(birthday);
  return b.month === target.month && b.day === target.day;
}
