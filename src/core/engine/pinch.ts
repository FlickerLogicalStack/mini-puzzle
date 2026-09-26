export type Point = {
  x: number;
  y: number;
};

export type PinchBaseline = {
  distance: number;
  mid_x: number;
  mid_y: number;
};

export type PinchMetrics = {
  distance: number;
  mid_x: number;
  mid_y: number;
  scale: number;
  dx: number;
  dy: number;
};

export const pinch_metrics = (prev: PinchBaseline, a: Point, b: Point): PinchMetrics => {
  const distance = Math.hypot(a.x - b.x, a.y - b.y);
  const mid_x = (a.x + b.x) / 2;
  const mid_y = (a.y + b.y) / 2;

  return {
    distance,
    mid_x,
    mid_y,
    scale: prev.distance > 0 ? distance / prev.distance : 1,
    dx: mid_x - prev.mid_x,
    dy: mid_y - prev.mid_y,
  };
};
