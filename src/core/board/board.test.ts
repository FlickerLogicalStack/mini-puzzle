import { describe, expect, test } from 'bun:test';

import { create_board, drag_group, find, group_size, merge, piece_at, reset_groups, shuffle_board, win } from './board';
import { hit_test, point_in_polygon } from './board.geometry';

const SOURCE = {} as CanvasImageSource;

const make_board = (cols = 3, rows = 3) => create_board(SOURCE, 0, 0, 300, 300, cols, rows, () => 0.5);

describe('create_board', () => {
  test('builds the grid and identities', () => {
    const board = make_board(3, 2);

    expect(board.pieces.length).toBe(6);
    expect(board.pw).toBe(100);
    expect(board.ph).toBe(150);
    expect(board.width).toBe(300);
    expect(board.height).toBe(300);

    for (let i = 0; i < 6; i++) {
      expect(find(board, i)).toBe(i);
      expect(board.size[i]).toBe(1);
    }

    expect(win(board)).toBe(false);
  });

  test('home positions match the grid', () => {
    const board = make_board(3, 2);
    const piece = piece_at(board, 2, 1);

    expect(piece).toBeDefined();
    expect(piece!.x).toBe(200);
    expect(piece!.y).toBe(150);
  });

  test('piece_at rejects out of bounds', () => {
    const board = make_board(2, 2);

    expect(piece_at(board, -1, 0)).toBeUndefined();
    expect(piece_at(board, 0, -1)).toBeUndefined();
    expect(piece_at(board, 2, 0)).toBeUndefined();
    expect(piece_at(board, 0, 2)).toBeUndefined();
  });
});

describe('groups', () => {
  test('merge unions and reports size', () => {
    const board = make_board(3, 3);
    const group = merge(board, 0, 1);

    expect(find(board, 1)).toBe(group);
    expect(group_size(board, 0)).toBe(2);

    const bigger = merge(board, group, 2);

    expect(group_size(board, 0)).toBe(3);
    expect(find(board, 2)).toBe(bigger);
  });

  test('drag_group moves only its members', () => {
    const board = make_board(3, 3);
    const group = merge(board, 0, 1);

    drag_group(board, group, 10, -5);

    expect(board.pieces[0].x).toBe(10);
    expect(board.pieces[1].x).toBe(110);
    expect(board.pieces[2].x).toBe(200);
    expect(board.pieces[2].y).toBe(0);
  });

  test('reset_groups restores identities', () => {
    const board = make_board(3, 3);

    merge(board, 0, 1);
    reset_groups(board);

    expect(find(board, 1)).toBe(1);
    expect(group_size(board, 0)).toBe(1);
  });
});

describe('shuffle_board', () => {
  test('scatters pieces and resets groups, deterministically with rand', () => {
    const board = make_board(3, 3);
    let value = 0;

    shuffle_board(board, 50, () => {
      value = (value + 0.25) % 1;
      return value;
    });

    expect(find(board, 5)).toBe(5);
    expect(win(board)).toBe(false);

    for (const piece of board.pieces) {
      expect(piece.x).toBeGreaterThanOrEqual(-50);
      expect(piece.x).toBeLessThanOrEqual(350);
      expect(piece.y).toBeGreaterThanOrEqual(-50);
      expect(piece.y).toBeLessThanOrEqual(350);
    }
  });

  test('win when every piece is in one group', () => {
    const board = make_board(2, 2);
    let group = 0;

    for (let i = 1; i < board.pieces.length; i++) {
      group = merge(board, group, i);
    }

    expect(win(board)).toBe(true);
  });
});

describe('geometry', () => {
  test('point_in_polygon inside/outside a rectangle', () => {
    const rect = [0, 0, 10, 0, 10, 10, 0, 10];

    expect(point_in_polygon(rect, 5, 5)).toBe(true);
    expect(point_in_polygon(rect, -1, 5)).toBe(false);
    expect(point_in_polygon(rect, 5, 11)).toBe(false);
  });

  test('hit_test returns the topmost piece', () => {
    const board = make_board(2, 1);
    const order = [0, 1];

    board.pieces[1].x = 0;
    board.pieces[1].y = 0;

    const hit = hit_test(board, 10, 10, order);

    expect(hit?.id).toBe(1);

    board.pieces[1].x = board.pw;

    expect(hit_test(board, 10, 10, order)?.id).toBe(0);
    expect(hit_test(board, 500, 10, order)).toBeNull();
  });
});
