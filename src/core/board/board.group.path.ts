import type { Board, Piece } from './board';
import { max_connector_depth, piece_polygon } from './board.geometry';

// Rendering info for a connected group of 2+ pieces, expressed relative to the group's top-left
// HOME cell so it is independent of how far the group has been dragged.
export type GroupRender = {
  /** Compound path of all member piece polygons, in coordinates relative to the group's home cell. */
  path: Path2D;
  /** Left edge of the source crop to draw, in `Board.source` pixels. */
  src_x: number;
  /** Top edge of the source crop to draw. */
  src_y: number;
  /** Width of the source crop. */
  src_w: number;
  /** Height of the source crop. */
  src_h: number;
  /** Local x where the source crop starts (relative to the group home cell). */
  dest_x: number;
  /** Local y where the source crop starts. */
  dest_y: number;
};

const caches = new WeakMap<Board, Map<string, GroupRender>>();

export const group_origin = (members: Piece[]): { x: number; y: number } => {
  let x = Infinity;
  let y = Infinity;

  for (const piece of members) {
    if (piece.x < x) x = piece.x;
    if (piece.y < y) y = piece.y;
  }

  return { x, y };
};

export const group_home_rect = (
  board: Board,
  members: Piece[],
): { home_x: number; home_y: number; home_w: number; home_h: number } => {
  let min_col = Infinity;
  let min_row = Infinity;
  let max_col = -Infinity;
  let max_row = -Infinity;

  for (const piece of members) {
    if (piece.col < min_col) min_col = piece.col;
    if (piece.row < min_row) min_row = piece.row;
    if (piece.col > max_col) max_col = piece.col;
    if (piece.row > max_row) max_row = piece.row;
  }

  const home_x = min_col * board.pw;
  const home_y = min_row * board.ph;

  return {
    home_x,
    home_y,
    home_w: (max_col + 1) * board.pw - home_x,
    home_h: (max_row + 1) * board.ph - home_y,
  };
};

// Returns cached group render info, or null for a single piece (handled by the piece bitmap).
export const get_group_render = (board: Board, root: number, members: Piece[]): GroupRender | null => {
  if (members.length < 2) {
    return null;
  }

  let cache = caches.get(board);

  if (!cache) {
    cache = new Map();
    caches.set(board, cache);
  }

  const key = `${root}:${board.version}`;
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const bleed = max_connector_depth(board);
  const { home_x, home_y, home_w, home_h } = group_home_rect(board, members);

  const path = new Path2D();

  for (const piece of members) {
    const polygon = piece_polygon(board, piece);
    const ox = piece.col * board.pw - home_x;
    const oy = piece.row * board.ph - home_y;

    path.moveTo(polygon[0] + ox, polygon[1] + oy);

    for (let i = 2; i < polygon.length; i += 2) {
      path.lineTo(polygon[i] + ox, polygon[i + 1] + oy);
    }

    path.closePath();
  }

  const sx0 = Math.max(board.src_x, home_x - bleed);
  const sy0 = Math.max(board.src_y, home_y - bleed);
  const sx1 = Math.min(board.src_x + board.src_w, home_x + home_w + bleed);
  const sy1 = Math.min(board.src_y + board.src_h, home_y + home_h + bleed);

  const entry: GroupRender = {
    path,
    src_x: sx0,
    src_y: sy0,
    src_w: sx1 - sx0,
    src_h: sy1 - sy0,
    dest_x: sx0 - home_x,
    dest_y: sy0 - home_y,
  };

  cache.set(key, entry);

  if (cache.size > 256) {
    const oldest = cache.keys().next().value;

    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }

  return entry;
};
