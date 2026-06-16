import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import {
  buildUserLeaveReport,
  weeklyLeaveReportEmailHtml,
  WEEKLY_LEAVE_REPORT_SUBJECT,
} from "@/lib/weekly-leave-report";

function cronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";
  const users = await prisma.user.findMany({
    where: { profileComplete: true, collegeEmail: { not: null } },
    select: { id: true, name: true, collegeEmail: true },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    if (!user.collegeEmail) continue;
    const report = await buildUserLeaveReport(user.id);
    const firstName = user.name.split(" ")[0];
    const html = weeklyLeaveReportEmailHtml(firstName, report, appUrl);
    const ok = await sendEmail(user.collegeEmail, WEEKLY_LEAVE_REPORT_SUBJECT, html);
    if (ok) sent++;
    else failed++;
  }

  return NextResponse.json({ ok: true, users: users.length, sent, failed });
}
