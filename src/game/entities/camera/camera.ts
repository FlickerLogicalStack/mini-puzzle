// Zoom at which the centering term vanishes; anchors centering and the zoom pivot at
// (canvas / 2 * ZOOM_ANCHOR).
export const ZOOM_ANCHOR = 1;

export type Camera = {
  x: number;
  y: number;
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
