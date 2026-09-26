import { board_bounds, create_board, scatter_board } from '@src/core/board/board';
import { build_piece_atlas } from '@src/core/board/board.atlas';
import type { GridSpec } from '@src/core/board/board.layout';
import { fit_camera_rect } from '@src/core/render/center_camera';
import type { ImageLoader } from '@src/services/ImageLoader/ImageLoader';
import { restore_board } from '@src/services/SaveService/save';

const VIEW_PAD_MUL = 0.15;

export type RestoreData = {
  pieces: number[];
  parent: number[];
};

const reset_drag = (game: PUZZLE.GameState) => {
  game.drag.active = false;
  game.drag.piece_id = -1;
  game.drag.offset_x = 0;
  game.drag.offset_y = 0;
  game.drag.moved = false;
};

export const fit_view = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  if (!game.board) {
    return;
  }

  const bounds = board_bounds(game.board);
  const pad = Math.max(game.board.pw, game.board.ph) * VIEW_PAD_MUL;

  fit_camera_rect(
    game.camera,
    bounds.min_x - pad,
    bounds.min_y - pad,
    bounds.max_x + pad,
    bounds.max_y + pad,
    engine.canvas.width,
    engine.canvas.height,
    'contain',
  );
};

const build_board = (
  game: PUZZLE.GameState,
  image: ImageLoader.LoadedImage,
  grid: GridSpec,
  restore: RestoreData | null,
): boolean => {
  const cols = Math.max(1, Math.floor(grid.cols));
  const rows = Math.max(1, Math.floor(grid.rows));

  game.grid = { cols, rows };

  const board = create_board(image.source, 0, 0, image.width, image.height, cols, rows);

  build_piece_atlas(board);

  if (restore && restore_board(board, restore.pieces, restore.parent)) {
    game.board = board;
    return true;
  }

  scatter_board(board);
  game.board = board;

  return false;
};

export const start_game = (
  engine: PUZZLE.EngineContext,
  game: PUZZLE.GameState,
  image: ImageLoader.LoadedImage,
  grid: GridSpec,
  restore: RestoreData | null = null,
): boolean => {
  game.source = image.source;
  game.source_width = image.width;
  game.source_height = image.height;

  const restored = build_board(game, image, grid, restore);

  game.solved = false;
  game.moves = 0;
  game.elapsed_ms = 0;

  reset_drag(game);

  if (!restored) {
    fit_view(engine, game);
  }

  return restored;
};

export const new_game = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState, grid: GridSpec) => {
  if (game.source === null || game.source_width <= 0 || game.source_height <= 0) {
    return;
  }

  start_game(engine, game, { source: game.source, width: game.source_width, height: game.source_height }, grid, null);
};

export const reshuffle = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  if (!game.board) {
    return;
  }

  scatter_board(game.board);

  game.solved = false;
  game.moves = 0;
  game.elapsed_ms = 0;

  reset_drag(game);
  fit_view(engine, game);
};

export const set_image = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState, image: ImageLoader.LoadedImage) => {
  game.source = image.source;
  game.source_width = image.width;
  game.source_height = image.height;

  new_game(engine, game, game.grid);
};
