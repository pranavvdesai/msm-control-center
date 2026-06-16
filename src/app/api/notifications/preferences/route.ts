import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { remindersEnabled: true },
  });

  const subCount = await prisma.pushSubscription.count({
    where: { userId: session.id },
  });

  return NextResponse.json({
    remindersEnabled: user?.remindersEnabled ?? false,
    hasPushSubscription: subCount > 0,
    pushConfigured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enabled } = await request.json();
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
  }

  if (enabled) {
    const subCount = await prisma.pushSubscription.count({
      where: { userId: session.id },
    });
    if (subCount === 0) {
      return NextResponse.json(
        { error: "Enable push on your device first — reminders require a mobile subscription." },
        { status: 400 }
      );
    }
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { remindersEnabled: enabled },
  });

  if (!enabled) {
    await prisma.pushSubscription.deleteMany({ where: { userId: session.id } });
  }

  return NextResponse.json({ remindersEnabled: enabled });
}
