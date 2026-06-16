import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sessionIsRamAdmin } from "@/lib/permissions";
import {
  isEmailConfigured,
  sendBirthdayEmails,
  sendEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import {
  buildUserLeaveReport,
  weeklyLeaveReportEmailHtml,
  WEEKLY_LEAVE_REPORT_SUBJECT,
} from "@/lib/weekly-leave-report";

const VALID_TYPES = new Set(["welcome", "birthday", "weekly"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !(await sessionIsRamAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email not configured on server (Gmail or Resend)." },
      { status: 503 }
    );
  }

  let body: { type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type;
  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: "type must be welcome, birthday, or weekly" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      rollNumber: true,
      collegeEmail: true,
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const to = user.collegeEmail || user.email;
  if (!to) {
    return NextResponse.json(
      { error: "Add your college email in profile first." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";
  const firstName = user.name.split(" ")[0];

  try {
    if (type === "welcome") {
      const result = await sendWelcomeEmail(
        {
          name: user.name,
          rollNumber: user.rollNumber,
          collegeEmail: to,
        },
        "[TEST] "
      );
      if (!result.sent) {
        return NextResponse.json({ error: "Welcome test email failed to send." }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        message: `Welcome test email sent to ${to}`,
      });
    }

    if (type === "birthday") {
      const result = await sendBirthdayEmails(
        [{ name: user.name, rollNumber: user.rollNumber }],
        [{ email: to, name: user.name, rollNumber: user.rollNumber }],
        "[TEST] "
      );
      if (result.sent === 0) {
        return NextResponse.json({ error: "Birthday test email failed to send." }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        message: `Birthday test email sent to ${to}`,
      });
    }

    const report = await buildUserLeaveReport(session.id);
    const html = weeklyLeaveReportEmailHtml(firstName, report, appUrl);
    const sent = await sendEmail(to, `[TEST] ${WEEKLY_LEAVE_REPORT_SUBJECT}`, html);
    if (!sent) {
      return NextResponse.json({ error: "Weekly test email failed to send." }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      message: `Weekly leave report test sent to ${to}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
