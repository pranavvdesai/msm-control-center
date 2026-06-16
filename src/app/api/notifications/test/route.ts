import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CLASS_REMINDER_PUSH } from "@/lib/class-reminder";
import { sendPushNotification } from "@/lib/push";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      pushSubscriptions: true,
      remindersEnabled: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.remindersEnabled || user.pushSubscriptions.length === 0) {
    return NextResponse.json(
      {
        error:
          "Mobile notifications not set up. Tap Enable mobile notifications and allow permission first.",
      },
      { status: 400 }
    );
  }

  let pushSent = false;
  for (const sub of user.pushSubscriptions) {
    if (await sendPushNotification(sub, CLASS_REMINDER_PUSH)) {
      pushSent = true;
      break;
    }
    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
  }

  if (!pushSent) {
    return NextResponse.json(
      {
        error:
          "Push failed. Re-enable notifications — on iPhone, open from your home screen app icon.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Test notification sent! Check your phone.",
    pushSent: true,
  });
}
