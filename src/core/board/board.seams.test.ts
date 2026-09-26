import { describe, expect, test } from 'bun:test';

import { create_board, merge } from './board';
import { piece_edges } from './board.geometry';
import { build_seams } from './board.seams';

const SOURCE = {} as CanvasImageSource;

const make_board = (cols: number, rows: number) => create_board(SOURCE, 0, 0, 300, 300, cols, rows, () => 0.5);

describe('build_seams', () => {
  test('every interior seam has exactly one connector', () => {
    const seams = build_seams(4, 3, 120, 90, () => 0.5);

    expect(seams.h_seams.length).toBe((4 - 1) * 3);
    expect(seams.v_seams.length).toBe(4 * (3 - 1));

    for (const seam of [...seams.h_seams, ...seams.v_seams]) {
      expect(seam.connectors.length).toBe(1);
    }
  });
});

describe('piece connector sides', () => {
  test('corners have 2, borders 3, interior 4', () => {
    const board = make_board(4, 3);

    for (const piece of board.pieces) {
      const edges = piece_edges(board, piece);
      const with_connector = edges.filter(edge => edge.points.length > 2).length;

      const border_sides =
        (piece.col === 0 ? 1 : 0) +
        (piece.col === board.cols - 1 ? 1 : 0) +
        (piece.row === 0 ? 1 : 0) +
        (piece.row === board.rows - 1 ? 1 : 0);

      expect(with_connector).toBe(4 - border_sides);
    }
  });

  test('a single-piece board has no connectors', () => {
    const board = make_board(1, 1);
    const edges = piece_edges(board, board.pieces[0]);

    expect(edges.every(edge => edge.points.length === 2)).toBe(true);
  });
});

describe('board connector bleed / version', () => {
  test('caches bleed and bumps version on merge', () => {
    const board = create_board(SOURCE, 0, 0, 300, 300, 3, 3, () => 0.5);

    expect(board.bleed).toBeGreaterThan(0);

    const before = board.version;

    merge(board, 0, 1);

    expect(board.version).toBe(before + 1);
  });
});
