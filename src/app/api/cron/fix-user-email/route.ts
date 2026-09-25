import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail, isEmailConfigured } from "@/lib/email";

function cronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

/** Fix a user's college email and resend the welcome mail (cron / admin maintenance). */
export async function POST(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  let body: { rollNumber?: string; collegeEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const roll = body.rollNumber?.trim().toUpperCase();
  const email = body.collegeEmail?.trim().toLowerCase();

  if (!roll || !email) {
    return NextResponse.json({ error: "rollNumber and collegeEmail required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@learner\.manipal\.edu$/i;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Must be a @learner.manipal.edu address" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { rollNumber: roll },
    select: { id: true, name: true, rollNumber: true, collegeEmail: true },
  });

  if (!existing) {
    return NextResponse.json({ error: `User ${roll} not found` }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      collegeEmail: email,
      profileComplete: true,
      welcomeEmailSent: false,
    },
    select: { id: true, name: true, rollNumber: true, collegeEmail: true },
  });

  const result = await sendWelcomeEmail({
    name: user.name,
    rollNumber: user.rollNumber,
    collegeEmail: email,
  });

  if (result.sent > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { welcomeEmailSent: true },
    });
  }

  return NextResponse.json({
    ok: true,
    message: result.sent > 0 ? `Welcome email sent to ${email}` : "Email updated but welcome send failed",
    previousEmail: existing.collegeEmail,
    user,
    emailSent: result.sent > 0,
  });
}
