export type GridSpec = {
  cols: number;
  rows: number;
};

export const GRID_OPTIONS: GridSpec[] = [
  { cols: 3, rows: 3 },
  { cols: 4, rows: 3 },
  { cols: 5, rows: 4 },
  { cols: 6, rows: 4 },
  { cols: 8, rows: 6 },
  { cols: 10, rows: 8 },
];

export const MIN_PIECE_PX = 130;

export const max_grid_side = (source_width: number, source_height: number): number => {
  const shortest = Math.max(1, Math.min(source_width, source_height));

  return Math.max(1, Math.floor(shortest / MIN_PIECE_PX));
};

export const clamp_grid = (source_width: number, source_height: number, grid: GridSpec): GridSpec => {
  const limit = max_grid_side(source_width, source_height);
  const longest = Math.max(grid.cols, grid.rows);

  if (longest <= limit) {
    return { cols: grid.cols, rows: grid.rows };
  }

  const scale = limit / longest;

  return {
    cols: Math.max(1, Math.round(grid.cols * scale)),
    rows: Math.max(1, Math.round(grid.rows * scale)),
  };
};
