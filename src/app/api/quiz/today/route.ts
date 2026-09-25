import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatIstDisplay, getIstDateString } from "@/lib/play/ist-date";
import { ensureDailyQuiz, getOrCreateQuizAttempt } from "@/lib/play/daily-service";
import { toPublicQuestion, type StoredQuizQuestion } from "@/lib/quiz/question-bank";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateStr = getIstDateString();
  const quiz = await ensureDailyQuiz(dateStr);
  const attempt = await getOrCreateQuizAttempt(session.id, quiz.id, dateStr);

  const stored: StoredQuizQuestion[] = JSON.parse(quiz.questions);
  const questions = stored.map(toPublicQuestion);

  const completedCount = await prisma.quizAttempt.count({
    where: { quizDate: dateStr, status: "completed" },
  });

  let results: Array<{ questionId: string; selectedIndex: number; correct: boolean }> = [];
  if (attempt.status === "completed") {
    results = JSON.parse(attempt.answers).map(
      (a: { questionId: string; selectedIndex: number; correct: boolean }) => ({
        questionId: a.questionId,
        selectedIndex: a.selectedIndex,
        correct: a.correct,
        correctIndex: stored.find((q) => q.id === a.questionId)?.correctIndex,
      })
    );
  }

  return NextResponse.json({
    date: dateStr,
    dateLabel: formatIstDisplay(dateStr),
    questions: attempt.status === "completed" ? questions : questions,
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      durationMs: attempt.durationMs,
      correctCount: attempt.correctCount,
      score: attempt.score,
    },
    results: attempt.status === "completed" ? results : null,
    cohortCompleted: completedCount,
  });
}
