import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAnalyticsReport } from "@/lib/analytics/query";
import { sessionIsRamAdmin } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session || !(await sessionIsRamAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await getAnalyticsReport();
  return NextResponse.json(report);
}
