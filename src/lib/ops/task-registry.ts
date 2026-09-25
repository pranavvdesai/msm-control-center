import { CRON_IST_LABELS } from "@/lib/cron-schedules";
import { addIstDays, isSaturdayIst } from "./ist-calendar";

export type OpsTaskStatus = "pending" | "running" | "completed" | "skipped" | "failed" | "missed";

export type OpsTaskDefinition = {
  taskKey: string;
  title: string;
  description: string;
  scheduledAtIst: string;
  metadata?: Record<string, unknown>;
};

export type BirthdayPerson = {
  name: string;
  rollNumber: string;
};

export function buildDailyOpsTasks(
  istDate: string,
  options: {
    eveBirthdayPeople: BirthdayPerson[];
    eligibleEmailUsers: number;
  }
): OpsTaskDefinition[] {
  const tasks: OpsTaskDefinition[] = [];
  const tomorrow = addIstDays(istDate, 1);

  if (options.eveBirthdayPeople.length > 0) {
    tasks.push({
      taskKey: "birthday",
      title: "Birthday emails",
      description: `11:59 PM IST eve mail for ${options.eveBirthdayPeople.map((p) => p.name).join(", ")} — birthday on ${tomorrow}.`,
      scheduledAtIst: "11:59 PM IST (eve before birthday)",
      metadata: { people: options.eveBirthdayPeople, targetDate: tomorrow },
    });
  }

  tasks.push(
    {
      taskKey: "daily_play",
      title: "Daily Play reset",
      description: "Generate today's Sudoku + Quiz puzzles and reset daily leaderboards.",
      scheduledAtIst: "12:00 AM IST",
    },
    {
      taskKey: "news_refresh",
      title: "News headlines refresh",
      description: "Fetch top headlines for all categories (last 24h).",
      scheduledAtIst: CRON_IST_LABELS.dailyNews.replace("Daily · ", ""),
    }
  );

  if (isSaturdayIst(istDate)) {
    tasks.push({
      taskKey: "weekly_leave",
      title: "Weekly leave report",
      description: `Saturday batch — personalized leave balance + weekly history to ${options.eligibleEmailUsers} registered users.`,
      scheduledAtIst: CRON_IST_LABELS.weeklyLeave.replace("Saturday · ", ""),
      metadata: { day: "Saturday" },
    });
  }

  return tasks;
}

export const OPS_TASK_TO_EMAIL_KIND: Record<string, string> = {
  birthday: "birthday_batch",
  weekly_leave: "weekly_leave_batch",
};
