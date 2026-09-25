import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIstDateString } from "@/lib/play/ist-date";
import { completeQuizAttempt } from "@/lib/play/daily-service";
import { quizDailyScore, type StoredQuizQuestion } from "@/lib/quiz/question-bank";

type AnswerPayload = { questionId: string; selectedIndex: number };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const answers = body.answers as AnswerPayload[];

  if (!Array.isArray(answers) || answers.length !== 5) {
    return NextResponse.json({ error: "Answer all 5 questions" }, { status: 400 });
  }

  const dateStr = getIstDateString();
  const quiz = await prisma.dailyQuiz.findUnique({ where: { quizDate: dateStr } });
  if (!quiz) return NextResponse.json({ error: "No quiz today" }, { status: 404 });

  const attempt = await prisma.quizAttempt.findUnique({
    where: { userId_quizDate: { userId: session.id, quizDate: dateStr } },
  });
  if (!attempt || attempt.status === "completed") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  const stored: StoredQuizQuestion[] = JSON.parse(quiz.questions);
  const byId = new Map(stored.map((q) => [q.id, q]));

  for (const a of answers) {
    if (!byId.has(a.questionId)) {
      return NextResponse.json({ error: "Invalid question" }, { status: 400 });
    }
    if (a.selectedIndex < 0 || a.selectedIndex > 3) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }
  }

  const graded = answers.map((a) => {
    const q = byId.get(a.questionId)!;
    const correct = a.selectedIndex === q.correctIndex;
    return {
      questionId: a.questionId,
      selectedIndex: a.selectedIndex,
      correctIndex: q.correctIndex,
      correct,
    };
  });

  const correctCount = graded.filter((g) => g.correct).length;
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - attempt.startedAt.getTime();

  if (durationMs < 5000) {
    return NextResponse.json({ error: "Completed too fast" }, { status: 400 });
  }

  const score = quizDailyScore(correctCount, durationMs);

  await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "completed",
      completedAt,
      durationMs,
      correctCount,
      score,
      answers: JSON.stringify(graded),
    },
  });

  await completeQuizAttempt(session.id, dateStr, correctCount, score, durationMs);

  const rank = await prisma.quizAttempt.count({
    where: {
      quizDate: dateStr,
      status: "completed",
      OR: [
        { score: { gt: score } },
        { score, durationMs: { lt: durationMs } },
      ],
    },
  });

  return NextResponse.json({
    ok: true,
    correctCount,
    score,
    durationMs,
    rank: rank + 1,
    results: graded,
  });
}
