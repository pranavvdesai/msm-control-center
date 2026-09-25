import { prisma } from "@/lib/db";
import { formatIstDisplay } from "@/lib/play/ist-date";
import { ANALYTICS_LOOKBACK_DAYS, getLastIstDateStrings } from "./dates";
import { ensureAnalyticsSchema } from "./ensure-schema";
import { TRACKABLE_TABS } from "./tabs";

type TabStat = {
  tab: string;
  visits: number;
  uniqueUsers: number;
};

type VisitorRow = {
  userId: string;
  rollNumber: string;
  name: string;
  visits: number;
  tabs: string[];
  lastVisitAt: string;
};

type DayInsight = {
  date: string;
  dateLabel: string;
  totalVisits: number;
  uniqueVisitors: number;
  byTab: TabStat[];
  visitors: VisitorRow[];
};

export type AnalyticsReport = {
  lookbackDays: number;
  rangeLabel: string;
  dates: string[];
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    byTab: TabStat[];
  };
  byDate: DayInsight[];
};

function buildTabStats(
  rows: Array<{ tab: string; userId: string }>
): TabStat[] {
  const map = new Map<string, { visits: number; users: Set<string> }>();

  for (const row of rows) {
    const entry = map.get(row.tab) ?? { visits: 0, users: new Set<string>() };
    entry.visits += 1;
    entry.users.add(row.userId);
    map.set(row.tab, entry);
  }

  return TRACKABLE_TABS.map((tab) => ({
    tab,
    visits: map.get(tab)?.visits ?? 0,
    uniqueUsers: map.get(tab)?.users.size ?? 0,
  }))
    .filter((t) => t.visits > 0)
    .sort((a, b) => b.visits - a.visits);
}

function buildVisitors(
  rows: Array<{
    userId: string;
    tab: string;
    visitedAt: Date;
    user: { name: string; rollNumber: string };
  }>
): VisitorRow[] {
  const map = new Map<
    string,
    {
      rollNumber: string;
      name: string;
      visits: number;
      tabs: Set<string>;
      lastVisitAt: Date;
    }
  >();

  for (const row of rows) {
    const entry = map.get(row.userId) ?? {
      rollNumber: row.user.rollNumber,
      name: row.user.name,
      visits: 0,
      tabs: new Set<string>(),
      lastVisitAt: row.visitedAt,
    };
    entry.visits += 1;
    entry.tabs.add(row.tab);
    if (row.visitedAt > entry.lastVisitAt) entry.lastVisitAt = row.visitedAt;
    map.set(row.userId, entry);
  }

  return [...map.entries()]
    .map(([userId, v]) => ({
      userId,
      rollNumber: v.rollNumber,
      name: v.name,
      visits: v.visits,
      tabs: [...v.tabs].sort(),
      lastVisitAt: v.lastVisitAt.toISOString(),
    }))
    .sort((a, b) => b.visits - a.visits);
}

export async function getAnalyticsReport(): Promise<AnalyticsReport> {
  await ensureAnalyticsSchema();

  const dates = getLastIstDateStrings(ANALYTICS_LOOKBACK_DAYS);
  const oldest = dates[dates.length - 1];

  const visits = await prisma.pageVisit.findMany({
    where: { visitDate: { gte: oldest } },
    include: {
      user: { select: { name: true, rollNumber: true } },
    },
    orderBy: { visitedAt: "desc" },
  });

  const summaryRows = visits.map((v) => ({ tab: v.tab, userId: v.userId }));
  const uniqueVisitors = new Set(visits.map((v) => v.userId)).size;

  const byDate: DayInsight[] = dates.map((date) => {
    const dayRows = visits.filter((v) => v.visitDate === date);
    const daySummary = dayRows.map((v) => ({ tab: v.tab, userId: v.userId }));

    return {
      date,
      dateLabel: formatIstDisplay(date),
      totalVisits: dayRows.length,
      uniqueVisitors: new Set(dayRows.map((v) => v.userId)).size,
      byTab: buildTabStats(daySummary),
      visitors: buildVisitors(dayRows),
    };
  });

  const rangeLabel = `${formatIstDisplay(dates[dates.length - 1])} → ${formatIstDisplay(dates[0])}`;

  return {
    lookbackDays: ANALYTICS_LOOKBACK_DAYS,
    rangeLabel,
    dates,
    summary: {
      totalVisits: visits.length,
      uniqueVisitors,
      byTab: buildTabStats(summaryRows),
    },
    byDate,
  };
}
