import { describe, expect, test } from 'bun:test';

import { clamp_grid, max_grid_side } from './board.layout';

describe('max_grid_side', () => {
  test('scales with the shortest source side', () => {
    expect(max_grid_side(526, 526)).toBe(4);
    expect(max_grid_side(3000, 2000)).toBe(15);
    expect(max_grid_side(100, 400)).toBe(1);
  });
});

describe('clamp_grid', () => {
  test('keeps a grid that fits', () => {
    expect(clamp_grid(526, 526, { cols: 3, rows: 3 })).toEqual({ cols: 3, rows: 3 });
  });

  test('shrinks a grid that is too fine', () => {
    expect(clamp_grid(526, 526, { cols: 5, rows: 4 })).toEqual({ cols: 4, rows: 3 });
    expect(clamp_grid(526, 526, { cols: 10, rows: 8 })).toEqual({ cols: 4, rows: 3 });
  });
});
