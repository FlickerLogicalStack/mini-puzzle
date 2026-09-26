import { describe, expect, test } from 'bun:test';

import { create_board, type Board } from './board';
import { piece_polygon, point_in_polygon } from './board.geometry';

const SOURCE = {} as CanvasImageSource;

const make_board = (): Board => create_board(SOURCE, 0, 0, 300, 300, 2, 2, () => 0.5);

// one rectangle + one triangle per seam => the previously broken multi-connector case
const two_connectors = (side: 1 | -1) => ({
  side,
  connectors: [
    { shape: 'rect' as const, t: 0.3, width: 26, depth: 18 },
    { shape: 'tri' as const, t: 0.7, width: 24, depth: 16 },
  ],
});

const with_connectors = (): Board => {
  const board = make_board();

  board.h_seams[0] = two_connectors(1);
  board.h_seams[1] = two_connectors(-1);
  board.v_seams[0] = two_connectors(1);
  board.v_seams[1] = two_connectors(-1);

  return board;
};

// x-coordinates of the detour base points lying on the horizontal seam at local y = seam_y
const seam_xs = (points: number[], seam_y: number): number[] => {
  const xs: number[] = [];

  for (let i = 0; i < points.length; i += 2) {
    if (Math.abs(points[i + 1] - seam_y) < 1e-6 && points[i] > 1e-6 && points[i] < 150 - 1e-6) {
      xs.push(points[i]);
    }
  }

  return xs;
};

describe('multi-connector seams', () => {
  test('reverse traversal emits connector points monotonically', () => {
    const board = with_connectors();

    // piece (0,0): bottom edge is the horizontal seam, traversed right -> left (reverse).
    const bottom = seam_xs(piece_polygon(board, board.pieces[0]), 150);

    expect(bottom.length).toBeGreaterThanOrEqual(4);

    for (let i = 1; i < bottom.length; i++) {
      expect(bottom[i]).toBeLessThanOrEqual(bottom[i - 1] + 1e-6);
    }

    // piece (col 0, row 1): top edge is the same seam, traversed left -> right.
    const top = seam_xs(piece_polygon(board, board.pieces[2]), 0);

    expect(top.length).toBeGreaterThanOrEqual(4);

    for (let i = 1; i < top.length; i++) {
      expect(top[i]).toBeGreaterThanOrEqual(top[i - 1] - 1e-6);
    }
  });

  test('multi-connector board still covers exactly once', () => {
    const board = with_connectors();

    let checked = 0;
    let on_boundary = 0;

    for (let x = 3.1; x < 300; x += 5.9) {
      for (let y = 5.3; y < 300; y += 5.9) {
        let hits = 0;

        for (let id = 0; id < board.pieces.length; id++) {
          const piece = board.pieces[id];

          if (point_in_polygon(piece_polygon(board, piece), x - piece.x, y - piece.y)) {
            hits += 1;
          }
        }

        expect(hits).toBeLessThanOrEqual(1);

        if (hits === 0) {
          on_boundary += 1;
        }

        checked += 1;
      }
    }

    expect(checked).toBeGreaterThan(1000);
    expect(on_boundary).toBeLessThan(checked * 0.02);
  });
});
