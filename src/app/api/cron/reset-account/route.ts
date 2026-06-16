import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { COHORT_PASSWORD } from "@/lib/students";

function cronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rollNumber = (searchParams.get("roll") || "25M136").toUpperCase();

  const user = await prisma.user.findUnique({ where: { rollNumber } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.leave.deleteMany({ where: { userId: user.id } });
  await prisma.activityEvent.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  const passwordHash = await bcrypt.hash(COHORT_PASSWORD, 10);
  const fresh = await prisma.user.create({
    data: {
      name: user.name,
      rollNumber: user.rollNumber,
      email: `${rollNumber.toLowerCase()}@msm.cohort`,
      passwordHash,
      role: user.role,
      profileComplete: false,
      welcomeEmailSent: false,
    },
  });

  return NextResponse.json({
    ok: true,
    message: `${user.name} (${rollNumber}) reset — log in again to complete onboarding.`,
    userId: fresh.id,
  });
}
