import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, rollNumber: true, collegeEmail: true },
  });

  if (!user || user.rollNumber !== "25M136") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { welcomeEmailSent: false },
  });

  return NextResponse.json({
    ok: true,
    message: "Welcome email reset. Log in again to receive it.",
    user: { name: user.name, rollNumber: user.rollNumber, collegeEmail: user.collegeEmail },
  });
}
