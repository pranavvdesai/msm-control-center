import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeClassTimePair } from "@/lib/utils";

function cronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
