import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTerm4ArchivedLeaves } from "@/lib/term4-archive";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leaves = await getTerm4ArchivedLeaves(session.id);
  return NextResponse.json({ leaves });
}
