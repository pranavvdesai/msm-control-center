/**
 * One-shot Term 5 rollover against production:
 * - Update AppSettings.termInfo
 * - Remove Term 4 subjects that no longer have timetable entries
 *   (keeps Brand Scan + any subject still on the Term 5 grid)
 *
 * Usage: npx tsx --env-file=.env.prod.runtime scripts/rollover-term5.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TERM_INFO = "Term 5 · Sep 26, 2026 onwards · TAPMI Manipal";

/** Term 4 codes still lingering after the Term 5 TT upload */
const TERM4_CODES = [
  "MSM6430", // Applied Marketing Strategy
  "MSM6400", // B2B Marketing
  "MSM6904", // Legal Aspects of Business
  "MSM6404", // Management of Sales Force (Elective)
  "MSM6407", // Services Marketing
  "MSM6503", // Supply Chain Management
];

async function main() {
  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { termInfo: TERM_INFO },
    create: {
      crName: "Bhavya (25M149)",
      crPhone: "8500780044",
      cohortName: "MSM",
      cohortFull: "Marketing and Sales Management",
      termInfo: TERM_INFO,
    },
  });

  const before = await prisma.subject.findMany({
    select: {
      code: true,
      name: true,
      _count: { select: { timetableEntries: true, leaves: true } },
    },
    orderBy: { name: "asc" },
  });

  const toRemove = before.filter((s) => TERM4_CODES.includes(s.code));
  const deleted = await prisma.subject.deleteMany({
    where: { code: { in: TERM4_CODES } },
  });

  const after = await prisma.subject.findMany({
    select: {
      code: true,
      name: true,
      credits: true,
      _count: { select: { timetableEntries: true } },
    },
    orderBy: { name: "asc" },
  });

  console.log(
    JSON.stringify(
      {
        termInfo: settings.termInfo,
        removed: toRemove.map((s) => ({
          code: s.code,
          name: s.name,
          lectures: s._count.timetableEntries,
          leaves: s._count.leaves,
        })),
        deletedCount: deleted.count,
        remainingSubjects: after,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
