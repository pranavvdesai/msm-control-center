import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COHORT_PASSWORD } from "@/lib/students";

const ALLOWED_ROLLS = new Set(["25M136"]);

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, rollNumber: true, name: true },
  });

  if (!user || !ALLOWED_ROLLS.has(user.rollNumber)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roll = user.rollNumber;
  const name = user.name;
  const role = user.rollNumber === "25M136" ? "ADMIN" : "STUDENT";

  await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  await prisma.leave.deleteMany({ where: { userId: user.id } });
  await prisma.activityEvent.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  const passwordHash = await bcrypt.hash(COHORT_PASSWORD, 10);
  await prisma.user.create({
    data: {
      name,
      rollNumber: roll,
      email: `${roll.toLowerCase()}@msm.cohort`,
      passwordHash,
      role,
      profileComplete: false,
      welcomeEmailSent: false,
      collegeEmail: null,
      birthday: null,
    },
  });

  await destroySession();

  return NextResponse.json({
    ok: true,
    message: "Account reset. Log in again with your roll number to complete onboarding.",
    rollNumber: roll,
  });
}
