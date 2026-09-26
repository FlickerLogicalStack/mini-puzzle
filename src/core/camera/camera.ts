// Zoom at which the centering term vanishes; anchors centering and the zoom pivot at
// (canvas / 2 * ZOOM_ANCHOR).
export const ZOOM_ANCHOR = 1;

export type Camera = {
  /** World x kept at the horizontal center of the viewport, in world pixels. */
  x: number;
  /** World y kept at the vertical center of the viewport, in world pixels. */
  y: number;
  /** Scale factor from world pixels to CSS pixels. */
  zoom: number;
};

export const create_camera = (): Camera => ({
  x: 0,
  y: 0,
  zoom: 1,
});

export const to_screen_x = (camera: Camera, canvas_width: number, world_x: number) =>
  (world_x + camera.x) * camera.zoom + (canvas_width / 2) * (ZOOM_ANCHOR - camera.zoom);

export const to_screen_y = (camera: Camera, canvas_height: number, world_y: number) =>
  (world_y - camera.y) * camera.zoom + (canvas_height / 2) * (ZOOM_ANCHOR - camera.zoom);

// Zoom to `next_zoom` keeping the world point under (screen_x, screen_y) exactly where it is, so the
// view zooms around the cursor instead of the canvas centre.
export const zoom_camera_at = (
  camera: Camera,
  canvas_width: number,
  canvas_height: number,
  screen_x: number,
  screen_y: number,
  next_zoom: number,
) => {
  const world_x =
    (screen_x - (canvas_width / 2) * (ZOOM_ANCHOR - camera.zoom)) / camera.zoom - camera.x;
  const world_y =
    (screen_y - (canvas_height / 2) * (ZOOM_ANCHOR - camera.zoom)) / camera.zoom + camera.y;

  camera.zoom = next_zoom;

  camera.x = (screen_x - (canvas_width / 2) * (ZOOM_ANCHOR - next_zoom)) / next_zoom - world_x;
  camera.y = world_y - (screen_y - (canvas_height / 2) * (ZOOM_ANCHOR - next_zoom)) / next_zoom;
};
