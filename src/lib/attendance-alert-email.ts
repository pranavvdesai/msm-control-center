import { prisma } from "./db";
import { buildSubjectStats, getSubjectAlert } from "./alerts";
import { sendEmail, isEmailConfigured } from "./email";
import { isExcludedSubject } from "./subjects";
import { maxLeavesForCredits } from "./utils";

export const ATTENDANCE_ALERT_SUBJECT = "⚠️ 1 leave left — MSM Control Center";

type AlertSubject = {
  subjectName: string;
  maxLeaves: number;
  regularAbsences: number;
  alertMessage: string;
};

export function attendanceAlertEmailHtml(
  firstName: string,
  subjects: AlertSubject[],
  appUrl: string
) {
  const subjectBlocks = subjects
    .map(
      (s) => `
      <div style="margin: 16px 0; padding: 16px; background: #0a0a1a; border-radius: 12px; border: 1px solid #f59e0b33;">
        <p style="margin: 0 0 6px; color: #f59e0b; font-size: 12px; font-weight: 600; text-transform: uppercase;">${s.subjectName}</p>
        <p style="margin: 0 0 8px; color: #e4e4e7; font-size: 15px; font-weight: 600;">1 leave left (${s.regularAbsences} of ${s.maxLeaves} used)</p>
        <p style="margin: 0; color: #a1a1aa; font-size: 14px; font-style: italic;">${s.alertMessage}</p>
      </div>
    `
    )
    .join("");

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #030014; color: #f4f4f5; padding: 32px; border-radius: 16px;">
      <p style="color: #f59e0b; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Attendance alert</p>
      <h1 style="font-size: 24px; margin: 16px 0;">Hey ${firstName}, danger zone ahead ⚠️</h1>
      <p style="color: #d4d4d8; line-height: 1.7;">
        You now have only <strong style="color: #f59e0b;">1 leave left</strong> in the subject${subjects.length > 1 ? "s" : ""} below.
        One more regular absence and your GPA enters the red zone.
      </p>
      ${subjectBlocks}
      <a href="${appUrl}/dashboard" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
        Check your attendance →
      </a>
      <p style="color: #71717a; font-size: 13px; margin-top: 24px;">
        MSM Control Center · TAPMI Manipal · Sent automatically when you hit 1 leave left.
      </p>
    </div>
  `;
}

/** Send alert when a regular leave leaves exactly 1 remaining in that subject. */
export async function sendOneLeaveLeftAlertIfNeeded(
  userId: string,
  subjectId: string,
  subjectName: string,
  subjectCredits: number
): Promise<{ sent: boolean }> {
  if (isExcludedSubject(subjectName)) return { sent: false };
  if (!isEmailConfigured()) return { sent: false };

  const maxLeaves = maxLeavesForCredits(subjectCredits);
  const regularCount = await prisma.leave.count({
    where: { userId, subjectId, type: "REGULAR" },
  });

  if (maxLeaves - regularCount !== 1) return { sent: false };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, collegeEmail: true, email: true },
  });

  const to = user?.collegeEmail || user?.email;
  if (!user || !to) return { sent: false };

  const stats = buildSubjectStats(subjectName, subjectCredits, regularCount, 0);
  const alert = getSubjectAlert(stats);
  const firstName = user.name.split(" ")[0];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";

  const html = attendanceAlertEmailHtml(
    firstName,
    [
      {
        subjectName,
        maxLeaves,
        regularAbsences: regularCount,
        alertMessage: alert.message,
      },
    ],
    appUrl
  );

  const sent = await sendEmail(to, ATTENDANCE_ALERT_SUBJECT, html);
  if (sent) {
    await prisma.activityEvent.create({
      data: {
        userId,
        message: `⚠️ Attendance alert email sent — 1 leave left in ${subjectName}.`,
        type: "alert",
      },
    });
  }

  return { sent };
}

export async function sendTestAttendanceAlertEmail(
  to: string,
  firstName: string,
  subjectPrefix = ""
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";
  const html = attendanceAlertEmailHtml(
    firstName,
    [
      {
        subjectName: "Applied Marketing Strategy",
        maxLeaves: 3,
        regularAbsences: 2,
        alertMessage: "Warning. One more leave and your GPA enters danger zone.",
      },
    ],
    appUrl
  );
  return sendEmail(to, `${subjectPrefix}${ATTENDANCE_ALERT_SUBJECT}`, html);
}
