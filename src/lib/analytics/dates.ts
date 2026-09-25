import { getIstDateString, formatIstDisplay } from "@/lib/play/ist-date";

export const ANALYTICS_LOOKBACK_DAYS = 5;

export function getLastIstDateStrings(count = ANALYTICS_LOOKBACK_DAYS): string[] {
  const dates: string[] = [];
  const [y, m, d] = getIstDateString().split("-").map(Number);

  for (let i = 0; i < count; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d - i, 12, 0, 0));
    dates.push(getIstDateString(dt));
  }

  return dates;
}

export function dateRangeLabel(dates: string[]) {
  if (dates.length === 0) return "";
  const oldest = dates[dates.length - 1];
  const newest = dates[0];
  return `${formatIstDisplay(oldest)} → ${formatIstDisplay(newest)}`;
}
