import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sessionIsRamAdmin } from "@/lib/permissions";

/** Term 4 subject codes to drop when rolling into Term 5. */
const DEFAULT_RETIRE_CODES = [
  "MSM6430", // Applied Marketing Strategy
  "MSM6400", // B2B Marketing
  "MSM6904", // Legal Aspects of Business
  "MSM6404", // Management of Sales Force (Elective)
  "MSM6407", // Services Marketing
  "MSM6503", // Supply Chain Management
];

const DEFAULT_TERM_INFO = "Term 5 · Sep 26, 2026 onwards · TAPMI Manipal";

/**
 * POST /api/admin/term-rollover
 * Updates term branding and removes retired previous-term subjects (and their leaves).
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !(await sessionIsRamAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const termInfo = String(body.termInfo || DEFAULT_TERM_INFO).trim();
  const retireCodes: string[] = Array.isArray(body.retireCodes)
    ? body.retireCodes.map((c: unknown) => String(c).trim().toUpperCase()).filter(Boolean)
    : DEFAULT_RETIRE_CODES;

  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { termInfo },
    create: {
      crName: "Tipparaju Venkata Sai Bhavyasri",
      crPhone: "8500780044",
      cohortName: "MSM",
      cohortFull: "Marketing and Sales Management",
      termInfo,
    },
  });

  const before = await prisma.subject.findMany({
    where: { code: { in: retireCodes } },
    select: {
      code: true,
      name: true,
      _count: { select: { leaves: true, timetableEntries: true } },
    },
  });

  const deleted = await prisma.subject.deleteMany({
    where: { code: { in: retireCodes } },
  });

  await prisma.activityEvent.create({
    data: {
      userId: session.id,
      message: `Term rollover: ${termInfo}. Removed ${deleted.count} old subject(s).`,
      type: "admin",
    },
  });

  const remaining = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    select: { code: true, name: true, credits: true },
  });

  return NextResponse.json({
    ok: true,
    termInfo: settings.termInfo,
    removed: before,
    deletedCount: deleted.count,
    remainingSubjects: remaining,
  });
}
