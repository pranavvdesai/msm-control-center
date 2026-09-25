import { prisma } from "@/lib/db";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import {
  FEATURE_ANNOUNCEMENT_SUBJECT,
  featureAnnouncementEmailHtml,
} from "@/lib/feature-announcement-email";

export async function sendFeatureAnnouncement(options?: {
  mode?: "test" | "all";
  testRoll?: string;
}) {
  if (!isEmailConfigured()) {
    return { ok: false as const, error: "Email not configured (msm.tapmi@gmail.com Gmail app password)." };
  }

  const mode = options?.mode ?? "all";
  const testRoll = options?.testRoll ?? "25M136";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";
  const subjectPrefix = mode === "test" ? "[PREVIEW — Ram only] " : "";

  if (mode === "test") {
    const user = await prisma.user.findUnique({
      where: { rollNumber: testRoll },
      select: { name: true, collegeEmail: true, email: true, rollNumber: true },
    });

    if (!user) {
      return { ok: false as const, error: `User ${testRoll} not found.` };
    }

    const to = user.collegeEmail || user.email;
    if (!to) {
      return { ok: false as const, error: `${testRoll} has no email on file.` };
    }

    const firstName = user.name.split(" ")[0];
    const html = featureAnnouncementEmailHtml(firstName, appUrl);
    const sent = await sendEmail(to, `${subjectPrefix}${FEATURE_ANNOUNCEMENT_SUBJECT}`, html);

    return sent
      ? { ok: true as const, mode: "test" as const, sent: 1, failed: 0, total: 1, previewTo: to }
      : { ok: false as const, error: `Failed to send preview to ${to}.` };
  }

  const users = await prisma.user.findMany({
    where: {
      profileComplete: true,
      collegeEmail: { not: null },
    },
    select: { name: true, collegeEmail: true, rollNumber: true },
    orderBy: { rollNumber: "asc" },
  });

  let sent = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const user of users) {
    const to = user.collegeEmail!;
    const firstName = user.name.split(" ")[0];
    const html = featureAnnouncementEmailHtml(firstName, appUrl);
    const ok = await sendEmail(to, FEATURE_ANNOUNCEMENT_SUBJECT, html);

    if (ok) {
      sent++;
    } else {
      failed++;
      failures.push(user.rollNumber);
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  return {
    ok: failed === 0,
    mode: "all" as const,
    sent,
    failed,
    total: users.length,
    failures: failures.slice(0, 10),
  };
}
