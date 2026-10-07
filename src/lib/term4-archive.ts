import { prisma } from "./db";
import type { LeaveType } from "./leaves";

/**
 * Term 4 Leave rows were deleted in the Term 5 rollover. The only surviving record is the
 * "leave" activity feed, which is logged when a leave is marked (not the class date) and is
 * never removed when a leave is deleted — so entries can include leaves later undone.
 */
const TERM4_START = new Date("2026-06-15T00:00:00+05:30");
const TERM5_START = new Date("2026-09-26T00:00:00+05:30");

const FEED_PATTERNS: Array<{ type: LeaveType; regex: RegExp }> = [
  { type: "REGULAR", regex: / took a regular absence in (.+)\. The plot thickens\.$/ },
  { type: "CONDONED", regex: / marked a condoned leave in (.+)\. Looks like life happened\.$/ },
  { type: "LATE", regex: / marked late in (.+)\. Faculty noted the entrance drama\.$/ },
];

export type Term4ArchivedLeave = {
  id: string;
  markedAt: string;
  subjectName: string;
  type: LeaveType;
};

function parseLeaveFeedMessage(message: string) {
  for (const { type, regex } of FEED_PATTERNS) {
    const match = message.match(regex);
    if (match) return { type, subjectName: match[1] };
  }
  return null;
}

/** Full Term 4 leaves (with class date and reason) recovered from a student's browser cache. */
export type Term4RecoveredLeave = {
  id: string;
  classDate: string;
  subjectName: string;
  type: LeaveType;
  reason: string | null;
  startTime: string | null;
  endTime: string | null;
};

/** Stored as one JSON activity event per user; this type is not in the live feed list. */
const RECOVERY_EVENT_TYPE = "term4_recovery";

export async function getTerm4RecoveredLeaves(userId: string): Promise<Term4RecoveredLeave[]> {
  const event = await prisma.activityEvent.findFirst({
    where: { userId, type: RECOVERY_EVENT_TYPE },
    orderBy: { createdAt: "desc" },
    select: { message: true },
  });
  if (!event) return [];
  try {
    return JSON.parse(event.message) as Term4RecoveredLeave[];
  } catch {
    return [];
  }
}

export async function saveTerm4RecoveredLeaves(
  userId: string,
  incoming: Term4RecoveredLeave[]
): Promise<Term4RecoveredLeave[]> {
  const merged = new Map((await getTerm4RecoveredLeaves(userId)).map((l) => [l.id, l]));
  for (const leave of incoming) merged.set(leave.id, leave);
  const leaves = [...merged.values()].sort((a, b) => b.classDate.localeCompare(a.classDate));

  await prisma.$transaction([
    prisma.activityEvent.deleteMany({ where: { userId, type: RECOVERY_EVENT_TYPE } }),
    prisma.activityEvent.create({
      data: { userId, type: RECOVERY_EVENT_TYPE, message: JSON.stringify(leaves) },
    }),
  ]);
  return leaves;
}

export async function getTerm4ArchivedLeaves(userId: string): Promise<Term4ArchivedLeave[]> {
  const events = await prisma.activityEvent.findMany({
    where: {
      userId,
      type: "leave",
      createdAt: { gte: TERM4_START, lt: TERM5_START },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, message: true, createdAt: true },
  });

  return events.flatMap((event) => {
    const parsed = parseLeaveFeedMessage(event.message);
    if (!parsed) return [];
    return [{ id: event.id, markedAt: event.createdAt.toISOString(), ...parsed }];
  });
}
