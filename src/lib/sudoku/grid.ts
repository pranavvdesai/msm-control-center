export type Grid = number[];

export function emptyGrid(): Grid {
  return Array(81).fill(0);
}

export function parseGrid(str: string): Grid {
  if (!str || str.length !== 81) return emptyGrid();
  return str.split("").map((c) => parseInt(c, 10) || 0);
}

export function serializeGrid(grid: Grid): string {
  return grid.map((n) => String(n)).join("");
}

export function cloneGrid(grid: Grid): Grid {
  return [...grid];
}

export function cellIndex(row: number, col: number) {
  return row * 9 + col;
}

export function rowCol(index: number) {
  return { row: Math.floor(index / 9), col: index % 9 };
}

export function isValidPlacement(grid: Grid, index: number, value: number): boolean {
  if (value < 1 || value > 9) return false;
  const { row, col } = rowCol(index);
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[cellIndex(row, c)] === value) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[cellIndex(r, col)] === value) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      const i = cellIndex(r, c);
      if (i !== index && grid[i] === value) return false;
    }
  }
  return true;
}

export function gridComplete(grid: Grid): boolean {
  return grid.every((n) => n >= 1 && n <= 9);
}

export function gridsEqual(a: Grid, b: Grid) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function countClues(grid: Grid) {
  return grid.filter((n) => n !== 0).length;
}
