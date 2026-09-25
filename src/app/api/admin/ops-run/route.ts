import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sessionIsRamAdmin } from "@/lib/permissions";
import { sendWeeklyLeaveReportBatch } from "@/lib/ops/send-weekly-leave";
import { sendBirthdayBatchForEve } from "@/lib/ops/send-birthday";
import { runMorningOps } from "@/lib/ops/plan-service";
import { getIstDateString } from "@/lib/play/ist-date";

const VALID = new Set(["weekly_leave", "birthday_eve", "morning_refresh"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !(await sessionIsRamAdmin(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const task = String(body.task || "");
  const istDate = String(body.istDate || getIstDateString());
  const force = body.force !== false;

  if (!VALID.has(task)) {
    return NextResponse.json(
      { error: "task must be weekly_leave, birthday_eve, or morning_refresh" },
      { status: 400 }
    );
  }

  if (task === "weekly_leave") {
    const result = await sendWeeklyLeaveReportBatch(istDate, { force });
    return NextResponse.json({ ok: true, task, result });
  }

  if (task === "birthday_eve") {
    const result = await sendBirthdayBatchForEve(istDate, { force });
    return NextResponse.json({ ok: true, task, result });
  }

  const result = await runMorningOps(istDate);
  return NextResponse.json({ ok: true, task, result });
}
