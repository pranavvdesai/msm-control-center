import { hashString } from "@/lib/play/seeded-rng";
import { countClues } from "./grid";
import { generateDailySudoku } from "./generator";

export type SudokuSource = "mtsudoku" | "local";

export type FetchedSudoku = {
  initialGrid: string;
  solution: string;
  clueCount: number;
  difficulty: string;
  source: SudokuSource;
  seed: number | null;
};

type MtSudokuResponse = {
  puzzle: string;
  solution: string;
  difficulty: string;
  seed: number;
};

function dateSeed(dateStr: string) {
  return hashString(`msm-sudoku:${dateStr}`) % 4294967295;
}

export async function fetchMtSudoku(dateStr: string): Promise<FetchedSudoku | null> {
  const seed = dateSeed(dateStr);
  const url = `https://api.mtsudoku.com/v1/generate?mode=classic&difficulty=master&seed=${seed}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as MtSudokuResponse;
    if (!data.puzzle || !data.solution || data.puzzle.length !== 81 || data.solution.length !== 81) {
      return null;
    }

    return {
      initialGrid: data.puzzle,
      solution: data.solution,
      clueCount: countClues(data.puzzle.split("").map((c) => parseInt(c, 10) || 0)),
      difficulty: data.difficulty || "master",
      source: "mtsudoku",
      seed: data.seed ?? seed,
    };
  } catch {
    return null;
  }
}

export async function resolveDailySudoku(dateStr: string): Promise<FetchedSudoku> {
  const fromApi = await fetchMtSudoku(dateStr);
  if (fromApi) return fromApi;

  const local = generateDailySudoku(dateStr);
  return {
    initialGrid: local.initialGrid,
    solution: local.solution,
    clueCount: local.clueCount,
    difficulty: local.difficulty,
    source: "local",
    seed: null,
  };
}

export function sudokuSourceLabel(source: string, difficulty: string) {
  if (source === "mtsudoku") return `Sudoku Mountain · ${difficulty}`;
  return `Expert · ${difficulty}`;
}
