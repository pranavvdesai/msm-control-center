import { NextResponse } from "next/server";
import { cronAuthorized, cronUnauthorizedResponse } from "@/lib/cron-auth";
import { ensureDailyNews } from "@/lib/news/service";
import { getIstDateString } from "@/lib/play/ist-date";
import { runMorningOps, updateOpsTaskStatus } from "@/lib/ops/plan-service";
import { addIstDays, isSaturdayIst } from "@/lib/ops/ist-calendar";
import { sendWeeklyLeaveReportBatch } from "@/lib/ops/send-weekly-leave";
import { wasEmailBatchSent } from "@/lib/email-send-log";

export const maxDuration = 120;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return cronUnauthorizedResponse();

  const istDate = getIstDateString();
  const morning = await runMorningOps(istDate);

  const newsDate = istDate;
  const categories = await ensureDailyNews(newsDate, { force: true });
  await updateOpsTaskStatus("news_refresh", istDate, "completed", {
    categories: categories.length,
  });

  let weeklyCatchUp: Record<string, unknown> | null = null;
  const yesterday = addIstDays(istDate, -1);
  if (isSaturdayIst(yesterday) && !(await wasEmailBatchSent("weekly_leave_batch", yesterday))) {
    weeklyCatchUp = await sendWeeklyLeaveReportBatch(yesterday, { force: true });
  }

  return NextResponse.json({
    ok: true,
    date: newsDate,
    morning,
    weeklyCatchUp,
    categories: categories.map((c) => ({
      id: c.id,
      label: c.label,
      count: c.items.length,
      fetchedAt: c.fetchedAt,
    })),
  });
}
