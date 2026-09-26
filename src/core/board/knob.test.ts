import { describe, expect, test } from 'bun:test';

import { knob_outline } from './knob';

describe('knob_outline', () => {
  const width = 100;
  const depth = 60;
  const points = knob_outline(width, depth);

  test('starts and ends on the seam line', () => {
    expect(points[0]).toEqual([-width / 2, 0]);
    expect(points[points.length - 1]).toEqual([width / 2, 0]);
  });

  test('stays outward and reaches the requested depth', () => {
    for (const [, v] of points) {
      expect(v).toBeGreaterThanOrEqual(-1e-9);
    }

    expect(Math.max(...points.map(point => point[1]))).toBeCloseTo(depth, 6);
  });

  test('is a simple polygon (no self-intersections)', () => {
    const cross = (o: [number, number], p: [number, number], q: [number, number]) =>
      (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);

    const crosses = (
      a: [number, number],
      b: [number, number],
      c: [number, number],
      d: [number, number],
    ) => {
      const d1 = cross(c, d, a);
      const d2 = cross(c, d, b);
      const d3 = cross(a, b, c);
      const d4 = cross(a, b, d);

      return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
    };

    const count = points.length;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if ((i + 1) % count === j || (j + 1) % count === i) {
          continue;
        }

        expect(crosses(points[i], points[(i + 1) % count], points[j], points[(j + 1) % count])).toBe(false);
      }
    }
  });

  test('is mirror-symmetric', () => {
    for (let i = 0; i < points.length; i++) {
      const mirror = points[points.length - 1 - i];

      expect(points[i][0]).toBeCloseTo(-mirror[0], 6);
      expect(points[i][1]).toBeCloseTo(mirror[1], 6);
    }
  });
});
