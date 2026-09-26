import { GRID_OPTIONS, type GridSpec } from '../board/board.layout';

export const DEFAULT_GRID: GridSpec = { cols: 3, rows: 3 };

export const parse_grid = (value: string): GridSpec | null => {
  const match = /^(\d+)x(\d+)$/.exec(value);

  if (!match) {
    return null;
  }

  const cols = Number(match[1]);
  const rows = Number(match[2]);

  if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols < 1 || rows < 1) {
    return null;
  }

  return { cols, rows };
};

export const grid_value = (grid: GridSpec): string => `${grid.cols}x${grid.rows}`;

export { GRID_OPTIONS };
