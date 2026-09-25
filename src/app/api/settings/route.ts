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
      ...(body.crName != null && { crName: String(body.crName) }),
      ...(body.crPhone != null && { crPhone: String(body.crPhone) }),
      ...(body.cohortName != null && { cohortName: String(body.cohortName) }),
      ...(body.cohortFull != null && { cohortFull: String(body.cohortFull) }),
      ...(body.termInfo != null && { termInfo: String(body.termInfo) }),
    },
    create: {
      crName: body.crName || "TBD",
      crPhone: body.crPhone || "8500780044",
      cohortName: body.cohortName || "MSM",
      cohortFull: body.cohortFull || "Marketing and Sales Management",
      termInfo: body.termInfo || "Term 5 · TAPMI Manipal",
    },
  });

  return NextResponse.json({ settings });
}
