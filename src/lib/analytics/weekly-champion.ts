import { prisma } from "@/lib/db";
import { ensureAnalyticsSchema } from "./ensure-schema";
import { RAM_ROLL } from "@/lib/permissions";
import { addIstDays, getIstNowParts } from "@/lib/ops/ist-calendar";

export type WeeklyPlatformChampion = {
  name: string;
  rollNumber: string;
  visits: number;
  weekStart: string;
  weekEnd: string;
  awardUrl: string;
};

/** Most active student on the platform this past week (IST), excluding Ram. */
export async function getWeeklyPlatformChampion(
  appUrl: string,
  weekEndDate?: string
): Promise<WeeklyPlatformChampion | null> {
  await ensureAnalyticsSchema();

  const weekEnd = weekEndDate || getIstNowParts().dateStr;
  const weekStart = addIstDays(weekEnd, -6);

  const rows = await prisma.pageVisit.findMany({
    where: { visitDate: { gte: weekStart, lte: weekEnd } },
    select: {
      userId: true,
      user: { select: { name: true, rollNumber: true } },
    },
  });

  const counts = new Map<string, { name: string; rollNumber: string; visits: number }>();

  for (const row of rows) {
    if (row.user.rollNumber.toUpperCase() === RAM_ROLL) continue;
    const cur = counts.get(row.userId) ?? {
      name: row.user.name,
      rollNumber: row.user.rollNumber,
      visits: 0,
    };
    cur.visits += 1;
    counts.set(row.userId, cur);
  }

  let top: { name: string; rollNumber: string; visits: number } | null = null;
  for (const entry of counts.values()) {
    if (!top || entry.visits > top.visits) top = entry;
  }

  if (!top || top.visits === 0) return null;

  return {
    ...top,
    weekStart,
    weekEnd,
    awardUrl: `${appUrl}/awards/champion?week=${weekEnd}`,
  };
}
