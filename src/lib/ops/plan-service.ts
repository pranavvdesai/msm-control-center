import { prisma } from "@/lib/db";
import { ensureDailyOpsSchema } from "./ensure-schema";
import {
  buildDailyOpsTasks,
  OPS_TASK_TO_EMAIL_KIND,
  type OpsTaskStatus,
} from "./task-registry";
import { addIstDays, birthdayMatchesDate, getIstNowParts } from "./ist-calendar";
import { istMonthDay } from "@/lib/analytics/ist-date-utils";
import { parseOpsMetadata } from "./parse-metadata";
import { safeJsonParse } from "./json";
import { ensureEmailSendLogSchema, getEmailBatchLog, type EmailSendKind } from "@/lib/email-send-log";

export type DailyOpsTaskRow = {
  id: string;
  istDate: string;
  taskKey: string;
  title: string;
  description: string;
  scheduledAtIst: string;
  status: OpsTaskStatus;
  metadata: Record<string, unknown> | null;
  completedAt: Date | null;
  updatedAt: Date;
};

async function loadBirthdayContext(istDate: string) {
  const tomorrow = addIstDays(istDate, 1);

  const users = await prisma.user.findMany({
    where: { profileComplete: true, collegeEmail: { not: null }, birthday: { not: null } },
    select: { name: true, rollNumber: true, birthday: true },
  });

  const eveBirthdayPeople = users
    .filter((u) => u.birthday && birthdayMatchesDate(u.birthday, tomorrow))
    .map((u) => ({ name: u.name, rollNumber: u.rollNumber }));

  const eligibleEmailUsers = await prisma.user.count({
    where: { profileComplete: true, collegeEmail: { not: null } },
  });

  return { eveBirthdayPeople, tomorrow, eligibleEmailUsers };
}

export async function refreshDailyOpsPlan(istDate: string) {
  await ensureDailyOpsSchema();

  const { eveBirthdayPeople, tomorrow, eligibleEmailUsers } =
    await loadBirthdayContext(istDate);

  const definitions = buildDailyOpsTasks(istDate, {
    eveBirthdayPeople,
    eligibleEmailUsers,
  });

  for (const def of definitions) {
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "DailyOpsTask" WHERE "istDate" = $1 AND "taskKey" = $2 LIMIT 1`,
      istDate,
      def.taskKey
    );

    const metadataJson = def.metadata ? JSON.stringify(def.metadata) : null;

    if (existing.length > 0) {
      await prisma.$executeRawUnsafe(
        `
        UPDATE "DailyOpsTask"
        SET "title" = $1, "description" = $2, "scheduledAtIst" = $3, "metadata" = $4, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "istDate" = $5 AND "taskKey" = $6
        `,
        def.title,
        def.description,
        def.scheduledAtIst,
        metadataJson,
        istDate,
        def.taskKey
      );
    } else {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "DailyOpsTask" ("id", "istDate", "taskKey", "title", "description", "scheduledAtIst", "status", "metadata", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, CURRENT_TIMESTAMP)
        `,
        crypto.randomUUID(),
        istDate,
        def.taskKey,
        def.title,
        def.description,
        def.scheduledAtIst,
        metadataJson
      );
    }
  }

  await syncOpsStatusFromLogs(istDate);

  // Also refresh tomorrow's eve birthday preview on today's plan
  if (eveBirthdayPeople.length > 0) {
    await syncOpsStatusFromLogs(tomorrow);
  }

  return definitions.length;
}

