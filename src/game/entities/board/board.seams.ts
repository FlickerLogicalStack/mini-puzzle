export type ConnectorShape = 'rect' | 'tri';

export type Connector = {
  shape: ConnectorShape;
  t: number;
  width: number;
  depth: number;
};

export type Seam = {
  side: 1 | -1;
  connectors: Connector[];
};

export type Seams = {
  h_seams: Seam[];
  v_seams: Seam[];
};

const pick_count = (rand: () => number): number => {
  const value = rand();

  if (value < 0.25) {
    return 0;
  }

  if (value < 0.7) {
    return 1;
  }

  if (value < 0.92) {
    return 2;
  }

  return 3;
};

const make_seam = (length: number, min_dim: number, rand: () => number): Seam => {
  const count = pick_count(rand);
  const side: 1 | -1 = rand() < 0.5 ? 1 : -1;
  const depth = Math.max(4, min_dim * 0.18);
  const connectors: Connector[] = [];

  if (count > 0 && length > 0) {
    const width = Math.max(6, (Math.min(length, min_dim) * 0.35) / count);
    const slot = length / (count + 1);
    const margin = width / 2 + 2;
    const min_t = margin / length;
    const max_t = 1 - margin / length;

    for (let i = 0; i < count; i++) {
      const base = (i + 1) / (count + 1);
      const jitter = ((rand() - 0.5) * slot * 0.4) / length;

      let t = base + jitter;

      t = min_t <= max_t ? Math.min(max_t, Math.max(min_t, t)) : 0.5;

      connectors.push({ shape: rand() < 0.5 ? 'rect' : 'tri', t, width, depth });
    }
  }

  return { side, connectors };
};

// h_seams: vertical shared edges between columns; index row * (cols - 1) + col; length = ph.
// v_seams: horizontal shared edges between rows; index row * cols + col; length = pw.
export const build_seams = (
  cols: number,
  rows: number,
  pw: number,
  ph: number,
  rand: () => number = Math.random,
): Seams => {
  const min_dim = Math.min(pw, ph);
  const h_seams: Seam[] = [];
  const v_seams: Seam[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      h_seams.push(make_seam(ph, min_dim, rand));
    }
  }

  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols; col++) {
      v_seams.push(make_seam(pw, min_dim, rand));
    }
  }

  return { h_seams, v_seams };
};
