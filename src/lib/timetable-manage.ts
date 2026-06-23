import { prisma } from "@/lib/db";
import { normalizeClassTimePair, parseLocalDate } from "@/lib/utils";

type SubjectInput = {
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  credits?: number;
};

export async function resolveSubjectId(input: SubjectInput): Promise<string | null> {
  if (input.subjectId) {
    const existing = await prisma.subject.findUnique({ where: { id: input.subjectId } });
    return existing?.id ?? null;
  }

  const code = input.subjectCode?.trim().toUpperCase();
  if (!code) return null;

  const name = input.subjectName?.trim() || code;
  const credits = input.credits ?? 3;

  const subject = await prisma.subject.upsert({
    where: { code },
    update: { name, credits },
    create: { code, name, credits },
  });

  return subject.id;
}

export function parseEntryPayload(body: Record<string, unknown>) {
  const dateStr = String(body.date || "").slice(0, 10);
  const startTime = String(body.startTime || "").trim();
  const endTime = String(body.endTime || "").trim();

  if (!dateStr || !startTime || !endTime) {
    return { error: "Date, start time, and end time are required." as const };
  }

  const { startTime: normStart, endTime: normEnd } = normalizeClassTimePair(startTime, endTime);

  return {
    date: parseLocalDate(dateStr),
    startTime: normStart,
    endTime: normEnd,
    room: body.room ? String(body.room).trim() : null,
    faculty: body.faculty ? String(body.faculty).trim() : null,
    subjectId: body.subjectId ? String(body.subjectId) : undefined,
    subjectCode: body.subjectCode ? String(body.subjectCode) : undefined,
    subjectName: body.subjectName ? String(body.subjectName) : undefined,
    credits: body.credits != null ? Number(body.credits) : undefined,
  };
}

export async function logTimetableActivity(userId: string, message: string) {
  await prisma.activityEvent.create({
    data: { userId, message, type: "admin" },
  });
}
