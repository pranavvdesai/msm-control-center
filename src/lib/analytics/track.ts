import { prisma } from "@/lib/db";
import { getIstDateString } from "@/lib/play/ist-date";
import { pathToTab } from "./tabs";
import { ensureAnalyticsSchema } from "./ensure-schema";

export async function trackPageVisit(userId: string, path: string) {
  const tab = pathToTab(path);
  if (!tab) return null;

  await ensureAnalyticsSchema();

  const visitDate = getIstDateString();

  return prisma.pageVisit.create({
    data: {
      userId,
      tab,
      path,
      visitDate,
    },
  });
}
