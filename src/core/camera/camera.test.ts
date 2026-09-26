import { describe, expect, test } from 'bun:test';

import { to_screen_x, to_screen_y, zoom_camera_at, type Camera } from './camera';

const CANVAS_W = 800;
const CANVAS_H = 600;

describe('zoom_camera_at', () => {
  test('keeps the world point under the cursor fixed when zooming in', () => {
    const camera: Camera = { x: -123, y: 44, zoom: 1.7 };
    const world_x = 321;
    const world_y = -87;

    const screen_x = to_screen_x(camera, CANVAS_W, world_x);
    const screen_y = to_screen_y(camera, CANVAS_H, world_y);

    zoom_camera_at(camera, CANVAS_W, CANVAS_H, screen_x, screen_y, 4.2);

    expect(camera.zoom).toBeCloseTo(4.2, 9);
    expect(to_screen_x(camera, CANVAS_W, world_x)).toBeCloseTo(screen_x, 6);
    expect(to_screen_y(camera, CANVAS_H, world_y)).toBeCloseTo(screen_y, 6);
  });

  test('keeps the world point under the cursor fixed when zooming out', () => {
    const camera: Camera = { x: 12.5, y: -300, zoom: 6 };
    const world_x = 0;
    const world_y = 0;

    const screen_x = to_screen_x(camera, CANVAS_W, world_x);
    const screen_y = to_screen_y(camera, CANVAS_H, world_y);

    zoom_camera_at(camera, CANVAS_W, CANVAS_H, screen_x, screen_y, 0.4);

    expect(to_screen_x(camera, CANVAS_W, world_x)).toBeCloseTo(screen_x, 6);
    expect(to_screen_y(camera, CANVAS_H, world_y)).toBeCloseTo(screen_y, 6);
  });
});
