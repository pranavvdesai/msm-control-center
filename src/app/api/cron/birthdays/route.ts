import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBirthdayEmails } from "@/lib/email";

function istMonthDay(date: Date): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  return {
    month: parseInt(parts.find((p) => p.type === "month")?.value || "1", 10),
    day: parseInt(parts.find((p) => p.type === "day")?.value || "1", 10),
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const { month, day } = istMonthDay(today);

  const allUsers = await prisma.user.findMany({
    where: { profileComplete: true, collegeEmail: { not: null } },
    select: { name: true, rollNumber: true, collegeEmail: true, birthday: true },
  });

  const birthdayPeople = allUsers.filter((u) => {
    if (!u.birthday) return false;
    const b = istMonthDay(new Date(u.birthday));
    return b.month === month && b.day === day;
  });

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

  return NextResponse.json({
    date: today.toISOString().slice(0, 10),
    birthdays: birthdayPeople.map((p) => p.name),
    emailsSent: result.sent,
    skipped: result.skipped,
  });
}
