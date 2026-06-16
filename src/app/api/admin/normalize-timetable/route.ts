import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeClassTimePair } from "@/lib/utils";
import { sessionIsRamAdmin } from "@/lib/permissions";

export async function POST() {
  const session = await getSession();
  if (!session || !(await sessionIsRamAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await prisma.timetableEntry.findMany({
    select: { id: true, startTime: true, endTime: true },
  });

  let updated = 0;
  for (const entry of entries) {
    const { startTime, endTime } = normalizeClassTimePair(entry.startTime, entry.endTime);
    if (startTime !== entry.startTime || endTime !== entry.endTime) {
      await prisma.timetableEntry.update({
        where: { id: entry.id },
        data: { startTime, endTime },
      });
      updated++;
    }
  }

  return NextResponse.json({ total: entries.length, updated });
}
