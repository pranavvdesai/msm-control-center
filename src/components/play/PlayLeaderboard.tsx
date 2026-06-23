"use client";

import { cn } from "@/lib/utils";

type Entry = {
  rank: number;
  name: string;
  rollNumber?: string;
  isYou?: boolean;
  [key: string]: unknown;
};

export function PlayLeaderboard({
  title,
  scope,
  onScopeChange,
  entries,
  columns,
  emptyMessage,
}: {
  title: string;
  scope: "today" | "alltime";
  onScopeChange: (s: "today" | "alltime") => void;
  entries: Entry[];
  columns: { key: string; label: string; render?: (e: Entry) => React.ReactNode }[];
  emptyMessage: string;
}) {
  return (
    <div className="msm-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="msm-section-title">{title}</h2>
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
          {(["today", "alltime"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onScopeChange(s)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold capitalize transition",
                scope === s ? "bg-cyan-600 text-white" : "text-slate-600"
              )}
            >
              {s === "today" ? "Today" : "All-time"}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">Player</th>
                {columns.map((c) => (
                  <th key={c.key} className="pb-2 pr-2">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={`${e.rank}-${e.name}`}
                  className={cn(
                    "border-b border-slate-50",
                    e.isYou && "bg-cyan-50/80 font-semibold"
                  )}
                >
                  <td className="py-2 pr-2 text-slate-500">{e.rank}</td>
                  <td className="py-2 pr-2">
                    {e.name}
                    {e.isYou && (
                      <span className="ml-1 text-[10px] font-bold uppercase text-cyan-700">you</span>
                    )}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="py-2 pr-2">
                      {c.render ? c.render(e) : String(e[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
