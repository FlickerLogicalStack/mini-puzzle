import type { GridSpec } from '@src/core/board/board.layout';

export const PIECE_COUNTS = [6, 12, 24, 48, 80, 120, 180, 240, 320, 500];
export const DEFAULT_PIECE_COUNT = 24;
export const DEFAULT_GRID: GridSpec = { cols: 3, rows: 3 };
export const MAX_GRID_SIDE = 24;

// Picks cols/rows so pieces stay as square as possible for the image aspect ratio.
export const grid_for_count = (width: number, height: number, count: number): GridSpec => {
  const safe_count = Math.max(1, Math.round(count));
  const ratio = width > 0 && height > 0 ? width / height : 1;
  const max_side = Math.min(MAX_GRID_SIDE, safe_count);

  let best_cols = 1;
  let best_rows = safe_count;
  let best_score = Infinity;

  for (let cols = 1; cols <= max_side; cols++) {
    const rows = Math.max(1, Math.round(safe_count / cols));
    const piece_ratio = (ratio * rows) / cols;
    const aspect_score = Math.abs(Math.log(piece_ratio));
    const count_score = Math.abs(cols * rows - safe_count) / safe_count;
    const score = aspect_score + count_score * 0.25;

    if (score < best_score) {
      best_score = score;
      best_cols = cols;
      best_rows = rows;
    }
  }

  return { cols: best_cols, rows: best_rows };
};

export const grid_label = (grid: GridSpec): string => `${grid.cols} × ${grid.rows}`;
