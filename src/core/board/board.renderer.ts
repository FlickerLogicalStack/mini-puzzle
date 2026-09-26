import type { CtxCalls } from '@src/core/debug_hud/ctx_calls';
import { ZOOM_ANCHOR, to_screen_x, to_screen_y } from '../camera/camera';
import { find, type Board, type Piece } from './board';
import { get_piece_atlas, type PieceAtlas } from './board.atlas';
import { get_group_bitmap } from './board.group.atlas';
import { get_group_render, group_origin } from './board.group.path';
import { max_connector_depth, piece_polygon } from './board.geometry';

const path_cache = new WeakMap<Board, Map<number, Path2D>>();

const root_buffers = new WeakMap<Board, Int32Array>();

const roots_for = (board: Board): Int32Array => {
  let roots = root_buffers.get(board);

  if (!roots || roots.length !== board.pieces.length) {
    roots = new Int32Array(board.pieces.length);
    root_buffers.set(board, roots);
  }

  for (const piece of board.pieces) {
    roots[piece.id] = find(board, piece.id);
  }

  return roots;
};

const make_path = (points: number[]): Path2D => {
  const path = new Path2D();

  path.moveTo(points[0], points[1]);

  for (let i = 2; i < points.length; i += 2) {
    path.lineTo(points[i], points[i + 1]);
  }

  path.closePath();

  return path;
};

const clip_for = (board: Board, piece: Piece): Path2D => {
  let cache = path_cache.get(board);

  if (!cache) {
    cache = new Map();
    path_cache.set(board, cache);
  }

  let clip = cache.get(piece.id);

  if (!clip) {
    clip = make_path(piece_polygon(board, piece));
    cache.set(piece.id, clip);
  }

  return clip;
};

type DrawGroup = {
  /** Union-find root shared by every member. */
  root: number;
  /** Pieces belonging to the group, in board draw order. */
  members: Piece[];
  /** True if the group is placed on its exact board position. */
  locked: boolean;
  /** True for the group currently being dragged (rendered last, on top). */
  dragged: boolean;
};

const build_groups = (board: Board, roots: Int32Array, dragged_root: number): DrawGroup[] => {
  const map = new Map<number, DrawGroup>();

  for (const id of board.order) {
    const piece = board.pieces[id];
    const root = roots[id];
    let group = map.get(root);

    if (!group) {
      group = { root, members: [], locked: false, dragged: root === dragged_root };
      map.set(root, group);
    }

    group.members.push(piece);

    if (piece.locked) {
      group.locked = true;
    }
  }

  const free: DrawGroup[] = [];
  const locked: DrawGroup[] = [];
  const drag: DrawGroup[] = [];

  for (const group of map.values()) {
    if (group.dragged) {
      drag.push(group);
    } else if (group.locked) {
      locked.push(group);
    } else {
      free.push(group);
    }
  }

  return locked.concat(free, drag);
};

const group_bounds = (board: Board, group: DrawGroup, bleed: number) => {
  let min_x = Infinity;
  let min_y = Infinity;
  let max_x = -Infinity;
  let max_y = -Infinity;

  for (const piece of group.members) {
    if (piece.x < min_x) min_x = piece.x;
    if (piece.y < min_y) min_y = piece.y;
    if (piece.x + board.pw > max_x) max_x = piece.x + board.pw;
    if (piece.y + board.ph > max_y) max_y = piece.y + board.ph;
  }

  return { min_x: min_x - bleed, min_y: min_y - bleed, max_x: max_x + bleed, max_y: max_y + bleed };
};

const draw_bitmap = (ctx: CanvasRenderingContext2D, atlas: PieceAtlas, board: Board, id: number, calls: CtxCalls) => {
  const bleed = atlas.bleed;

  calls.drawImage += 1;

  ctx.drawImage(atlas.bitmaps[id], -bleed, -bleed, board.pw + bleed * 2, board.ph + bleed * 2);
};

