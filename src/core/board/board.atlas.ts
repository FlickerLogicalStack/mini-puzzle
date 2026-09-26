import type { Board } from './board';
import { max_connector_depth, piece_polygon } from './board.geometry';

// RGBA pixels budget for all piece bitmaps (~64 MB at 4 bytes/px).
export const ATLAS_BUDGET_PX = 16 * 1024 * 1024;
export const ATLAS_MIN_SCALE = 0.35;

export const atlas_scale_for = (total_px: number, budget_px: number = ATLAS_BUDGET_PX): number => {
  if (total_px <= budget_px) {
    return 1;
  }

  return Math.max(ATLAS_MIN_SCALE, Math.sqrt(budget_px / total_px));
};

export type PieceAtlas = {
  /** Connector protrusion baked into each bitmap around the piece rectangle, in world pixels. */
  bleed: number;
  /** One pre-rendered canvas per piece id (image clipped to the piece shape). */
  bitmaps: HTMLCanvasElement[];
};

const atlases = new WeakMap<Board, PieceAtlas>();

export const get_piece_atlas = (board: Board): PieceAtlas | undefined => atlases.get(board);

export const build_piece_atlas = (board: Board): PieceAtlas => {
  const bleed = max_connector_depth(board);
  const world_w = board.pw + bleed * 2;
  const world_h = board.ph + bleed * 2;

  const total_px = world_w * world_h * board.pieces.length;
  const scale = atlas_scale_for(total_px);

  const bitmap_w = Math.max(1, Math.round(world_w * scale));
  const bitmap_h = Math.max(1, Math.round(world_h * scale));

  const bitmaps: HTMLCanvasElement[] = [];

  for (const piece of board.pieces) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = bitmap_w;
    canvas.height = bitmap_h;
    bitmaps.push(canvas);

    if (!ctx) {
      continue;
    }

    const polygon = piece_polygon(board, piece);
    const path = new Path2D();

    path.moveTo(polygon[0] + bleed, polygon[1] + bleed);

    for (let i = 2; i < polygon.length; i += 2) {
      path.lineTo(polygon[i] + bleed, polygon[i + 1] + bleed);
    }

    path.closePath();

    const source_x = board.src_x + piece.col * board.pw;
    const source_y = board.src_y + piece.row * board.ph;

    const clip_x = Math.max(board.src_x, source_x - bleed);
    const clip_y = Math.max(board.src_y, source_y - bleed);
    const clip_right = Math.min(board.src_x + board.src_w, source_x + board.pw + bleed);
    const clip_bottom = Math.min(board.src_y + board.src_h, source_y + board.ph + bleed);

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.save();
    ctx.clip(path);
    ctx.drawImage(
      board.source,
      clip_x,
      clip_y,
      clip_right - clip_x,
      clip_bottom - clip_y,
      clip_x - source_x + bleed,
      clip_y - source_y + bleed,
      clip_right - clip_x,
      clip_bottom - clip_y,
    );
    ctx.restore();
  }

  const atlas: PieceAtlas = { bleed, bitmaps };
  atlases.set(board, atlas);

  return atlas;
};
