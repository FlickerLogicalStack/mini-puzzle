import { describe, expect, test } from 'bun:test';

import { DEFAULT_PIECE_COUNT, PIECE_COUNTS, grid_for_count } from './grid';

describe('grid_for_count', () => {
  test('square image with a square count is square', () => {
    expect(grid_for_count(1000, 1000, 100)).toEqual({ cols: 10, rows: 10 });
  });

  test('landscape keeps pieces near square', () => {
    const grid = grid_for_count(1920, 1080, 48);
    const piece_ratio = (1920 / grid.cols) / (1080 / grid.rows);

    expect(piece_ratio).toBeGreaterThan(0.8);
    expect(piece_ratio).toBeLessThan(1.25);
    expect(grid.cols * grid.rows).toBeGreaterThanOrEqual(40);
  });

  test('portrait mirrors landscape', () => {
    const grid = grid_for_count(1080, 1920, 48);
    const piece_ratio = (1080 / grid.cols) / (1920 / grid.rows);

    expect(piece_ratio).toBeGreaterThan(0.8);
    expect(piece_ratio).toBeLessThan(1.25);
  });

  test('handles zero size and a single piece', () => {
    expect(grid_for_count(0, 0, 1)).toEqual({ cols: 1, rows: 1 });
  });

  test('default count is one of the options', () => {
    expect(PIECE_COUNTS).toContain(DEFAULT_PIECE_COUNT);
  });
});
