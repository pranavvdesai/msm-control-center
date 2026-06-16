import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBirthdayEmails } from "@/lib/email";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const allUsers = await prisma.user.findMany({
    where: { profileComplete: true, collegeEmail: { not: null } },
    select: { name: true, rollNumber: true, collegeEmail: true, birthday: true },
  });

  const birthdayPeople = allUsers.filter((u) => {
    if (!u.birthday) return false;
    const b = new Date(u.birthday);
    return b.getMonth() + 1 === month && b.getDate() === day;
  });

  const recipientEmails = [
    ...new Set(allUsers.map((u) => u.collegeEmail!).filter(Boolean)),
  ];

  const result = await sendBirthdayEmails(
    birthdayPeople.map((p) => ({ name: p.name, rollNumber: p.rollNumber })),
    recipientEmails
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
