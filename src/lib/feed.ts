import { prisma } from "./db";

/** Event types shown on the live cohort feed */
export const LIVE_FEED_TYPES = ["login", "leave", "alert", "birthday_wish"] as const;

export async function getLiveFeed(limit = 10) {
  return prisma.activityEvent.findMany({
    where: { type: { in: [...LIVE_FEED_TYPES] } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function buildOneLeaveLeftFeedMessage(studentName: string, subjectName: string) {
  return `${studentName} has only 1 leave left in ${subjectName}.`;
}

export function buildNoLeavesLeftFeedMessage(studentName: string, subjectName: string) {
  return `${studentName} has no leaves left in ${subjectName}. Subgrade zone unlocked.`;
}

export async function postAttendanceThresholdFeed(
  userId: string,
  studentName: string,
  subjectName: string,
  remainingLeaves: number
) {
  if (remainingLeaves !== 1 && remainingLeaves !== 0) return;

  const message =
    remainingLeaves === 1
      ? buildOneLeaveLeftFeedMessage(studentName, subjectName)
      : buildNoLeavesLeftFeedMessage(studentName, subjectName);

  await prisma.activityEvent.create({
    data: { userId, message, type: "alert" },
  });
}
