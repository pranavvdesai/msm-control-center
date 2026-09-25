import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const leave = await prisma.leave.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!leave) {
    return NextResponse.json({ error: "Leave not found" }, { status: 404 });
  }

  if (leave.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.leave.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
