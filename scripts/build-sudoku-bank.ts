import { writeFileSync } from "fs";
import { mulberry32 } from "../src/lib/play/seeded-rng";
import { cloneGrid, countClues, parseGrid, serializeGrid, type Grid } from "../src/lib/sudoku/grid";

const BASE = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
const CLUES = 18;

function shuffledDigits(rand: () => number) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

function relabel(grid: Grid, map: number[]) {
  return grid.map((n) => (n === 0 ? 0 : map[n - 1]));
}

const bank: Array<{ initial: string; solution: string }> = [];

for (let seed = 0; bank.length < 45; seed++) {
  const rand = mulberry32(seed);
  const map = shuffledDigits(rand);
  const solution = relabel(parseGrid(BASE), map);
  const puzzle = cloneGrid(solution);
  const order = Array.from({ length: 81 }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  let removed = 0;
  for (const idx of order) {
    if (81 - removed <= CLUES) break;
    puzzle[idx] = 0;
    removed++;
  }
  const initial = serializeGrid(puzzle);
  if (bank.some((b) => b.initial === initial)) continue;
  bank.push({ initial, solution: serializeGrid(solution) });
}

writeFileSync(
  "src/lib/sudoku/puzzle-bank.ts",
  `/** Expert daily sudoku bank (${CLUES} clues) */\nexport const SUDOKU_PUZZLE_BANK = ${JSON.stringify(bank, null, 2)} as const;\n`
);
console.log(`Wrote ${bank.length} puzzles in ${CLUES} clues`);
