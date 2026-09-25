import { NextResponse } from "next/server";
import { cronAuthorized, cronUnauthorizedResponse } from "@/lib/cron-auth";
import { sendBirthdayBatchForEve } from "@/lib/ops/send-birthday";
import { getIstDateString } from "@/lib/play/ist-date";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return cronUnauthorizedResponse();

  const url = new URL(request.url);
  const istDate = url.searchParams.get("istDate") || getIstDateString();
  const force = url.searchParams.get("force") === "1";

  const result = await sendBirthdayBatchForEve(istDate, { force });
  return NextResponse.json(result);
}
