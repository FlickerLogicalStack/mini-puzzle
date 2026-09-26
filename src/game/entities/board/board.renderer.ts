import { ZOOM_ANCHOR, to_screen_x, to_screen_y } from '../camera/camera';
import { find, type Board, type Piece } from './board';
import {
  edge_connected,
  max_connector_depth,
  piece_edges,
  piece_polygon,
  type PieceEdgeName,
} from './board.geometry';

const EDGE_COLOR = 'rgba(10, 14, 22, 0.85)';
const EDGE_SCREEN_WIDTH = 1.5;

type EdgePath = { name: PieceEdgeName; path: Path2D };
type PiecePaths = { clip: Path2D; edges: EdgePath[] };

const path_cache = new WeakMap<Board, Map<number, PiecePaths>>();

const make_path = (points: number[], close: boolean): Path2D => {
  const path = new Path2D();

  path.moveTo(points[0], points[1]);

  for (let i = 2; i < points.length; i += 2) {
    path.lineTo(points[i], points[i + 1]);
  }

  if (close) {
    path.closePath();
  }

  return path;
};

const paths_for = (board: Board, piece: Piece): PiecePaths => {
  let cache = path_cache.get(board);

  if (!cache) {
    cache = new Map();
    path_cache.set(board, cache);
  }

  let paths = cache.get(piece.id);

  if (!paths) {
    const edges = piece_edges(board, piece);
    const edge_paths: EdgePath[] = edges.map((edge, index) => {
      const next = edges[(index + 1) % edges.length];

      // stroke the edge plus the straight run to the next corner
      return { name: edge.name, path: make_path([...edge.points, next.points[0], next.points[1]], false) };
    });

    paths = { clip: make_path(piece_polygon(board, piece), true), edges: edge_paths };
    cache.set(piece.id, paths);
  }

  return paths;
};

const build_draw_list = (board: Board, dragged: number): number[] => {
  const free: number[] = [];
  const locked: number[] = [];
  const drag: number[] = [];

  for (const id of board.order) {
    const root = find(board, id);

    if (dragged !== -1 && root === dragged) {
      drag.push(id);
    } else if (board.pieces[id].locked) {
      locked.push(id);
    } else {
      free.push(id);
    }
  }

  return free.concat(locked, drag);
};

export const render_board = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const board = game.board;

  if (!board) {
    return;
  }

  const ctx = engine.ctx;
  const camera = game.camera;
  const width = engine.canvas.width;
  const height = engine.canvas.height;
  const zoom = camera.zoom;
  const bleed = max_connector_depth(board);

  const offset_x = camera.x * zoom + (width / 2) * (ZOOM_ANCHOR - zoom);
  const offset_y = -camera.y * zoom + (height / 2) * (ZOOM_ANCHOR - zoom);

  const min_x = (-bleed - offset_x) / zoom;
  const max_x = (width + bleed - offset_x) / zoom;
  const min_y = (-bleed - offset_y) / zoom;
  const max_y = (height + bleed - offset_y) / zoom;

  const dragged = game.drag.active ? find(board, game.drag.piece_id) : -1;
  const draw_list = build_draw_list(board, dragged);

  for (const id of draw_list) {
    const piece = board.pieces[id];

    if (
      piece.x + board.pw + bleed < min_x ||
      piece.x - bleed > max_x ||
      piece.y + board.ph + bleed < min_y ||
      piece.y - bleed > max_y
    ) {
      continue;
    }

    const paths = paths_for(board, piece);
    const source_x = board.src_x + piece.col * board.pw;
    const source_y = board.src_y + piece.row * board.ph;

    const clip_x = Math.max(board.src_x, source_x - bleed);
    const clip_y = Math.max(board.src_y, source_y - bleed);
    const clip_right = Math.min(board.src_x + board.src_w, source_x + board.pw + bleed);
    const clip_bottom = Math.min(board.src_y + board.src_h, source_y + board.ph + bleed);

    ctx.save();
    ctx.translate(to_screen_x(camera, width, piece.x), to_screen_y(camera, height, piece.y));
    ctx.scale(zoom, zoom);

    ctx.save();
    ctx.clip(paths.clip);
    ctx.drawImage(
      board.source,
      clip_x,
      clip_y,
      clip_right - clip_x,
      clip_bottom - clip_y,
      clip_x - source_x,
      clip_y - source_y,
      clip_right - clip_x,
      clip_bottom - clip_y,
    );
    ctx.restore();

    // Stroke only edges whose neighbour is NOT in the same group: joined seams disappear.
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_SCREEN_WIDTH / zoom;

    for (const edge of paths.edges) {
      if (edge_connected(board, piece, edge.name)) {
        continue;
      }

      ctx.stroke(edge.path);
    }

    ctx.restore();

    game.hud.renders += 1;
  }
};
