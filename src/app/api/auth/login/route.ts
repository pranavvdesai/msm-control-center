import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { buildLoginFeedMessage } from "@/lib/alerts";

export async function POST(request: Request) {
  try {
    const { rollNumber, password } = await request.json();

    if (!rollNumber || !password) {
      return NextResponse.json(
        { error: "Roll number and password required" },
        { status: 400 }
      );
    }

    const roll = String(rollNumber).trim().toUpperCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ rollNumber: roll }, { email: roll.toLowerCase() }],
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid roll number or password" }, { status: 401 });
    }

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "STUDENT",
    });

    await prisma.activityEvent.create({
      data: {
        userId: user.id,
        message: buildLoginFeedMessage(user.name),
        type: "login",
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        rollNumber: user.rollNumber,
        role: user.role,
        profileComplete: user.profileComplete,
      },
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  return NextResponse.json({ ok: true });
}
