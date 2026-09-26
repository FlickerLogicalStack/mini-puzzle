import { build_seams, max_seam_depth, type Seam } from './board.seams';

export type Piece = {
  /** Stable id; also the index into `Board.pieces`, `parent` and `size`. */
  id: number;
  /** Correct grid column (0-based) this piece belongs to. */
  col: number;
  /** Correct grid row (0-based) this piece belongs to. */
  row: number;
  /** Union-find root of the connected block this piece currently belongs to. */
  group: number;
  /** Current top-left x in world (source-image) pixels. */
  x: number;
  /** Current top-left y in world (source-image) pixels. */
  y: number;
  /** True once the group is on its exact board position and must not be dragged. */
  locked: boolean;
};

export type Board = {
  /** Number of columns in the piece grid. */
  cols: number;
  /** Number of rows in the piece grid. */
  rows: number;
  /** Nominal piece width in source pixels (`src_w / cols`). */
  pw: number;
  /** Nominal piece height in source pixels (`src_h / rows`). */
  ph: number;
  /** Board width in world pixels (`cols * pw`). */
  width: number;
  /** Board height in world pixels (`rows * ph`). */
  height: number;
  /** Full decoded image the pieces are cut from. */
  source: CanvasImageSource;
  /** Left edge of the source crop, in `source` pixels. */
  src_x: number;
  /** Top edge of the source crop, in `source` pixels. */
  src_y: number;
  /** Width of the source crop. */
  src_w: number;
  /** Height of the source crop. */
  src_h: number;
  /** All pieces, indexed by `Piece.id`. */
  pieces: Piece[];
  /** Union-find parent pointers (a root points to itself). */
  parent: Int32Array;
  /** Union-find group sizes, meaningful at roots only. */
  size: Int32Array;
  /** Draw order of piece ids; the last entry renders on top. */
  order: number[];
  /** Vertical seams between columns: index `row * (cols - 1) + col`, seam length `ph`. */
  h_seams: Seam[];
  /** Horizontal seams between rows: index `row * cols + col`, seam length `pw`. */
  v_seams: Seam[];
  /** Largest connector protrusion; used as render bleed and scatter padding. */
  bleed: number;
  /** Bumped on every merge/reset; invalidates cached group render paths and bitmaps. */
  version: number;
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
  const bleed = max_seam_depth(seams);

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
    bleed,
    version: 0,
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

  board.version += 1;

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

export const reset_groups = (board: Board): void => {
  for (let i = 0; i < board.pieces.length; i++) {
    board.parent[i] = i;
    board.size[i] = 1;
    board.pieces[i].group = i;
    board.pieces[i].locked = false;
  }

  board.version += 1;
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
  /** Left-most world x of the board rectangle and its scattered pieces (connector bleed included). */
  min_x: number;
  /** Top-most world y of the same area. */
  min_y: number;
  /** Right-most world x of the same area. */
  max_x: number;
  /** Bottom-most world y of the same area. */
  max_y: number;
};

// Grid cells around the board, each at least one piece wide, that do not overlap the board.
// One closed rectangular frame of grid cells around the board, corners included, so a ring never has
// holes. The grid is aligned so the board is centred inside it, which keeps the gaps even on every
// side. Ring `r` is the frame one cell outside ring `r - 1`.
const ring_cells = (
  cell: number,
  origin_x: number,
  origin_y: number,
  cols: number,
  rows: number,
  r: number,
): Array<{ x: number; y: number }> => {
  const cells: Array<{ x: number; y: number }> = [];

  const min_i = -r;
  const max_i = cols - 1 + r;
  const min_j = -r;
  const max_j = rows - 1 + r;

  const push = (i: number, j: number) => cells.push({ x: origin_x + i * cell, y: origin_y + j * cell });

  // Perimeter order (top -> right -> bottom -> left) so pieces can be laid out contiguously.
  for (let i = min_i; i <= max_i; i++) {
    push(i, min_j);
  }

  for (let j = min_j + 1; j <= max_j; j++) {
    push(max_i, j);
  }

  for (let i = max_i - 1; i >= min_i; i--) {
    push(i, max_j);
  }

  for (let j = max_j - 1; j >= min_j + 1; j--) {
    push(min_i, j);
  }

  return cells;
};

// Places every piece in its own cell outside the board: no overlap, board fully visible.
export const scatter_board = (board: Board, rand: () => number = Math.random): void => {
  reset_groups(board);

  // A cell fits a whole piece plus its protruding connectors, so a tab can never reach the board or a
  // neighbouring cell. Pieces go into closed rings of this grid around the board, inner rings first,
  // extra rings added outwards only when there are more pieces than fit.
  const bleed = board.bleed;
  const cell = Math.max(board.pw, board.ph) + bleed * 2;
  const cols = Math.max(1, Math.ceil(board.width / cell));
  const rows = Math.max(1, Math.ceil(board.height / cell));
  const origin_x = (board.width - cols * cell) / 2;
  const origin_y = (board.height - rows * cell) / 2;

  const cells: Array<{ x: number; y: number }> = [];
  let ring = 1;

  while (cells.length < board.pieces.length && ring < 500) {
    const frame = ring_cells(cell, origin_x, origin_y, cols, rows, ring);
    const start = Math.floor(rand() * frame.length);
    const ordered = frame.slice(start).concat(frame.slice(0, start));
    const take = Math.min(ordered.length, board.pieces.length - cells.length);

    cells.push(...ordered.slice(0, take));
    ring += 1;
  }

  const max_dx = Math.max(0, cell - board.pw - bleed * 2);
  const max_dy = Math.max(0, cell - board.ph - bleed * 2);

  // Decouple source order from placement order, otherwise consecutive pieces of the image end up next
  // to each other along the ring and reveal the picture.
  const order = board.pieces.map((_, index) => index);

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const swap = order[i];
    order[i] = order[j];
    order[j] = swap;
  }

  for (let i = 0; i < order.length; i++) {
    const piece = board.pieces[order[i]];
    const slot = cells[i];

    piece.x = slot.x + bleed + rand() * max_dx;
    piece.y = slot.y + bleed + rand() * max_dy;
    piece.locked = false;
  }
};

// World bounds that include the board rectangle and every scattered piece.
export const board_bounds = (board: Board): Bounds => {
  const bleed = board.bleed;

  let min_x = 0;
  let min_y = 0;
  let max_x = board.width;
  let max_y = board.height;

  for (const piece of board.pieces) {
    if (piece.x - bleed < min_x) min_x = piece.x - bleed;
    if (piece.y - bleed < min_y) min_y = piece.y - bleed;
    if (piece.x + board.pw + bleed > max_x) max_x = piece.x + board.pw + bleed;
    if (piece.y + board.ph + bleed > max_y) max_y = piece.y + board.ph + bleed;
  }

  return { min_x, min_y, max_x, max_y };
};
