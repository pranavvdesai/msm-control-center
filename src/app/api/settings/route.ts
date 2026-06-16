import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.appSettings.findFirst();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {
      crName: body.crName,
      cohortName: body.cohortName,
      cohortFull: body.cohortFull,
    },
    create: {
      crName: body.crName || "TBD",
      cohortName: body.cohortName || "MSM",
      cohortFull: body.cohortFull || "Marketing and Sales Management",
    },
  });

  return NextResponse.json({ settings });
}
