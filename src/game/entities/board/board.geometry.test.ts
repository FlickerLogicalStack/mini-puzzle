import { describe, expect, test } from 'bun:test';

import { create_board, merge, type Board } from './board';
import {
  edge_connected,
  hit_test,
  max_connector_depth,
  piece_edges,
  piece_polygon,
  point_in_polygon,
} from './board.geometry';
import { build_seams, type Seam } from './board.seams';

const SOURCE = {} as CanvasImageSource;

const make_board = (cols = 2, rows = 2): Board => create_board(SOURCE, 0, 0, 300, 300, cols, rows, () => 0.5);

const clear_seams = (board: Board) => {
  for (let i = 0; i < board.h_seams.length; i++) {
    board.h_seams[i] = { side: 1, connectors: [] };
  }

  for (let i = 0; i < board.v_seams.length; i++) {
    board.v_seams[i] = { side: 1, connectors: [] };
  }
};

const contains = (board: Board, id: number, x: number, y: number) => {
  const piece = board.pieces[id];

  return point_in_polygon(piece_polygon(board, piece), x - piece.x, y - piece.y);
};

describe('piece_polygon', () => {
  test('without connectors it is a plain rectangle', () => {
    const board = make_board(2, 2);

    clear_seams(board);

    expect(piece_polygon(board, board.pieces[0])).toEqual([0, 0, 150, 0, 150, 150, 0, 150]);
  });

  test('a seam connector is a bump on one piece and a dent on the other', () => {
    const board = make_board(2, 2);

    clear_seams(board);
    board.h_seams[0] = { side: 1, connectors: [{ shape: 'rect', t: 0.5, width: 30, depth: 20 }] };

    expect(max_connector_depth(board)).toBe(20);

    expect(contains(board, 0, 170, 75)).toBe(true);
    expect(contains(board, 1, 170, 75)).toBe(false);
    expect(contains(board, 1, 160, 75)).toBe(false);
    expect(contains(board, 1, 190, 75)).toBe(true);
  });

  test('covers the board exactly once with deterministic connectors', () => {
    const board = make_board(2, 2);

    board.h_seams[0] = { side: 1, connectors: [{ shape: 'rect', t: 0.5, width: 30, depth: 20 }] };
    board.h_seams[1] = { side: -1, connectors: [{ shape: 'tri', t: 0.5, width: 24, depth: 14 }] };
    board.v_seams[0] = { side: 1, connectors: [{ shape: 'tri', t: 0.5, width: 24, depth: 14 }] };
    board.v_seams[1] = { side: -1, connectors: [{ shape: 'rect', t: 0.5, width: 30, depth: 20 }] };

    let checked = 0;
    let on_boundary = 0;

    for (let x = 3.1; x < 300; x += 6.7) {
      for (let y = 5.3; y < 300; y += 6.7) {
        let hits = 0;

        for (let id = 0; id < board.pieces.length; id++) {
          if (contains(board, id, x, y)) {
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
    expect(on_boundary).toBeLessThan(checked * 0.01);
  });
});

describe('hit_test', () => {
  test('finds the topmost piece inside a bump region', () => {
    const board = make_board(2, 2);

    clear_seams(board);
    board.h_seams[0] = { side: 1, connectors: [{ shape: 'rect', t: 0.5, width: 30, depth: 20 }] };

    expect(hit_test(board, 170, 75, [0, 1, 2, 3])?.id).toBe(0);
  });
});

describe('build_seams', () => {
  test('produces non-overlapping connectors within clamps', () => {
    let seed = 1;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;

      return seed / 2147483648;
    };

    const pw = 120;
    const ph = 90;
    const seams = build_seams(4, 3, pw, ph, rand);

    expect(seams.h_seams.length).toBe((4 - 1) * 3);
    expect(seams.v_seams.length).toBe(4 * (3 - 1));

    const check = (seam: Seam, length: number) => {
      let previous_end = -Infinity;

      for (const connector of seam.connectors) {
        const start = connector.t * length - connector.width / 2;
        const end = connector.t * length + connector.width / 2;

        expect(start).toBeGreaterThanOrEqual(-1e-6);
        expect(end).toBeLessThanOrEqual(length + 1e-6);
        expect(start).toBeGreaterThan(previous_end - 1e-6);
        expect(connector.depth).toBeLessThanOrEqual(Math.min(pw, ph) * 0.25 + 1e-6);

        previous_end = end;
      }
    };

    for (const seam of seams.h_seams) {
      check(seam, ph);
    }

    for (const seam of seams.v_seams) {
      check(seam, pw);
    }
  });
});

describe('piece_edges / edge_connected', () => {
  test('edges flatten to the same polygon', () => {
    const board = make_board(2, 2);

    clear_seams(board);
    board.h_seams[0] = { side: 1, connectors: [{ shape: 'rect', t: 0.5, width: 30, depth: 20 }] };

    const piece = board.pieces[0];
    const flat = piece_edges(board, piece).flatMap(edge => edge.points);

    expect(flat).toEqual(piece_polygon(board, piece));
  });

  test('connected edges follow the union-find group', () => {
    const board = make_board(2, 2);

    clear_seams(board);

    const a = board.pieces[0];
    const b = board.pieces[1];

    expect(edge_connected(board, a, 'right')).toBe(false);
    expect(edge_connected(board, a, 'top')).toBe(false);

    merge(board, a.id, b.id);

    expect(edge_connected(board, a, 'right')).toBe(true);
    expect(edge_connected(board, b, 'left')).toBe(true);
    expect(edge_connected(board, b, 'bottom')).toBe(false);
  });
});
