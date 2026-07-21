/**
 * Pulls the real timetable from production and mirrors it into the local
 * SQLite dev database, so localhost shows the same classes as the live site.
 *
 * Usage: npx tsx scripts/sync-timetable-to-local.ts
 * (Run `npm run db:generate:local` first if the Prisma client points at Postgres.)
 */
import { PrismaClient } from "@prisma/client";

const APP_URL = process.env.APP_URL ?? "https://msm-control-center.vercel.app";
const ROLL = process.env.RESTORE_ROLL ?? "25M136";
const PASSWORD = process.env.RESTORE_PASSWORD ?? "MSM@2027";
const MONTHS = ["2026-06", "2026-07", "2026-08"];

type RemoteEntry = {
  date: string;
  startTime: string;
  endTime: string;
  room: string | null;
  faculty: string | null;
  subject: { name: string; code: string; credits?: number; faculty?: string | null };
};

const prisma = new PrismaClient();

async function main() {
  const loginRes = await fetch(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rollNumber: ROLL, password: PASSWORD }),
  });
  if (!loginRes.ok) throw new Error("Production login failed");
  const cookie = loginRes.headers.get("set-cookie");
  if (!cookie) throw new Error("No session cookie");
  const sessionCookie = cookie.split(";")[0];

  const entries: RemoteEntry[] = [];
  for (const month of MONTHS) {
    const res = await fetch(`${APP_URL}/api/timetable?month=${month}`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    entries.push(...(data.entries ?? []));
  }
  console.log(`Fetched ${entries.length} entries from production.`);

  const subjectIdByCode = new Map<string, string>();
  for (const e of entries) {
    if (subjectIdByCode.has(e.subject.code)) continue;
    const subject = await prisma.subject.upsert({
      where: { code: e.subject.code },
      update: {
        name: e.subject.name,
        credits: e.subject.credits ?? 3,
        faculty: e.subject.faculty ?? e.faculty ?? null,
      },
      create: {
        code: e.subject.code,
        name: e.subject.name,
        credits: e.subject.credits ?? 3,
        faculty: e.subject.faculty ?? e.faculty ?? null,
      },
    });
    subjectIdByCode.set(e.subject.code, subject.id);
  }

  const deleted = await prisma.timetableEntry.deleteMany({});
  console.log(`Cleared ${deleted.count} old local entries.`);

  let created = 0;
  for (const e of entries) {
    await prisma.timetableEntry.create({
      data: {
        date: new Date(e.date),
        startTime: e.startTime,
        endTime: e.endTime,
        room: e.room,
        faculty: e.faculty,
        subjectId: subjectIdByCode.get(e.subject.code)!,
      },
    });
    created++;
  }
  console.log(`Created ${created} local entries across ${subjectIdByCode.size} subjects.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
