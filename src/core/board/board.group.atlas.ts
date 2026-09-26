import type { Board } from './board';
import type { GroupRender } from './board.group.path';

export type GroupBitmap = {
  /** Offscreen canvas holding the whole group rendered (and cached) as one opaque image. */
  canvas: HTMLCanvasElement;
  /** World-pixel width the canvas represents when blitted (matches `GroupRender.src_w`). */
  src_w: number;
  /** World-pixel height the canvas represents when blitted. */
  src_h: number;
  /** Local x of the bitmap origin inside the group's home cell. */
  dest_x: number;
  /** Local y of the bitmap origin inside the group's home cell. */
  dest_y: number;
};

// Per-group pixel cap (~16 MB RGBA at 4 bytes/px); bigger groups fall back to the clip path.
const GROUP_MAX_PX = 4 * 1024 * 1024;

const caches = new WeakMap<Board, Map<string, GroupBitmap>>();

export const get_group_bitmap = (board: Board, root: number, entry: GroupRender): GroupBitmap | null => {
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

  const area = entry.src_w * entry.src_h;

  if (area <= 0) {
    return null;
  }

  const scale = Math.min(1, Math.sqrt(GROUP_MAX_PX / area));

  if (!Number.isFinite(scale) || scale <= 0) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(entry.src_w * scale));
  canvas.height = Math.max(1, Math.round(entry.src_h * scale));

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.setTransform(scale, 0, 0, scale, -entry.dest_x * scale, -entry.dest_y * scale);
  ctx.save();
  ctx.clip(entry.path);
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
  ctx.restore();

  const bitmap: GroupBitmap = {
    canvas,
    src_w: entry.src_w,
    src_h: entry.src_h,
    dest_x: entry.dest_x,
    dest_y: entry.dest_y,
  };

  cache.set(key, bitmap);

  if (cache.size > 128) {
    const oldest = cache.keys().next().value;

    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }

  return bitmap;
};
