import { describe, expect, test } from 'bun:test';

import { board_bounds, create_board, scatter_board } from './board';

const SOURCE = {} as CanvasImageSource;

const seeded = (start = 1) => {
  let seed = start >>> 0;

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;

    return seed / 4294967296;
  };
};

const make = (cols: number, rows: number) => create_board(SOURCE, 0, 0, 300, 300, cols, rows, () => 0.5);

const overlaps = (ax: number, ay: number, bx: number, by: number, pw: number, ph: number) =>
  ax < bx + pw && ax + pw > bx && ay < by + ph && ay + ph > by;

describe('scatter_board', () => {
  test('keeps every piece off the board', () => {
    const board = make(3, 3);

    scatter_board(board, seeded());

    const bleed = board.bleed;

    for (const piece of board.pieces) {
      expect(overlaps(piece.x, piece.y, 0, 0, board.pw, board.ph)).toBe(false);
      expect(
        overlaps(piece.x - bleed, piece.y - bleed, 0, 0, board.pw + bleed * 2, board.ph + bleed * 2),
      ).toBe(false);
    }
  });

  test('pieces do not overlap each other', () => {
    const board = make(4, 3);

    scatter_board(board, seeded(7));

    for (let i = 0; i < board.pieces.length; i++) {
      for (let j = i + 1; j < board.pieces.length; j++) {
        const a = board.pieces[i];
        const b = board.pieces[j];

        expect(overlaps(a.x, a.y, b.x, b.y, board.pw, board.ph)).toBe(false);
      }
    }
  });

  test('spreads outside the board bounds and resets groups', () => {
    const board = make(3, 3);

    scatter_board(board, seeded(3));

    const bounds = board_bounds(board);

    expect(bounds.min_x).toBeLessThan(0);
    expect(bounds.min_y).toBeLessThan(0);

    for (let i = 0; i < board.pieces.length; i++) {
      expect(board.parent[i]).toBe(i);
      expect(board.size[i]).toBe(1);
    }
  });

  test('handles a dense grid', () => {
    const board = make(10, 8);

    scatter_board(board, seeded(11));

    expect(board.pieces.length).toBe(80);

    const bleed = board.bleed;

    for (const piece of board.pieces) {
      expect(overlaps(piece.x, piece.y, 0, 0, board.pw, board.ph)).toBe(false);
      expect(
        overlaps(piece.x - bleed, piece.y - bleed, 0, 0, board.pw + bleed * 2, board.ph + bleed * 2),
      ).toBe(false);
    }
  });
});
