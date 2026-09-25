import { NextResponse } from "next/server";
import { cronAuthorized, cronUnauthorizedResponse } from "@/lib/cron-auth";
import { isEmailConfigured } from "@/lib/email";
import { sendWeeklyLeaveReportBatch } from "@/lib/ops/send-weekly-leave";
import { getIstDateString } from "@/lib/play/ist-date";
import { isSaturdayIst } from "@/lib/ops/ist-calendar";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return cronUnauthorizedResponse();

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const istDate = url.searchParams.get("istDate") || getIstDateString();

  if (!url.searchParams.get("istDate") && !isSaturdayIst(istDate)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Weekly leave report runs on Saturday IST. Use ?istDate=YYYY-MM-DD&force=1 for catch-up.",
      },
      { status: 400 }
    );
  }

  const result = await sendWeeklyLeaveReportBatch(istDate, { force });
  return NextResponse.json(result);
}
