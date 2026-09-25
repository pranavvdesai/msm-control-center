"use client";

import { cn } from "@/lib/utils";

export type QuizQuestionView = {
  id: string;
  categoryLabel: string;
  question: string;
  options: [string, string, string, string];
};

export function QuizPanel({
  questions,
  selections,
  onSelect,
  readOnly,
  results,
}: {
  questions: QuizQuestionView[];
  selections: Record<string, number>;
  onSelect: (questionId: string, index: number) => void;
  readOnly?: boolean;
  results?: Array<{ questionId: string; correct: boolean; correctIndex: number; selectedIndex: number }>;
}) {
  const resultMap = new Map(results?.map((r) => [r.questionId, r]));

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const result = resultMap.get(q.id);
        return (
          <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                Q{idx + 1} · {q.categoryLabel}
              </span>
              {result && (
                <span
                  className={cn(
                    "text-xs font-bold",
                    result.correct ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {result.correct ? "Correct" : "Wrong"}
                </span>
              )}
            </div>
            <p className="mb-3 text-sm font-medium leading-relaxed text-slate-900">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = selections[q.id] === oi;
                const isCorrect = result && result.correctIndex === oi;
                const isWrongPick = result && !result.correct && result.selectedIndex === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onSelect(q.id, oi)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition",
                      selected && !result && "border-cyan-500 bg-cyan-50 font-semibold",
                      !selected && !result && "border-slate-200 hover:border-slate-300",
                      isCorrect && "border-emerald-500 bg-emerald-50",
                      isWrongPick && "border-red-400 bg-red-50",
                      readOnly && !selected && !isCorrect && "opacity-80"
                    )}
                  >
                    <span className="mr-2 font-bold text-slate-500">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
