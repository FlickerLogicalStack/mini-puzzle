import { find, piece_at, type Board, type Piece } from './board';
import type { Seam } from './board.seams';
import { knob_outline } from './knob';

const emit_seam = (
  points: number[],
  seam: Seam,
  length: number,
  origin_x: number,
  origin_y: number,
  along_x: boolean,
  normal_x: number,
  normal_y: number,
  reverse: boolean,
): void => {
  const connectors = [...seam.connectors].sort((a, b) => a.t - b.t);
  const detour: number[] = [];

  for (const connector of connectors) {
    const center = connector.t * length;
    const u0 = center - connector.width / 2;
    const u1 = center + connector.width / 2;

    const outline: ReadonlyArray<readonly [number, number]> =
      connector.shape === 'knob'
        ? knob_outline(connector.width, connector.depth).map(([u, w]) => [center + u, w] as const)
        : connector.shape === 'rect'
          ? [
              [u0, 0],
              [u0, connector.depth],
              [u1, connector.depth],
              [u1, 0],
            ]
          : [
              [u0, 0],
              [center, connector.depth],
              [u1, 0],
            ];

    for (const [u, w] of outline) {
      const v = w * seam.side;

      if (along_x) {
        detour.push(origin_x + u, origin_y + normal_y * v);
      } else {
        detour.push(origin_x + normal_x * v, origin_y + u);
      }
    }
  }

  if (reverse) {
    for (let i = detour.length - 2; i >= 0; i -= 2) {
      points.push(detour[i], detour[i + 1]);
    }
  } else {
    for (let i = 0; i < detour.length; i += 2) {
      points.push(detour[i], detour[i + 1]);
    }
  }
};

/** Which side of a piece an edge belongs to. */
export type PieceEdgeName = 'top' | 'right' | 'bottom' | 'left';

export type PieceEdge = {
  /** Side this edge traces. */
  name: PieceEdgeName;
  /** Flat local polygon points `[x0, y0, x1, y1, ...]`: the start corner plus connector detours. */
  points: number[];
};

export const piece_edges = (board: Board, piece: Piece): PieceEdge[] => {
  const { cols, rows, pw, ph } = board;
  const origin_x = piece.col * pw;
  const origin_y = piece.row * ph;
  const edges: PieceEdge[] = [];

  const top: number[] = [origin_x, origin_y];

  if (piece.row > 0) {
    emit_seam(top, board.v_seams[(piece.row - 1) * cols + piece.col], pw, origin_x, origin_y, true, 0, 1, false);
  }

  edges.push({ name: 'top', points: top });

  const right: number[] = [origin_x + pw, origin_y];

  if (piece.col < cols - 1) {
    emit_seam(right, board.h_seams[piece.row * (cols - 1) + piece.col], ph, origin_x + pw, origin_y, false, 1, 0, false);
  }

  edges.push({ name: 'right', points: right });

  const bottom: number[] = [origin_x + pw, origin_y + ph];

  if (piece.row < rows - 1) {
    emit_seam(bottom, board.v_seams[piece.row * cols + piece.col], pw, origin_x, origin_y + ph, true, 0, 1, true);
  }

  edges.push({ name: 'bottom', points: bottom });

  const left: number[] = [origin_x, origin_y + ph];

  if (piece.col > 0) {
    emit_seam(left, board.h_seams[piece.row * (cols - 1) + piece.col - 1], ph, origin_x, origin_y, false, 1, 0, true);
  }

  edges.push({ name: 'left', points: left });

  for (const edge of edges) {
    for (let i = 0; i < edge.points.length; i += 2) {
      edge.points[i] -= origin_x;
      edge.points[i + 1] -= origin_y;
    }
  }

  return edges;
};

// Piece polygons are position-independent (local coords only), so they are cached per board id.
const polygon_cache = new WeakMap<Board, Array<number[] | undefined>>();

export const piece_polygon = (board: Board, piece: Piece): number[] => {
  let cache = polygon_cache.get(board);

  if (!cache) {
    cache = [];
    polygon_cache.set(board, cache);
  }

  let polygon = cache[piece.id];

  if (!polygon) {
    polygon = build_piece_polygon(board, piece);
    cache[piece.id] = polygon;
  }

  return polygon;
};

const build_piece_polygon = (board: Board, piece: Piece): number[] => {
  const points: number[] = [];

  for (const edge of piece_edges(board, piece)) {
    points.push(...edge.points);
  }

  return points;
};

export const neighbor_piece = (board: Board, piece: Piece, name: PieceEdgeName): Piece | undefined => {
  if (name === 'top') {
    return piece_at(board, piece.col, piece.row - 1);
  }

  if (name === 'right') {
    return piece_at(board, piece.col + 1, piece.row);
  }

  if (name === 'bottom') {
    return piece_at(board, piece.col, piece.row + 1);
  }

  return piece_at(board, piece.col - 1, piece.row);
};

export const edge_connected = (board: Board, piece: Piece, name: PieceEdgeName): boolean => {
  const neighbor = neighbor_piece(board, piece, name);

  return neighbor !== undefined && find(board, neighbor.id) === find(board, piece.id);
};

export const point_in_polygon = (points: number[], x: number, y: number): boolean => {
  let inside = false;

  const count = points.length / 2;

  for (let i = 0, j = count - 1; i < count; j = i++) {
    const xi = points[i * 2];
    const yi = points[i * 2 + 1];
    const xj = points[j * 2];
    const yj = points[j * 2 + 1];

    const crosses = yi > y !== yj > y && x <= ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
};

export const hit_test = (board: Board, world_x: number, world_y: number, order: number[]): Piece | null => {
  const depth = max_connector_depth(board);

  for (let i = order.length - 1; i >= 0; i--) {
    const piece = board.pieces[order[i]];

    if (
      world_x < piece.x - depth ||
      world_y < piece.y - depth ||
      world_x > piece.x + board.pw + depth ||
      world_y > piece.y + board.ph + depth
    ) {
      continue;
    }

    if (point_in_polygon(piece_polygon(board, piece), world_x - piece.x, world_y - piece.y)) {
      return piece;
    }
  }

  return null;
};

export const max_connector_depth = (board: Board): number => board.bleed;
