import { getIstDateString } from "@/lib/play/ist-date";

/** Month/day in Asia/Kolkata — used for birthdays and date boundaries. */
export function istMonthDay(date: Date): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  return {
    month: parseInt(parts.find((p) => p.type === "month")?.value || "1", 10),
    day: parseInt(parts.find((p) => p.type === "day")?.value || "1", 10),
  };
}

export function istDateKey(date = new Date()) {
  return getIstDateString(date);
}
