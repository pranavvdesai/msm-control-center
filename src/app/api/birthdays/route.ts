import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { firstName } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const now = new Date();

  const users = await prisma.user.findMany({
    where: { profileComplete: true, birthday: { not: null } },
    select: { name: true, rollNumber: true, birthday: true },
    orderBy: { name: "asc" },
  });

  const withBirthday = users
    .filter((u) => u.birthday)
    .map((u) => ({
      name: u.name,
      firstName: firstName(u.name),
      rollNumber: u.rollNumber,
      birthday: u.birthday!,
      month: u.birthday!.getMonth() + 1,
      day: u.birthday!.getDate(),
    }));

  if (month) {
    const [, mon] = month.split("-").map(Number);
    const thisMonth = withBirthday
      .filter((u) => u.month === mon)
      .sort((a, b) => a.day - b.day);
    return NextResponse.json({ month, birthdays: thisMonth });
  }

  return NextResponse.json({
    year: now.getFullYear(),
    birthdays: withBirthday,
  });
}
