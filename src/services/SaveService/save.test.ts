import { describe, expect, test } from 'bun:test';

import { create_board, find, group_size, merge } from '@src/core/board/board';
import {
  SAVE_VERSION,
  read_save,
  restore_board,
  snapshot_board,
  write_save,
  type SaveData,
  type SaveStorage,
} from './save';

const SOURCE = {} as CanvasImageSource;

const make = (cols = 2, rows = 2) => create_board(SOURCE, 0, 0, 200, 200, cols, rows, () => 0.5);

const fake_storage = (): SaveStorage => {
  const map = new Map<string, string>();

  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: key => {
      map.delete(key);
    },
  };
};

const make_data = (): SaveData => ({
  version: SAVE_VERSION,
  image_id: 3,
  image_added: 123,
  grid: { cols: 2, rows: 2 },
  pieces: [0, 0, 0, 100, 0, 0, 0, 100, 0, 100, 100, 0],
  parent: [0, 0, 2, 3],
  camera: { x: 5, y: 6, zoom: 1.5 },
  moves: 4,
  elapsed_ms: 1000,
  solved: false,
  target: true,
  debug_hud: 1,
  saved_at: 42,
});

describe('snapshot_board / restore_board', () => {
  test('round trips positions, lock state and groups', () => {
    const board = make(2, 2);

    board.pieces[0].x = 10;
    board.pieces[0].y = 20;
    board.pieces[3].locked = true;
    merge(board, 0, 1);

    const { pieces, parent } = snapshot_board(board);
    const restored = make(2, 2);

    expect(restore_board(restored, pieces, parent)).toBe(true);
    expect(restored.pieces[0].x).toBe(10);
    expect(restored.pieces[0].y).toBe(20);
    expect(restored.pieces[3].locked).toBe(true);
    expect(find(restored, 1)).toBe(find(restored, 0));
    expect(group_size(restored, 0)).toBe(2);
  });

  test('rejects malformed snapshots', () => {
    const board = make(2, 2);
    const { pieces, parent } = snapshot_board(board);

    expect(restore_board(board, [0, 0, 0], parent)).toBe(false);
    expect(restore_board(board, pieces, [0, 0, 9, 3])).toBe(false);
    expect(restore_board(board, pieces, [1, 0, 2, 3])).toBe(false);
  });
});

describe('read_save / write_save', () => {
  test('round trips valid data', () => {
    const storage = fake_storage();
    const data = make_data();

    write_save(storage, data);

    expect(read_save(storage)).toEqual(data);
  });

  test('returns null for missing, corrupt or incompatible data', () => {
    expect(read_save(fake_storage())).toBeNull();

    const corrupt: SaveStorage = { getItem: () => '{oops', setItem: () => {}, removeItem: () => {} };

    expect(read_save(corrupt)).toBeNull();

    const storage = fake_storage();

    write_save(storage, { ...make_data(), version: SAVE_VERSION + 1 });

    expect(read_save(storage)).toBeNull();
  });
});
