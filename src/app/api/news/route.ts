import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureDailyNews } from "@/lib/news/service";
import { getIstDateString, formatIstDisplay } from "@/lib/play/ist-date";

export const maxDuration = 60;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = new URL(request.url).searchParams.get("refresh") === "1";
  const newsDate = getIstDateString();
  const categories = await ensureDailyNews(newsDate, { force });

  return NextResponse.json({
    date: newsDate,
    dateLabel: formatIstDisplay(newsDate),
    categories,
  });
}
