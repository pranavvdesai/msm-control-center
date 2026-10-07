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
