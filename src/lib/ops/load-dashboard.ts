import { prisma } from "@/lib/db";
import { getIstNowParts, formatIstDateLabel, addIstDays } from "./ist-calendar";
import {
  getOpsTasksForDate,
  getUpcomingBirthdays,
  refreshDailyOpsPlan,
  type DailyOpsTaskRow,
} from "./plan-service";
import { ensureDailyOpsSchema } from "./ensure-schema";
import { ensureEmailSendLogSchema } from "@/lib/email-send-log";
import type { OpsTaskStatus } from "./task-registry";
import { parseOpsMetadata } from "./parse-metadata";

export type AdminOpsDashboard = {
  istDate: string;
  dateLabel: string;
  summary: {
    total: number;
    pending: number;
    completed: number;
    missed: number;
    failed: number;
  };
  tasks: Array<
    DailyOpsTaskRow & {
      metadata: Record<string, unknown> | null;
    }
  >;
  upcomingBirthdays: Awaited<ReturnType<typeof getUpcomingBirthdays>>;
  refreshedAt: string;
};

async function loadCarryOverTasks(istDate: string) {
  await ensureDailyOpsSchema();
  const carryOver: AdminOpsDashboard["tasks"] = [];

  for (let i = 1; i <= 2; i++) {
    const d = addIstDays(istDate, -i);
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        taskKey: string;
        title: string;
        description: string;
        scheduledAtIst: string;
        status: string;
        metadata: string | null;
        completedAt: Date | null;
        istDate: string;
        updatedAt: Date;
      }>
    >(
      `SELECT * FROM "DailyOpsTask" WHERE "istDate" = $1 AND "status" IN ('pending', 'missed', 'failed')`,
      d
    );

    for (const r of rows) {
      carryOver.push({
        id: r.id,
        istDate: r.istDate,
        taskKey: r.taskKey,
        title: r.title,
        description: r.description,
        scheduledAtIst: r.scheduledAtIst,
        status: r.status as OpsTaskStatus,
        metadata: parseOpsMetadata(r.metadata),
        completedAt: r.completedAt,
        updatedAt: r.updatedAt,
      });
    }
  }

  return carryOver;
}

export async function loadAdminOpsDashboard(istDate?: string): Promise<AdminOpsDashboard> {
  const date = istDate || getIstNowParts().dateStr;

  await Promise.all([ensureDailyOpsSchema(), ensureEmailSendLogSchema()]);

  await refreshDailyOpsPlan(addIstDays(date, -1));

  const [todayTasks, upcomingBirthdays, carryOver] = await Promise.all([
    getOpsTasksForDate(date),
    getUpcomingBirthdays(14),
    loadCarryOverTasks(date),
  ]);

  const tasks = [
    ...carryOver,
    ...todayTasks.filter(
      (t) => !carryOver.some((c) => c.taskKey === t.taskKey && c.istDate === t.istDate)
    ),
  ];

  return {
    istDate: date,
    dateLabel: formatIstDateLabel(date),
    summary: {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      missed: tasks.filter((t) => t.status === "missed").length,
      failed: tasks.filter((t) => t.status === "failed").length,
    },
    tasks,
    upcomingBirthdays,
    refreshedAt: new Date().toISOString(),
  };
}
