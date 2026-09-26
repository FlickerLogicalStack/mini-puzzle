import type { Camera } from '../camera/camera';

export const center_camera = (
  camera: Camera,
  world_w: number,
  world_h: number,
  canvas_width: number,
  canvas_height: number,
) => {
  camera.x = canvas_width / 2 - world_w / 2;
  camera.y = world_h / 2 - canvas_height / 2;
};

// Cover the whole viewport with the board (no empty strips) and center on it.
export const fit_camera = (
  camera: Camera,
  world_w: number,
  world_h: number,
  canvas_width: number,
  canvas_height: number,
) => {
  const scale = Math.max(canvas_width / world_w, canvas_height / world_h);

  camera.zoom = Number.isFinite(scale) && scale > 0 ? scale : 1;

  center_camera(camera, world_w, world_h, canvas_width, canvas_height);
};

// Center on an arbitrary world rectangle without changing zoom.
export const center_camera_rect = (
  camera: Camera,
  min_x: number,
  min_y: number,
  max_x: number,
  max_y: number,
  canvas_width: number,
  canvas_height: number,
) => {
  camera.x = canvas_width / 2 - (min_x + max_x) / 2;
  camera.y = (min_y + max_y) / 2 - canvas_height / 2;
};

export type FitMode = 'contain' | 'cover';

// Fit an arbitrary world rectangle. `contain` shows it entirely, `cover` fills the viewport.
export const fit_camera_rect = (
  camera: Camera,
  min_x: number,
  min_y: number,
  max_x: number,
  max_y: number,
  canvas_width: number,
  canvas_height: number,
  mode: FitMode = 'contain',
) => {
  const world_w = Math.max(1, max_x - min_x);
  const world_h = Math.max(1, max_y - min_y);

  const zoom_x = canvas_width / world_w;
  const zoom_y = canvas_height / world_h;
  const zoom = mode === 'contain' ? Math.min(zoom_x, zoom_y) : Math.max(zoom_x, zoom_y);

  camera.zoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;

  center_camera_rect(camera, min_x, min_y, max_x, max_y, canvas_width, canvas_height);
};
