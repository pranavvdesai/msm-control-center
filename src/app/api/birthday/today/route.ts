import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBirthdayPersonPoemPlain } from "@/lib/birthday-email-content";
import {
  ensureBirthdayWishSchema,
  getTodaysBirthdayPeople,
} from "@/lib/birthday-celebration";
import { getIstDateString } from "@/lib/play/ist-date";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureBirthdayWishSchema();

  const istDate = getIstDateString();
  const birthdayPeople = await getTodaysBirthdayPeople(istDate);

  if (birthdayPeople.length === 0) {
    return NextResponse.json({
      active: false,
      istDate,
      birthdayPeople: [],
      viewer: { isBirthdayPerson: false },
      incomingWishes: [],
    });
  }

  const birthdayIds = new Set(birthdayPeople.map((p) => p.id));
  const isBirthdayPerson = birthdayIds.has(session.id);

  const [sentWishes, incomingWishes] = await Promise.all([
    prisma.birthdayWish.findMany({
      where: { fromUserId: session.id, istDate },
      select: { toUserId: true },
    }),
    isBirthdayPerson
      ? prisma.birthdayWish.findMany({
          where: { toUserId: session.id, istDate },
          include: { fromUser: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const alreadyWishedUserIds = sentWishes.map((w) => w.toUserId);
  const pendingWishUserIds = birthdayPeople
    .filter((p) => p.id !== session.id && !alreadyWishedUserIds.includes(p.id))
    .map((p) => p.id);

  const selfPerson = birthdayPeople.find((p) => p.id === session.id);

  return NextResponse.json({
    active: true,
    istDate,
    birthdayPeople: birthdayPeople.map((p) => ({
      id: p.id,
      name: p.name,
      firstName: p.firstName,
      rollNumber: p.rollNumber,
      poem:
        p.id === session.id
          ? getBirthdayPersonPoemPlain({ name: p.name, rollNumber: p.rollNumber }, istDate)
          : null,
    })),
    viewer: {
      isBirthdayPerson,
      alreadyWishedUserIds,
      pendingWishUserIds,
      wishCount: incomingWishes.length,
      poem: selfPerson
        ? getBirthdayPersonPoemPlain(
            { name: selfPerson.name, rollNumber: selfPerson.rollNumber },
            istDate
          )
        : null,
    },
    incomingWishes: incomingWishes.map((w) => ({
      id: w.id,
      fromName: w.fromUser.name,
      fromFirstName: w.fromUser.name.split(" ")[0],
      createdAt: w.createdAt.toISOString(),
    })),
  });
}
