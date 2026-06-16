import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Registration is closed. Use your roll number and the cohort password to log in.",
    },
    { status: 403 }
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: session });
}
