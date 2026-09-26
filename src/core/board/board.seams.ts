/** Kind of connector profile used for rendering/hit-test. `knob` is the realistic jigsaw tab. */
export type ConnectorShape = 'rect' | 'tri' | 'knob';

export type Connector = {
  /** Profile used to build the connector outline. */
  shape: ConnectorShape;
  /** Center of the connector along the seam, as a fraction of its length (0..1). */
  t: number;
  /** Size along the seam, in world (source-image) pixels. */
  width: number;
  /** Protrusion away from the seam, in world pixels; also the bleed the renderer adds. */
  depth: number;
};

export type Seam = {
  /** Which side of the seam line the connector occupies: +1 along the canonical normal, -1 against. */
  side: 1 | -1;
  /** Connectors placed on this seam (currently exactly one, centered). */
  connectors: Connector[];
};

export type Seams = {
  /** Vertical seams between columns: index `row * (cols - 1) + col`. */
  h_seams: Seam[];
  /** Horizontal seams between rows: index `row * cols + col`. */
  v_seams: Seam[];
};

// Every interior seam gets exactly one connector, so every piece has a connector on each of its
// interior sides: corners 2, border pieces 3, interior pieces 4. Edges are then a natural place to
// start assembling. Only the shape, the side and the size vary.
const make_seam = (length: number, min_dim: number, rand: () => number): Seam => {
  const side: 1 | -1 = rand() < 0.5 ? 1 : -1;
  const width = Math.max(6, Math.min(length, min_dim) * 0.3);
  const depth = Math.max(4, width);

  return {
    side,
    connectors: [{ shape: 'knob', t: 0.5, width, depth }],
  };
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

// Largest connector depth across all seams; used as the render bleed.
export const max_seam_depth = (seams: Seams): number => {
  let depth = 0;

  for (const seam of seams.h_seams) {
    for (const connector of seam.connectors) {
      if (connector.depth > depth) depth = connector.depth;
    }
  }

  for (const seam of seams.v_seams) {
    for (const connector of seam.connectors) {
      if (connector.depth > depth) depth = connector.depth;
    }
  }

  return depth;
};
