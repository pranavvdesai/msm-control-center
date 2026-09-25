import { prisma } from "@/lib/db";
import { sendBirthdayEmails } from "@/lib/email";
import { wasEmailBatchSent, markEmailBatchSent } from "@/lib/email-send-log";
import { addIstDays, birthdayMatchesDate } from "@/lib/ops/ist-calendar";
import { refreshDailyOpsPlan, updateOpsTaskStatus } from "@/lib/ops/plan-service";

/** Birthday mail fires 11:59 PM IST on the eve — targets tomorrow's birthdays. */
export async function sendBirthdayBatchForEve(istDate: string, options?: { force?: boolean }) {
  await refreshDailyOpsPlan(istDate);

  const targetDate = addIstDays(istDate, 1);

  if (!options?.force && (await wasEmailBatchSent("birthday_batch", targetDate))) {
    return {
      ok: true,
      istDate,
      targetDate,
      skipped: true,
      reason: "Birthday batch already sent for target date",
    };
  }

  const allUsers = await prisma.user.findMany({
    where: { profileComplete: true, collegeEmail: { not: null } },
    select: { name: true, rollNumber: true, collegeEmail: true, birthday: true },
  });

  const birthdayPeople = allUsers.filter(
    (u) => u.birthday && birthdayMatchesDate(u.birthday, targetDate)
  );

  const recipients = allUsers
    .filter((u) => u.collegeEmail)
    .map((u) => ({
      email: u.collegeEmail!,
      name: u.name,
      rollNumber: u.rollNumber,
    }));

  const result = await sendBirthdayEmails(
    birthdayPeople.map((p) => ({ name: p.name, rollNumber: p.rollNumber })),
    recipients
  );

  if (birthdayPeople.length > 0) {
    await prisma.activityEvent.create({
      data: {
        message: `🎂 Birthday alert! ${birthdayPeople.map((p) => p.name).join(", ")} — MSM wishes you the best!`,
        type: "birthday",
      },
    });
  }

  if (birthdayPeople.length > 0 && result.sent > 0) {
    await markEmailBatchSent("birthday_batch", targetDate, {
      birthdays: birthdayPeople.map((p) => p.rollNumber),
      emailsSent: result.sent,
      eveIstDate: istDate,
    });
  }

  await updateOpsTaskStatus("birthday", istDate, result.sent === 0 && birthdayPeople.length > 0 ? "failed" : birthdayPeople.length > 0 ? "completed" : "pending", {
    targetDate,
    birthdays: birthdayPeople.map((p) => p.name),
    emailsSent: result.sent,
  });

  return {
    ok: true,
    istDate,
    targetDate,
    schedule: "11:59 PM IST (eve before birthday)",
    birthdays: birthdayPeople.map((p) => p.name),
    emailsSent: result.sent,
    skipped: result.skipped,
  };
}
