"use client";

import { cn } from "@/lib/utils";
import { parseGrid, type Grid } from "@/lib/sudoku/grid";

export function SudokuGrid({
  initialGrid,
  currentGrid,
  selected,
  onSelect,
  onSetValue,
  readOnly,
  conflictIndices,
}: {
  initialGrid: string;
  currentGrid: string;
  selected: number | null;
  onSelect: (i: number) => void;
  onSetValue: (i: number, v: number) => void;
  readOnly?: boolean;
  conflictIndices?: Set<number>;
}) {
  const initial = parseGrid(initialGrid);
  const current = parseGrid(currentGrid);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="grid grid-cols-9 gap-px rounded-xl border-2 border-slate-800 bg-slate-800 p-1 shadow-lg">
        {current.map((val, i) => {
          const row = Math.floor(i / 9);
          const col = i % 9;
          const isFixed = initial[i] !== 0;
          const isSelected = selected === i;
          const hasConflict = conflictIndices?.has(i);
          const thickRight = col === 2 || col === 5;
          const thickBottom = row === 2 || row === 5;

          return (
            <button
              key={i}
              type="button"
              disabled={readOnly || isFixed}
              onClick={() => onSelect(i)}
              className={cn(
                "flex aspect-square items-center justify-center text-lg font-bold transition sm:text-xl",
                "bg-white",
                thickRight && "border-r-2 border-slate-800",
                thickBottom && "border-b-2 border-slate-800",
                isSelected && "ring-2 ring-inset ring-cyan-500",
                isFixed && "bg-slate-100 text-slate-900",
                !isFixed && !readOnly && "hover:bg-cyan-50",
                hasConflict && "bg-red-50 text-red-700"
              )}
            >
              {val > 0 ? val : ""}
            </button>
          );
        })}
      </div>

      {!readOnly && selected !== null && initial[selected] === 0 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onSetValue(selected, n)}
              className="rounded-xl border border-slate-200 bg-white py-2.5 text-lg font-bold text-slate-800 shadow-sm active:scale-95"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSetValue(selected, 0)}
            className="col-span-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export function getConflictIndices(grid: Grid): Set<number> {
  const conflicts = new Set<number>();
  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v === 0) continue;
    const row = Math.floor(i / 9);
    const col = i % 9;
    for (let c = 0; c < 9; c++) {
      const j = row * 9 + c;
      if (j !== i && grid[j] === v) conflicts.add(i);
    }
    for (let r = 0; r < 9; r++) {
      const j = r * 9 + col;
      if (j !== i && grid[j] === v) conflicts.add(i);
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        const j = r * 9 + c;
        if (j !== i && grid[j] === v) conflicts.add(i);
      }
    }
  }
  return conflicts;
}
