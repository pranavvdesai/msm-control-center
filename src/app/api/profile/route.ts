import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendWelcomeEmailIfNeeded } from "@/lib/welcome";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      rollNumber: true,
      role: true,
      collegeEmail: true,
      birthday: true,
      profileComplete: true,
    },
  });

  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { collegeEmail, birthday } = await request.json();

    if (!collegeEmail || !birthday) {
      return NextResponse.json(
        { error: "College email and birthday are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(collegeEmail)) {
      return NextResponse.json({ error: "Invalid college email" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.id },
      select: { profileComplete: true },
    });

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        collegeEmail: collegeEmail.trim().toLowerCase(),
        birthday: new Date(birthday),
        profileComplete: true,
      },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        collegeEmail: true,
        birthday: true,
        profileComplete: true,
        role: true,
      },
    });

    await prisma.activityEvent.create({
      data: {
        userId: user.id,
        message: `${user.name} joined the MSM family officially. Profile unlocked!`,
        type: "social",
      },
    });

    if (!existing?.profileComplete) {
      await sendWelcomeEmailIfNeeded(user.id);
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
  }
}
