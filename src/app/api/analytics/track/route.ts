import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trackPageVisit } from "@/lib/analytics/track";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const path = body.path?.trim();
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const visit = await trackPageVisit(session.id, path);
  return NextResponse.json({ ok: true, tracked: !!visit });
}
