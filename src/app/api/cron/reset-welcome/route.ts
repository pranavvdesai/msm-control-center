import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  const roll = (searchParams.get("roll") || "25M136").toUpperCase();

  const user = await prisma.user.update({
    where: { rollNumber: roll },
    data: { welcomeEmailSent: false },
    select: { name: true, rollNumber: true, collegeEmail: true, welcomeEmailSent: true },
  });

  return NextResponse.json({
    ok: true,
    message: `${user.name} can log in again to receive the welcome email.`,
    user,
  });
}
