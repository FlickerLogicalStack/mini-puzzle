import { describe, expect, test } from 'bun:test';

import { create_board } from './board';
import { group_home_rect, group_origin } from './board.group.path';

const SOURCE = {} as CanvasImageSource;

const make_board = () => create_board(SOURCE, 0, 0, 300, 300, 3, 3, () => 0.5);

describe('group_home_rect', () => {
  test('covers the bounding home cells of the group', () => {
    const board = make_board();
    const members = [board.pieces[0], board.pieces[1], board.pieces[3], board.pieces[4]];

    expect(group_home_rect(board, members)).toEqual({ home_x: 0, home_y: 0, home_w: 200, home_h: 200 });
  });
});

describe('group_origin', () => {
  test('follows the pieces and ignores the home grid', () => {
    const board = make_board();
    const members = [board.pieces[4], board.pieces[5]];

    members[0].x += 40;
    members[0].y -= 15;

    expect(group_origin(members)).toEqual({ x: 140, y: 85 });
    expect(group_home_rect(board, members)).toEqual({ home_x: 100, home_y: 100, home_w: 200, home_h: 100 });
  });
});
