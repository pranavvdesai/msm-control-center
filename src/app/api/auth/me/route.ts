import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canUpload } from "@/lib/permissions";

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
      profileComplete: true,
    },
  });

  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      ...user,
      canUpload: canUpload(user.rollNumber) || user.role === "ADMIN",
    },
  });
}
