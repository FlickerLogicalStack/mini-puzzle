import { build_seams, type Seam } from './board.seams';

export type Piece = {
  id: number;
  col: number;
  row: number;
  group: number;
  x: number;
  y: number;
  locked: boolean;
};

export type Board = {
  cols: number;
  rows: number;
  pw: number;
  ph: number;
  width: number;
  height: number;
  source: CanvasImageSource;
  src_x: number;
  src_y: number;
  src_w: number;
  src_h: number;
  pieces: Piece[];
  parent: Int32Array;
  size: Int32Array;
  order: number[];
  h_seams: Seam[];
  v_seams: Seam[];
};

export const create_board = (
  source: CanvasImageSource,
  src_x: number,
  src_y: number,
  src_w: number,
  src_h: number,
  cols: number,
  rows: number,
  rand: () => number = Math.random,
): Board => {
  const safe_cols = Math.max(1, Math.floor(cols));
  const safe_rows = Math.max(1, Math.floor(rows));
  const pw = src_w / safe_cols;
  const ph = src_h / safe_rows;
  const count = safe_cols * safe_rows;

  const pieces: Piece[] = new Array(count);
  const parent = new Int32Array(count);
  const size = new Int32Array(count);
  const order: number[] = new Array(count);

  for (let row = 0; row < safe_rows; row++) {
    for (let col = 0; col < safe_cols; col++) {
      const id = row * safe_cols + col;

      pieces[id] = { id, col, row, group: id, x: col * pw, y: row * ph, locked: false };
    }
  }

  for (let i = 0; i < count; i++) {
    parent[i] = i;
    size[i] = 1;
    order[i] = i;
  }

  const seams = build_seams(safe_cols, safe_rows, pw, ph, rand);

  return {
    cols: safe_cols,
    rows: safe_rows,
    pw,
    ph,
    width: safe_cols * pw,
    height: safe_rows * ph,
    source,
    src_x,
    src_y,
    src_w,
    src_h,
    pieces,
    parent,
    size,
    order,
    h_seams: seams.h_seams,
    v_seams: seams.v_seams,
  };
};

export const find = (board: Board, id: number): number => {
  let root = id;

  while (board.parent[root] !== root) {
    root = board.parent[root];
  }

  let cursor = id;

  while (board.parent[cursor] !== root) {
    const next = board.parent[cursor];
    board.parent[cursor] = root;
    cursor = next;
  }

  return root;
};

export const group_of = (board: Board, id: number): number => find(board, id);

export const merge = (board: Board, a: number, b: number): number => {
  let root_a = find(board, a);
  let root_b = find(board, b);

  if (root_a === root_b) {
    return root_a;
  }

  if (board.size[root_a] < board.size[root_b]) {
    const swap = root_a;
    root_a = root_b;
    root_b = swap;
  }

  board.parent[root_b] = root_a;
  board.size[root_a] += board.size[root_b];

  for (const piece of board.pieces) {
    if (find(board, piece.id) === root_a) {
      piece.group = root_a;
    }
  }

  return root_a;
};

export const group_size = (board: Board, id: number): number => board.size[find(board, id)];

export const piece_at = (board: Board, col: number, row: number): Piece | undefined => {
  if (col < 0 || row < 0 || col >= board.cols || row >= board.rows) {
    return undefined;
  }

  return board.pieces[row * board.cols + col];
};

export const drag_group = (board: Board, group: number, dx: number, dy: number): void => {
  for (const piece of board.pieces) {
    if (find(board, piece.id) === group) {
      piece.x += dx;
      piece.y += dy;
    }
  }
};

export const translate_group_to = (board: Board, group: number, x: number, y: number): void => {
  let anchor: Piece | undefined;

  for (const piece of board.pieces) {
    if (find(board, piece.id) === group) {
      anchor = piece;
      break;
    }
  }

  if (anchor) {
    drag_group(board, group, x - anchor.x, y - anchor.y);
  }
};

export const reset_groups = (board: Board): void => {
  for (let i = 0; i < board.pieces.length; i++) {
    board.parent[i] = i;
    board.size[i] = 1;
    board.pieces[i].group = i;
    board.pieces[i].locked = false;
  }
};

export const shuffle_board = (board: Board, spread: number, rand: () => number = Math.random): void => {
  for (const piece of board.pieces) {
    piece.x = -spread + rand() * (board.width + spread * 2);
    piece.y = -spread + rand() * (board.height + spread * 2);
  }

  reset_groups(board);
};

export const win = (board: Board): boolean => group_size(board, 0) === board.pieces.length;

export type Bounds = {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
};

// Grid cells around the board, each at least one piece wide, that do not overlap the board.
const ring_cells = (board: Board, cell: number, margin: number): Array<{ x: number; y: number }> => {
  const cells: Array<{ x: number; y: number }> = [];
  const cols = Math.ceil((board.width + margin * 2) / cell);
  const rows = Math.ceil((board.height + margin * 2) / cell);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = -margin + col * cell;
      const y = -margin + row * cell;
      const on_board = x < board.width && x + cell > 0 && y < board.height && y + cell > 0;

      if (!on_board) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
};

// Places every piece in its own cell outside the board: no overlap, board fully visible.
export const scatter_board = (board: Board, rand: () => number = Math.random): void => {
  reset_groups(board);

  const cell = Math.max(board.pw, board.ph) * 1.12;
  let margin = cell;
  let cells = ring_cells(board, cell, margin);

  let guard = 0;

  while (cells.length < board.pieces.length && guard < 400) {
    margin += cell * 0.5;
    cells = ring_cells(board, cell, margin);
    guard += 1;
  }

  if (cells.length < board.pieces.length) {
    cells = [];

    const cols = Math.ceil((board.width + margin * 2) / cell);
    const rows = Math.ceil((board.height + margin * 2) / cell);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cells.push({ x: -margin + col * cell, y: -margin + row * cell });
      }
    }
  }

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const swap = cells[i];
    cells[i] = cells[j];
    cells[j] = swap;
  }

  const max_dx = Math.max(0, cell - board.pw);
  const max_dy = Math.max(0, cell - board.ph);

  for (let i = 0; i < board.pieces.length; i++) {
    const piece = board.pieces[i];
    const slot = cells[i];

    piece.x = slot.x + rand() * max_dx;
    piece.y = slot.y + rand() * max_dy;
    piece.locked = false;
  }
};

// World bounds that include the board rectangle and every scattered piece.
export const board_bounds = (board: Board): Bounds => {
  let min_x = 0;
  let min_y = 0;
  let max_x = board.width;
  let max_y = board.height;

  for (const piece of board.pieces) {
    if (piece.x < min_x) min_x = piece.x;
    if (piece.y < min_y) min_y = piece.y;
    if (piece.x + board.pw > max_x) max_x = piece.x + board.pw;
    if (piece.y + board.ph > max_y) max_y = piece.y + board.ph;
  }

  return { min_x, min_y, max_x, max_y };
};
