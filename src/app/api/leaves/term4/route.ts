import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isLeaveType } from "@/lib/leaves";
import {
  type Term4RecoveredLeave,
  getTerm4ArchivedLeaves,
  getTerm4RecoveredLeaves,
  saveTerm4RecoveredLeaves,
} from "@/lib/term4-archive";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [leaves, recovered] = await Promise.all([
    getTerm4ArchivedLeaves(session.id),
    getTerm4RecoveredLeaves(session.id),
  ]);
  return NextResponse.json({ leaves, recovered });
}

function optionalString(value: unknown, max: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function sanitize(raw: unknown): Term4RecoveredLeave | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = optionalString(r.id, 64);
  const classDate = optionalString(r.classDate, 10);
  const subjectName = optionalString(r.subjectName, 200);
  if (!id || !classDate || !/^2026-(0[6-9])-\d{2}$/.test(classDate) || !subjectName) return null;
  if (typeof r.type !== "string" || !isLeaveType(r.type)) return null;

  return {
    id,
    classDate,
    subjectName,
    type: r.type,
    reason: optionalString(r.reason, 1000),
    startTime: optionalString(r.startTime, 16),
    endTime: optionalString(r.endTime, 16),
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const incoming = Array.isArray(body?.leaves) ? body.leaves.slice(0, 500) : [];
  const leaves = incoming.map(sanitize).filter((l: Term4RecoveredLeave | null): l is Term4RecoveredLeave => !!l);

  if (leaves.length === 0) {
    return NextResponse.json({ error: "No valid Term 4 leaves to save." }, { status: 400 });
  }

  const recovered = await saveTerm4RecoveredLeaves(session.id, leaves);
  return NextResponse.json({ recovered });
}
