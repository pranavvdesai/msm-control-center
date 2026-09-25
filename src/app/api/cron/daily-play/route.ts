import { NextResponse } from "next/server";
import { cronAuthorized, cronUnauthorizedResponse } from "@/lib/cron-auth";
import { ensureDailyPlayContent } from "@/lib/play/daily-service";
import { getIstDateString } from "@/lib/play/ist-date";
import { updateOpsTaskStatus } from "@/lib/ops/plan-service";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return cronUnauthorizedResponse();

  const dateStr = getIstDateString();
  const { sudoku, quiz } = await ensureDailyPlayContent(dateStr);

  await updateOpsTaskStatus("daily_play", dateStr, "completed", {
    sudokuId: sudoku.id,
    quizId: quiz.id,
  });

  return NextResponse.json({
    ok: true,
    date: dateStr,
    sudoku: { id: sudoku.id, clueCount: sudoku.clueCount, difficulty: sudoku.difficulty },
    quiz: { id: quiz.id, questionCount: JSON.parse(quiz.questions).length },
  });
}
