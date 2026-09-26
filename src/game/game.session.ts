import { board_bounds, create_board, scatter_board } from './entities/board/board';
import { clamp_grid, type GridSpec } from './entities/board/board.layout';
import { fit_camera_rect } from './entities/misc/center_camera';
import type { LoadedImage } from './entities/image/image.loader';

const VIEW_PAD_MUL = 0.15;

const reset_drag = (game: PUZZLE.GameState) => {
  game.drag.active = false;
  game.drag.piece_id = -1;
  game.drag.offset_x = 0;
  game.drag.offset_y = 0;
  game.drag.moved = false;
};

const fit_view = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
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

export const new_game = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState, grid: GridSpec) => {
  if (game.source === null || game.source_width <= 0 || game.source_height <= 0) {
    return;
  }

  const clamped = clamp_grid(game.source_width, game.source_height, grid);
  game.grid = clamped;

  const board = create_board(game.source, 0, 0, game.source_width, game.source_height, clamped.cols, clamped.rows);

  scatter_board(board);

  game.board = board;
  game.solved = false;
  game.moves = 0;
  game.elapsed_ms = 0;

  reset_drag(game);
  fit_view(engine, game);
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

export const set_image = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState, image: LoadedImage) => {
  game.source = image.source;
  game.source_width = image.width;
  game.source_height = image.height;

  new_game(engine, game, game.grid);
};
