import { hashString, mulberry32 } from "@/lib/play/seeded-rng";
import { countClues, parseGrid, serializeGrid, type Grid } from "./grid";
import { SUDOKU_PUZZLE_BANK } from "./puzzle-bank";

function shuffledDigits(rand: () => number): number[] {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

function relabel(grid: Grid, map: number[]): Grid {
  return grid.map((n) => (n === 0 ? 0 : map[n - 1]));
}

export type GeneratedSudoku = {
  initialGrid: string;
  solution: string;
  clueCount: number;
  difficulty: "expert";
};

export function generateDailySudoku(dateStr: string): GeneratedSudoku {
  const seed = hashString(`sudoku:${dateStr}`);
  const index = seed % SUDOKU_PUZZLE_BANK.length;
  const entry = SUDOKU_PUZZLE_BANK[index];
  const rand = mulberry32(seed);
  const map = shuffledDigits(rand);

  const initial = relabel(parseGrid(entry.initial), map);
  const solution = relabel(parseGrid(entry.solution), map);

  return {
    initialGrid: serializeGrid(initial),
    solution: serializeGrid(solution),
    clueCount: countClues(initial),
    difficulty: "expert",
  };
}

export function sudokuDailyScore(durationMs: number, mistakes: number) {
  const base = Math.max(50, 3000 - Math.floor(durationMs / 100));
  return Math.max(0, base - mistakes * 25);
}
