import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cronAuthorized, cronUnauthorizedResponse } from "@/lib/cron-auth";
import { isEmailConfigured } from "@/lib/email";
import { sendEmailBatch } from "@/lib/email-batch";
import { wasEmailBatchSent, markEmailBatchSent } from "@/lib/email-send-log";
import {
  CLASS_REMINDER_EMAIL_SUBJECT,
  CLASS_REMINDER_PUSH,
  classReminderEmailHtml,
} from "@/lib/class-reminder";
import { getIstDateString } from "@/lib/play/ist-date";
import { updateOpsTaskStatus } from "@/lib/ops/plan-service";
import { sendPushNotification } from "@/lib/push";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return cronUnauthorizedResponse();

  const istDate = getIstDateString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";

  if (await wasEmailBatchSent("class_reminder_batch", istDate)) {
    return NextResponse.json({
      ok: true,
      istDate,
      skipped: true,
      reason: "Class reminder batch already sent today (IST)",
    });
  }

  const users = await prisma.user.findMany({
    where: {
      remindersEnabled: true,
      profileComplete: true,
    },
    select: {
      id: true,
      name: true,
      collegeEmail: true,
      pushSubscriptions: true,
    },
  });

  let pushSent = 0;
  let pushFailed = 0;

  for (const user of users) {
    for (const sub of user.pushSubscriptions) {
      const ok = await sendPushNotification(sub, CLASS_REMINDER_PUSH);
      if (ok) pushSent++;
      else {
        pushFailed++;
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  let emailSent = 0;
  let emailFailed = 0;

  if (isEmailConfigured()) {
    const emailRecipients = users
      .filter((u) => u.collegeEmail)
      .map((u) => ({
        to: u.collegeEmail!,
        subject: CLASS_REMINDER_EMAIL_SUBJECT,
        html: classReminderEmailHtml(u.name.split(" ")[0], appUrl),
      }));

    const batch = await sendEmailBatch(emailRecipients);
    emailSent = batch.sent;
    emailFailed = batch.failed;
  }

  await markEmailBatchSent("class_reminder_batch", istDate, {
    emailSent,
    pushSent,
    users: users.length,
  });

  await updateOpsTaskStatus(
    "class_reminder",
    istDate,
    emailFailed > 0 ? "failed" : "completed",
    { emailSent, emailFailed, pushSent, users: users.length }
  );

  return NextResponse.json({
    ok: true,
    istDate,
    schedule: "9:00 PM IST daily",
    users: users.length,
    emailSent,
    emailFailed,
    pushSent,
    pushFailed,
  });
}
