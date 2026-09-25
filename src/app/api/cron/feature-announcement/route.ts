import { NextResponse } from "next/server";
import { sendFeatureAnnouncement } from "@/lib/feature-announcement-send";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "test" ? "test" : "all";

  const result = await sendFeatureAnnouncement({ mode });

  if (!result.ok && "error" in result) {
    return NextResponse.json(result, { status: result.error?.includes("not configured") ? 503 : 500 });
  }

  return NextResponse.json(result);
}
