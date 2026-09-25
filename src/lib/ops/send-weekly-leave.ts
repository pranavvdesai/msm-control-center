import { prisma } from "@/lib/db";
import { sendEmailBatch } from "@/lib/email-batch";
import { wasEmailBatchSent, markEmailBatchSent } from "@/lib/email-send-log";
import {
  buildUserLeaveReport,
  weeklyLeaveReportEmailHtml,
  WEEKLY_LEAVE_REPORT_SUBJECT,
} from "@/lib/weekly-leave-report";
import { getWeeklyPlatformChampion } from "@/lib/analytics/weekly-champion";
import { refreshDailyOpsPlan, updateOpsTaskStatus } from "@/lib/ops/plan-service";

export async function sendWeeklyLeaveReportBatch(istDate: string, options?: { force?: boolean }) {
  await refreshDailyOpsPlan(istDate);

  if (!options?.force && (await wasEmailBatchSent("weekly_leave_batch", istDate))) {
    return {
      ok: true,
      istDate,
      skipped: true,
      reason: "Weekly leave batch already sent for this IST date",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";
  const champion = await getWeeklyPlatformChampion(appUrl, istDate);

  const users = await prisma.user.findMany({
    where: { profileComplete: true, collegeEmail: { not: null } },
    select: { id: true, name: true, collegeEmail: true },
  });

  const payloads: Array<{ to: string; subject: string; html: string }> = [];
  for (const user of users) {
    const report = await buildUserLeaveReport(user.id);
    const firstName = user.name.split(" ")[0];
    payloads.push({
      to: user.collegeEmail!,
      subject: WEEKLY_LEAVE_REPORT_SUBJECT,
      html: weeklyLeaveReportEmailHtml(firstName, report, appUrl, champion),
    });
  }

  const { sent, failed, failedTo } = await sendEmailBatch(payloads);

  if (sent > 0) {
    await markEmailBatchSent("weekly_leave_batch", istDate, {
      sent,
      failed,
      total: users.length,
      failedTo,
      resend: !!options?.force,
    });
  }

  await updateOpsTaskStatus(
    "weekly_leave",
    istDate,
    failed > 0 ? (sent > 0 ? "completed" : "failed") : "completed",
    { sent, failed, total: users.length, failedTo }
  );

  return {
    ok: true,
    istDate,
    schedule: "Saturday 5:00 PM IST",
    users: users.length,
    sent,
    failed,
    failedTo,
  };
}
