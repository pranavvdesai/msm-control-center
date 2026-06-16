import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CLASS_REMINDER_PUSH } from "@/lib/class-reminder";
import { sendPushNotification } from "@/lib/push";

function cronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      remindersEnabled: true,
      profileComplete: true,
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      pushSubscriptions: true,
    },
  });

  let pushSent = 0;
  let failed = 0;

  for (const user of users) {
    for (const sub of user.pushSubscriptions) {
      const ok = await sendPushNotification(sub, CLASS_REMINDER_PUSH);
      if (ok) {
        pushSent++;
      } else {
        failed++;
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    ok: true,
    users: users.length,
    pushSent,
    failed,
  });
}
