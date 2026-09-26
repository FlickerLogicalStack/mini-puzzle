import { describe, expect, test } from 'bun:test';

import { create_board, group_size } from './board';
import { group_at_home, snap_tolerance, try_snap } from './board.groups';

const SOURCE = {} as CanvasImageSource;

const make_board = (cols = 3, rows = 3) => create_board(SOURCE, 0, 0, 300, 300, cols, rows);

describe('snap_tolerance', () => {
  test('is a fraction of the smaller piece side', () => {
    const board = make_board(3, 3);

    expect(snap_tolerance(board)).toBeCloseTo(0.3 * 100, 6);
  });
});

describe('try_snap', () => {
  test('merges two correctly adjacent pieces and aligns them', () => {
    const board = make_board(3, 3);
    const tol = snap_tolerance(board);

    // piece 1 (col 1, row 0) sits close to its home; piece 0 (col 0, row 0) is offset by 1px.
    board.pieces[1].x = 100 + 1;
    board.pieces[1].y = 0;

    // scatter the rest so only the 0/1 pair can snap together
    for (let i = 2; i < board.pieces.length; i++) {
      board.pieces[i].x += 1000;
      board.pieces[i].y += 1000;
    }

    const result = try_snap(board, 1, tol);

    expect(result.merged).toBe(true);
    expect(group_size(board, 0)).toBe(2);
    expect(board.pieces[0].x).toBe(0);
    expect(board.pieces[1].x).toBe(100);
  });

  test('does not merge when the relative offset is wrong', () => {
    const board = make_board(3, 3);
    const tol = snap_tolerance(board);

    board.pieces[1].x = 100;
    board.pieces[1].y = 60; // way off vertically

    const result = try_snap(board, 1, tol);

    expect(result.merged).toBe(false);
    expect(group_size(board, 1)).toBe(1);
  });

  test('chain-merges a row of three', () => {
    const board = make_board(3, 1);
    const tol = snap_tolerance(board);

    board.pieces[1].x = 100;
    board.pieces[2].x = 200 + 2;

    const result = try_snap(board, 1, tol);

    expect(result.merged).toBe(true);
    expect(group_size(board, 1)).toBe(3);
  });

  test('locks a group that is exactly at home', () => {
    const board = make_board(2, 2);
    const tol = snap_tolerance(board);

    board.pieces[1].x = 150 + 1;
    board.pieces[1].y = 1;

    const result = try_snap(board, 0, tol);

    expect(result.locked).toBe(true);
    expect(group_at_home(board, 0, tol)).toBe(true);
    expect(board.pieces[0].locked).toBe(true);
    expect(board.pieces[1].locked).toBe(true);
    expect(board.pieces[1].x).toBe(150);
    expect(board.pieces[1].y).toBe(0);
  });

  test('does not lock a group that is not at home', () => {
    const board = make_board(2, 2);
    const tol = snap_tolerance(board);

    board.pieces[0].x = 60;

    const result = try_snap(board, 0, tol);

    expect(result.locked).toBe(false);
    expect(board.pieces[0].locked).toBe(false);
  });
});
