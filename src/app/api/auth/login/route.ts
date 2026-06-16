import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSession,
  verifyPassword,
} from "@/lib/auth";
import { buildLoginFeedMessage } from "@/lib/alerts";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await prisma.activityEvent.create({
      data: {
        userId: user.id,
        message: buildLoginFeedMessage(user.name),
        type: "login",
      },
    });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
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
