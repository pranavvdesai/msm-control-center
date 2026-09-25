"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NavShell } from "@/components/NavShell";
import { PlayLeaderboard } from "@/components/play/PlayLeaderboard";
import { QuizPanel, type QuizQuestionView } from "@/components/quiz/QuizPanel";
import { formatDuration } from "@/lib/play/ist-date";
import { ArrowLeft, Clock, Flame, Trophy } from "lucide-react";

type QuizData = {
  dateLabel: string;
  questions: QuizQuestionView[];
  attempt: {
    status: string;
    durationMs: number | null;
    correctCount: number;
    score: number;
    startedAt: string;
  };
  results: Array<{
    questionId: string;
    selectedIndex: number;
    correct: boolean;
    correctIndex: number;
  }> | null;
  cohortCompleted: number;
};

export default function QuizPage() {
  const [userName, setUserName] = useState("");
  const [data, setData] = useState<QuizData | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [finish, setFinish] = useState<{ rank: number; score: number; correctCount: number; durationMs: number } | null>(null);
  const [lbScope, setLbScope] = useState<"today" | "alltime">("today");
  const [leaderboard, setLeaderboard] = useState<Array<Record<string, unknown>>>([]);

  const finished = data?.attempt.status === "completed" || !!finish;

  const load = useCallback(async () => {
    const res = await fetch("/api/quiz/today");
    if (res.ok) {
      const d = await res.json();
      setData(d);
      if (d.attempt.status === "completed") {
        setFinish({
          rank: 0,
          score: d.attempt.score,
          correctCount: d.attempt.correctCount,
          durationMs: d.attempt.durationMs ?? 0,
        });
        if (d.results) {
          const sel: Record<string, number> = {};
          for (const r of d.results) sel[r.questionId] = r.selectedIndex;
          setSelections(sel);
        }
      }
    }
  }, []);

  const loadLb = useCallback(async () => {
    const res = await fetch(`/api/quiz/leaderboard?scope=${lbScope}`);
    if (res.ok) {
      const d = await res.json();
      setLeaderboard(d.leaderboard ?? []);
    }
  }, [lbScope]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));
    load();
  }, [load]);

  useEffect(() => {
    loadLb();
    const t = setInterval(loadLb, 30000);
    return () => clearInterval(t);
  }, [loadLb]);

  useEffect(() => {
    if (!data || finished) return;
    const start = new Date(data.attempt.startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data, finished]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function onSelect(questionId: string, index: number) {
    if (finished) return;
    setSelections((s) => ({ ...s, [questionId]: index }));
  }

  async function submit() {
    if (!data || finished || submitting) return;
    const answers = data.questions.map((q) => ({
      questionId: q.id,
      selectedIndex: selections[q.id],
    }));
    if (answers.some((a) => a.selectedIndex === undefined)) {
      setToast("Answer all 5 questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/today/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const d = await res.json();
      if (!res.ok) {
        setToast(d.error || "Submit failed");
        return;
      }
      setFinish({
        rank: d.rank,
        score: d.score,
        correctCount: d.correctCount,
        durationMs: d.durationMs,
      });
      setToast(`${d.correctCount}/5 correct · ${d.score} pts · #${d.rank} today`);
      await load();
      loadLb();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NavShell userName={userName}>
      <Link href="/games" className="mb-4 flex items-center gap-1 text-sm font-semibold text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Back to Play
      </Link>

      <div className="msm-page-header mb-4">
        <h1 className="msm-page-title">Daily Quiz</h1>
        <p className="msm-page-subtitle">
          {data?.dateLabel ?? "Loading…"} · 5 hard questions · speed + accuracy both matter ·{" "}
          {data?.cohortCompleted ?? 0} finished today
        </p>
      </div>

      {toast && (
        <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <Clock className="h-4 w-4 text-violet-600" />
          <span className="font-mono font-bold">{formatDuration(finished ? (finish?.durationMs ?? elapsed) : elapsed)}</span>
        </div>
        {finish && (
          <>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              Score: <span className="font-bold text-violet-700">{finish.score}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              <Trophy className="h-4 w-4" /> {finish.correctCount}/5 · #{finish.rank} today
            </div>
          </>
        )}
      </div>

      {data && (
        <>
          <QuizPanel
            questions={data.questions}
            selections={selections}
            onSelect={onSelect}
            readOnly={finished}
            results={data.results ?? undefined}
          />

          {!finished && (
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="mt-4 w-full rounded-2xl bg-violet-600 py-3 font-semibold text-white shadow-md disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit quiz"}
            </button>
          )}
        </>
      )}

      <div className="mt-6">
        <PlayLeaderboard
          title="Quiz leaderboard"
          scope={lbScope}
          onScopeChange={setLbScope}
          entries={leaderboard as never[]}
          emptyMessage={
            lbScope === "today"
              ? "No quiz submissions yet today. Go for it!"
              : "Complete daily quizzes to climb the all-time board."
          }
          columns={
            lbScope === "today"
              ? [
                  { key: "score", label: "Score" },
                  { key: "correctCount", label: "Correct" },
                  { key: "durationLabel", label: "Time" },
                ]
              : [
                  { key: "allTimeScore", label: "Total score" },
                  { key: "bestScore", label: "Best day" },
                  {
                    key: "currentStreak",
                    label: "Streak",
                    render: (e) => (
                      <span>
                        {(e.currentStreak as number) > 0 && (
                          <Flame className="mr-1 inline h-3 w-3 text-orange-500" />
                        )}
                        {String(e.currentStreak)}
                      </span>
                    ),
                  },
                ]
          }
        />
      </div>
    </NavShell>
  );
}
