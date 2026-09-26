// Classic jigsaw tab from the reference pattern: a round knob traced by two cubic curves. Sampled
// into a polygon so the rest of the pipeline (path clip, hit-test, atlas) stays polygon-based.
// Points are in the canonical seam frame: u along the seam (centered on 0), v outward (>= 0), with
// the base spanning [-width/2, width/2] and the peak reaching exactly `depth`.
const CUBIC_STEPS = 24;

const cubic = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const mt = 1 - t;

  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
};

export const knob_outline = (width: number, depth: number): Array<[number, number]> => {
  const half = width / 2;
  const neck = depth * 0.276;

  const segments: Array<[[number, number], [number, number], [number, number], [number, number]]> = [
    [
      [-half, 0],
      [-half, neck],
      [-width, depth],
      [0, depth],
    ],
    [
      [0, depth],
      [width, depth],
      [half, neck],
      [half, 0],
    ],
  ];

  const points: Array<[number, number]> = [];

  segments.forEach(([p0, p1, p2, p3], index) => {
    for (let i = index === 0 ? 0 : 1; i <= CUBIC_STEPS; i++) {
      const t = i / CUBIC_STEPS;

      points.push([cubic(p0[0], p1[0], p2[0], p3[0], t), cubic(p0[1], p1[1], p2[1], p3[1], t)]);
    }
  });

  points[0] = [-half, 0];
  points[points.length - 1] = [half, 0];

  return points;
};