const draw_clipped = (
  ctx: CanvasRenderingContext2D,
  board: Board,
  piece: Piece,
  clip: Path2D,
  bleed: number,
  calls: CtxCalls,
) => {
  const source_x = board.src_x + piece.col * board.pw;
  const source_y = board.src_y + piece.row * board.ph;

  const clip_x = Math.max(board.src_x, source_x - bleed);
  const clip_y = Math.max(board.src_y, source_y - bleed);
  const clip_right = Math.min(board.src_x + board.src_w, source_x + board.pw + bleed);
  const clip_bottom = Math.min(board.src_y + board.src_h, source_y + board.ph + bleed);

  calls.save += 1;
  ctx.save();

  calls.clip += 1;
  ctx.clip(clip);

  calls.drawImage += 1;
  ctx.drawImage(
    board.source,
    clip_x,
    clip_y,
    clip_right - clip_x,
    clip_bottom - clip_y,
    clip_x - source_x,
    clip_y - source_y,
    clip_right - clip_x,
    clip_bottom - clip_y,
  );

  calls.restore += 1;
  ctx.restore();
};

export const render_board = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const board = game.board;

  if (!board) {
    return;
  }

  const ctx = engine.ctx;
  const calls = game.debug_hud.ctx_calls;
  const camera = game.camera;
  const width = engine.canvas.width;
  const height = engine.canvas.height;
  const zoom = camera.zoom;
  const atlas = get_piece_atlas(board);
  const bleed = atlas ? atlas.bleed : max_connector_depth(board);

  const offset_x = camera.x * zoom + (width / 2) * (ZOOM_ANCHOR - zoom);
  const offset_y = -camera.y * zoom + (height / 2) * (ZOOM_ANCHOR - zoom);

  const min_x = (-bleed - offset_x) / zoom;
  const max_x = (width + bleed - offset_x) / zoom;
  const min_y = (-bleed - offset_y) / zoom;
  const max_y = (height + bleed - offset_y) / zoom;

  const roots = roots_for(board);
  const dragged_root = game.drag.active ? roots[game.drag.piece_id] : -1;
  const groups = build_groups(board, roots, dragged_root);

  for (const group of groups) {
    const bounds = group_bounds(board, group, bleed);

    if (bounds.max_x < min_x || bounds.min_x > max_x || bounds.max_y < min_y || bounds.min_y > max_y) {
      continue;
    }

    const entry = group.members.length > 1 ? get_group_render(board, group.root, group.members) : null;

    if (entry) {
      const origin = group_origin(group.members);
      const bitmap = get_group_bitmap(board, group.root, entry);

      if (bitmap) {
        calls.save += 1;
        ctx.save();

        calls.translate += 1;
        ctx.translate(
          to_screen_x(camera, width, origin.x + bitmap.dest_x),
          to_screen_y(camera, height, origin.y + bitmap.dest_y),
        );

        calls.scale += 1;
        ctx.scale(zoom, zoom);

        calls.drawImage += 1;
        ctx.drawImage(bitmap.canvas, 0, 0, bitmap.src_w, bitmap.src_h);

        calls.restore += 1;
        ctx.restore();
      } else {
        calls.save += 1;
        ctx.save();

        calls.translate += 1;
        ctx.translate(to_screen_x(camera, width, origin.x), to_screen_y(camera, height, origin.y));

        calls.scale += 1;
        ctx.scale(zoom, zoom);

        calls.clip += 1;
        ctx.clip(entry.path);

        calls.drawImage += 1;
        ctx.drawImage(
          board.source,
          entry.src_x,
          entry.src_y,
          entry.src_w,
          entry.src_h,
          entry.dest_x,
          entry.dest_y,
          entry.src_w,
          entry.src_h,
        );

        calls.restore += 1;
        ctx.restore();
      }

      game.debug_hud.renders += 1;
    } else {
      for (const piece of group.members) {
        calls.save += 1;
        ctx.save();

        calls.translate += 1;
        ctx.translate(to_screen_x(camera, width, piece.x), to_screen_y(camera, height, piece.y));

        calls.scale += 1;
        ctx.scale(zoom, zoom);

        if (atlas) {
          draw_bitmap(ctx, atlas, board, piece.id, calls);
        } else {
          draw_clipped(ctx, board, piece, clip_for(board, piece), bleed, calls);
        }

        calls.restore += 1;
        ctx.restore();

        game.debug_hud.renders += 1;
      }
    }
  }
};
