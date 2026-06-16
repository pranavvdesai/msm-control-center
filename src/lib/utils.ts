import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maxLeavesForCredits(credits: number) {
  return credits;
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
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
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date | string) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
