import { describe, expect, test } from 'bun:test';

import { pinch_metrics } from './pinch';

describe('pinch_metrics', () => {
  test('scale grows when fingers spread', () => {
    const metrics = pinch_metrics({ distance: 100, mid_x: 0, mid_y: 0 }, { x: -100, y: 0 }, { x: 100, y: 0 });

    expect(metrics.scale).toBeCloseTo(2, 6);
    expect(metrics.dx).toBeCloseTo(0, 6);
    expect(metrics.dy).toBeCloseTo(0, 6);
  });

  test('reports midpoint delta', () => {
    const metrics = pinch_metrics({ distance: 100, mid_x: 0, mid_y: 0 }, { x: 10, y: 20 }, { x: 110, y: 20 });

    expect(metrics.scale).toBeCloseTo(1, 6);
    expect(metrics.dx).toBeCloseTo(60, 6);
    expect(metrics.dy).toBeCloseTo(20, 6);
  });

  test('guards a zero baseline distance', () => {
    const metrics = pinch_metrics({ distance: 0, mid_x: 0, mid_y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 });

    expect(metrics.scale).toBe(1);
  });
});
