import { find, type Board } from '@src/core/board/board';

export const SAVE_VERSION = 1;

const SAVE_KEY = 'mini-puzzle:save';

export type SaveGrid = {
  cols: number;
  rows: number;
};

export type SaveCamera = {
  x: number;
  y: number;
  zoom: number;
};

export type SaveData = {
  version: number;
  image_id: number;
  image_added: number;
  grid: SaveGrid;
  pieces: number[];
  parent: number[];
  camera: SaveCamera;
  moves: number;
  elapsed_ms: number;
  solved: boolean;
  target: boolean;
  debug_hud: number;
  saved_at: number;
};

export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const is_number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const is_number_array = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(item => typeof item === 'number' && Number.isFinite(item));

const is_save_data = (value: unknown): value is SaveData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;
  const grid = data.grid as Record<string, unknown> | null;
  const camera = data.camera as Record<string, unknown> | null;

  return (
    data.version === SAVE_VERSION &&
    is_number(data.image_id) &&
    is_number(data.image_added) &&
    typeof grid === 'object' &&
    grid !== null &&
    is_number(grid.cols) &&
    is_number(grid.rows) &&
    is_number_array(data.pieces) &&
    is_number_array(data.parent) &&
    typeof camera === 'object' &&
    camera !== null &&
    is_number(camera.x) &&
    is_number(camera.y) &&
    is_number(camera.zoom) &&
    is_number(data.moves) &&
    is_number(data.elapsed_ms) &&
    typeof data.solved === 'boolean' &&
    typeof data.target === 'boolean' &&
    is_number(data.debug_hud) &&
    is_number(data.saved_at)
  );
};

export const read_save = (storage: SaveStorage): SaveData | null => {
  try {
    const raw = storage.getItem(SAVE_KEY);

    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    return is_save_data(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const write_save = (storage: SaveStorage, data: SaveData): void => {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable; keep the running game unaffected
  }
};

export const clear_save = (storage: SaveStorage): void => {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
};

export const snapshot_board = (board: Board): { pieces: number[]; parent: number[] } => {
  const pieces: number[] = [];

  for (const piece of board.pieces) {
    pieces.push(piece.x, piece.y, piece.locked ? 1 : 0);
  }

  return { pieces, parent: Array.from(board.parent) };
};

const valid_group_tree = (parent: number[], count: number): boolean => {
  for (let i = 0; i < count; i++) {
    let cursor = i;
    let steps = 0;

    while (parent[cursor] !== cursor) {
      cursor = parent[cursor];
      steps += 1;

      if (steps > count) {
        return false;
      }
    }
  }

  return true;
};

export const restore_board = (board: Board, pieces: number[], parent: number[]): boolean => {
  const count = board.pieces.length;

  if (pieces.length !== count * 3 || parent.length !== count) {
    return false;
  }

  for (const value of parent) {
    if (!Number.isInteger(value) || value < 0 || value >= count) {
      return false;
    }
  }

  if (!valid_group_tree(parent, count)) {
    return false;
  }

  for (let i = 0; i < count; i++) {
    const x = pieces[i * 3];
    const y = pieces[i * 3 + 1];
    const locked = pieces[i * 3 + 2];

    if (!is_number(x) || !is_number(y) || (locked !== 0 && locked !== 1)) {
      return false;
    }

    board.pieces[i].x = x;
    board.pieces[i].y = y;
    board.pieces[i].locked = locked === 1;
  }

  for (let i = 0; i < count; i++) {
    board.parent[i] = parent[i];
    board.size[i] = 0;
  }

  for (let i = 0; i < count; i++) {
    const root = find(board, i);

    board.size[root] += 1;
    board.pieces[i].group = root;
  }

  board.version += 1;

  return true;
};
