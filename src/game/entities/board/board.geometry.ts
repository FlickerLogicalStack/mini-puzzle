import { find, piece_at, type Board, type Piece } from './board';
import type { Seam } from './board.seams';

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
  for (const connector of seam.connectors) {
    const center = connector.t * length;
    const u0 = center - connector.width / 2;
    const u1 = center + connector.width / 2;

    const outline: ReadonlyArray<readonly [number, number]> =
      connector.shape === 'rect'
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

    const ordered = reverse ? [...outline].reverse() : outline;

    for (const [u, w] of ordered) {
      const v = w * seam.side;

      if (along_x) {
        points.push(origin_x + u, origin_y + normal_y * v);
      } else {
        points.push(origin_x + normal_x * v, origin_y + u);
      }
    }
  }
};

export type PieceEdgeName = 'top' | 'right' | 'bottom' | 'left';

export type PieceEdge = {
  name: PieceEdgeName;
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

export const piece_polygon = (board: Board, piece: Piece): number[] => {
  const points: number[] = [];

  for (const edge of piece_edges(board, piece)) {
    points.push(...edge.points);
  }

  return points;
};

export const edge_connected = (board: Board, piece: Piece, name: PieceEdgeName): boolean => {
  const neighbor =
    name === 'top'
      ? piece_at(board, piece.col, piece.row - 1)
      : name === 'right'
        ? piece_at(board, piece.col + 1, piece.row)
        : name === 'bottom'
          ? piece_at(board, piece.col, piece.row + 1)
          : piece_at(board, piece.col - 1, piece.row);

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

export const max_connector_depth = (board: Board): number => {
  let depth = 0;

  for (const seam of board.h_seams) {
    for (const connector of seam.connectors) {
      if (connector.depth > depth) {
        depth = connector.depth;
      }
    }
  }

  for (const seam of board.v_seams) {
    for (const connector of seam.connectors) {
      if (connector.depth > depth) {
        depth = connector.depth;
      }
    }
  }

  return depth;
};
