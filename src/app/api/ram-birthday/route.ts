import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isRamBirthdayToday,
  isRamRoll,
  RAM_BIRTHDAY_POEM,
  RAM_DISPLAY_NAME,
  RAM_FIRST_NAME,
} from "@/lib/ram-birthday";
import { getIstDateString } from "@/lib/play/ist-date";

export async function GET() {
  const session = await getSession();
  if (!session || !isRamBirthdayToday()) {
    return NextResponse.json({ active: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { rollNumber: true },
  });

  const roll = user?.rollNumber?.toUpperCase() ?? null;
  if (!roll) {
    return NextResponse.json({ active: false });
  }

  const isRam = isRamRoll(roll);

  return NextResponse.json({
    active: true,
    istDate: getIstDateString(),
    isRam,
    firstName: RAM_FIRST_NAME,
    displayName: RAM_DISPLAY_NAME,
    poem: isRam ? RAM_BIRTHDAY_POEM : null,
  });
}
