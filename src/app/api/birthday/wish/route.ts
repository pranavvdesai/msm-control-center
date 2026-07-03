import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildWishFeedMessage,
  buildWishSuccessMessage,
  ensureBirthdayWishSchema,
  getTodaysBirthdayPeople,
} from "@/lib/birthday-celebration";
import { getIstDateString } from "@/lib/play/ist-date";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureBirthdayWishSchema();

  let body: { toUserId?: string; toUserIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const istDate = getIstDateString();
  const birthdayPeople = await getTodaysBirthdayPeople(istDate);
  const birthdayIds = new Set(birthdayPeople.map((p) => p.id));

  const requestedIds = [
    ...(body.toUserIds ?? []),
    ...(body.toUserId ? [body.toUserId] : []),
  ].filter((id, i, arr) => arr.indexOf(id) === i);

  if (requestedIds.length === 0) {
    const pending = birthdayPeople
      .filter((p) => p.id !== session.id)
      .map((p) => p.id);
    requestedIds.push(...pending);
  }

  const validTargets = requestedIds.filter(
    (id) => birthdayIds.has(id) && id !== session.id
  );

  if (validTargets.length === 0) {
    return NextResponse.json(
      { error: "No valid birthday recipients to wish today." },
      { status: 400 }
    );
  }

  const sender = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true },
  });
  if (!sender) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const created: string[] = [];

  for (const toUserId of validTargets) {
    const existing = await prisma.birthdayWish.findUnique({
      where: {
        fromUserId_toUserId_istDate: {
          fromUserId: session.id,
          toUserId,
          istDate,
        },
      },
    });
    if (existing) continue;

    const target = birthdayPeople.find((p) => p.id === toUserId);
    if (!target) continue;

    await prisma.birthdayWish.create({
      data: {
        fromUserId: session.id,
        toUserId,
        istDate,
      },
    });

    await prisma.activityEvent.create({
      data: {
        userId: session.id,
        message: buildWishFeedMessage(sender.name, target.firstName),
        type: "birthday_wish",
      },
    });

    created.push(toUserId);
  }

  return NextResponse.json({
    ok: true,
    sent: created.length,
    message: buildWishSuccessMessage(created.length, birthdayPeople, created),
  });
}