export async function syncOpsStatusFromLogs(istDate: string) {
  await ensureDailyOpsSchema();
  await ensureEmailSendLogSchema();

  const tasks = await prisma.$queryRawUnsafe<DailyOpsTaskRow[]>(
    `SELECT * FROM "DailyOpsTask" WHERE "istDate" = $1`,
    istDate
  );

  for (const task of tasks) {
    const emailKind = OPS_TASK_TO_EMAIL_KIND[task.taskKey];
    if (!emailKind) continue;

    let logDate = istDate;
    if (task.taskKey === "birthday") {
      const meta = safeJsonParse<{ targetDate?: string }>(task.metadata);
      logDate = meta?.targetDate || istDate;
    }

    const log = await getEmailBatchLog(emailKind as EmailSendKind, logDate);

    if (log) {
      await updateOpsTaskStatus(task.taskKey, istDate, "completed", {
        syncedFromLog: true,
        logDate,
      });
    }
  }
}

export async function updateOpsTaskStatus(
  taskKey: string,
  istDate: string,
  status: OpsTaskStatus,
  metadata?: Record<string, unknown>
) {
  await ensureDailyOpsSchema();

  const existing = await prisma.$queryRawUnsafe<DailyOpsTaskRow[]>(
    `SELECT * FROM "DailyOpsTask" WHERE "istDate" = $1 AND "taskKey" = $2 LIMIT 1`,
    istDate,
    taskKey
  );

  const mergedMeta =
    existing[0]?.metadata && metadata
      ? { ...parseOpsMetadata(existing[0].metadata), ...metadata }
      : metadata ?? parseOpsMetadata(existing[0]?.metadata);

  await prisma.$executeRawUnsafe(
    `
    UPDATE "DailyOpsTask"
    SET "status" = $1,
        "metadata" = $2,
        "completedAt" = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE "completedAt" END,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "istDate" = $3 AND "taskKey" = $4
    `,
    status,
    mergedMeta ? JSON.stringify(mergedMeta) : null,
    istDate,
    taskKey
  );
}

export async function getOpsTasksForDate(istDate: string) {
  await ensureDailyOpsSchema();
  await refreshDailyOpsPlan(istDate);

  const rows = await prisma.$queryRawUnsafe<DailyOpsTaskRow[]>(
    `SELECT * FROM "DailyOpsTask" WHERE "istDate" = $1 ORDER BY "scheduledAtIst" ASC`,
    istDate
  );

  return rows.map((r) => ({
    ...r,
    metadata: parseOpsMetadata(r.metadata),
  }));
}

export async function getUpcomingBirthdays(daysAhead = 7) {
  const users = await prisma.user.findMany({
    where: { profileComplete: true, birthday: { not: null } },
    select: { name: true, rollNumber: true, birthday: true, collegeEmail: true },
  });

  const start = getIstNowParts().dateStr;
  const results: Array<{ name: string; rollNumber: string; dateLabel: string; istDate: string; hasEmail: boolean }> = [];

  for (let i = 0; i <= daysAhead; i++) {
    const istDate = addIstDays(start, i);
    const { month, day } = istMonthDay(new Date(`${istDate}T12:00:00.000Z`));

    for (const u of users) {
      if (!u.birthday) continue;
      const b = istMonthDay(u.birthday);
      if (b.month === month && b.day === day) {
        results.push({
          name: u.name,
          rollNumber: u.rollNumber,
          istDate,
          dateLabel: new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(new Date(`${istDate}T12:00:00.000Z`)),
          hasEmail: !!u.collegeEmail,
        });
      }
    }
  }

  return results;
}

export async function runMorningOps(istDate: string) {
  await refreshDailyOpsPlan(istDate);

  const yesterday = addIstDays(istDate, -1);
  await syncOpsStatusFromLogs(yesterday);

  // Mark missed tasks from yesterday if still pending after their window
  const yesterdayTasks = await prisma.$queryRawUnsafe<DailyOpsTaskRow[]>(
    `SELECT * FROM "DailyOpsTask" WHERE "istDate" = $1 AND "status" = 'pending'`,
    yesterday
  );

  for (const task of yesterdayTasks) {
    await updateOpsTaskStatus(task.taskKey, yesterday, "missed", { autoDetected: true });
  }

  return { refreshed: istDate, yesterdayChecked: yesterday, missed: yesterdayTasks.length };
}
