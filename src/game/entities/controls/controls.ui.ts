import { max_grid_side, type GridSpec } from '../board/board.layout';
import { board_bounds } from '../board/board';
import { center_camera_rect, fit_camera_rect } from '../misc/center_camera';
import { new_game, reshuffle } from '../../game.session';
import { grid_value, parse_grid } from './controls';

type ControlsRefs = {
  root: HTMLElement;
  difficulty: HTMLSelectElement;
  new_game: HTMLButtonElement;
  shuffle: HTMLButtonElement;
  target: HTMLInputElement;
  center: HTMLButtonElement;
  fit: HTMLButtonElement;
  fullscreen: HTMLButtonElement;
  hud: HTMLInputElement;
  status: HTMLElement;
};

const query = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;

const refs: ControlsRefs = {
  root: query<HTMLElement>('#controls'),
  difficulty: query<HTMLSelectElement>('#controls-difficulty'),
  new_game: query<HTMLButtonElement>('#controls-new'),
  shuffle: query<HTMLButtonElement>('#controls-shuffle'),
  target: query<HTMLInputElement>('#controls-target'),
  center: query<HTMLButtonElement>('#controls-center'),
  fit: query<HTMLButtonElement>('#controls-fit'),
  fullscreen: query<HTMLButtonElement>('#controls-fullscreen'),
  hud: query<HTMLInputElement>('#controls-hud'),
  status: query<HTMLElement>('#controls-status'),
};

export const toggle_fullscreen = () => {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
};

const sync_fullscreen = () => {
  refs.fullscreen.textContent = document.fullscreenElement ? 'exit' : 'enter';
};

const padded_bounds = (game: PUZZLE.GameState) => {
  if (!game.board) {
    return null;
  }

  const bounds = board_bounds(game.board);
  const pad = Math.max(game.board.pw, game.board.ph) * 0.15;

  return {
    min_x: bounds.min_x - pad,
    min_y: bounds.min_y - pad,
    max_x: bounds.max_x + pad,
    max_y: bounds.max_y + pad,
  };
};

const center_board = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const bounds = padded_bounds(game);

  if (bounds) {
    center_camera_rect(
      game.camera,
      bounds.min_x,
      bounds.min_y,
      bounds.max_x,
      bounds.max_y,
      engine.canvas.width,
      engine.canvas.height,
    );
  }
};

const fit_board = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const bounds = padded_bounds(game);

  if (bounds) {
    fit_camera_rect(
      game.camera,
      bounds.min_x,
      bounds.min_y,
      bounds.max_x,
      bounds.max_y,
      engine.canvas.width,
      engine.canvas.height,
      'contain',
    );
  }
};

export const mount_controls = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  refresh_controls(game);
  sync_fullscreen();

  refs.difficulty.addEventListener('change', () => {
    const grid = parse_grid(refs.difficulty.value);

    if (grid) {
      new_game(engine, game, grid);
    }
  });

  refs.new_game.addEventListener('click', () => new_game(engine, game, game.grid));
  refs.shuffle.addEventListener('click', () => reshuffle(engine, game));
  refs.center.addEventListener('click', () => center_board(engine, game));
  refs.fit.addEventListener('click', () => fit_board(engine, game));
  refs.fullscreen.addEventListener('click', toggle_fullscreen);

  refs.target.addEventListener('change', () => {
    game.target = refs.target.checked;
  });

  refs.hud.addEventListener('change', () => {
    game.hud.enabled = refs.hud.checked ? 1 : 0;
  });

  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.code === 'KeyF') {
      event.preventDefault();
      toggle_fullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    sync_fullscreen();

    requestAnimationFrame(() => fit_board(engine, game));
  });

  refs.root.addEventListener('wheel', event => event.stopPropagation());
  refs.root.addEventListener('keydown', event => event.stopPropagation());
  refs.root.addEventListener('keyup', event => event.stopPropagation());
};

export const refresh_controls = (game: PUZZLE.GameState) => {
  refs.difficulty.value = grid_value(game.grid);
  refs.target.checked = game.target;
  refs.hud.checked = game.hud.enabled === 1;

  const limit = max_grid_side(Math.max(1, game.source_width), Math.max(1, game.source_height));

  for (const option of Array.from(refs.difficulty.options)) {
    const grid: GridSpec | null = parse_grid(option.value);

    option.disabled = grid === null || Math.max(grid.cols, grid.rows) > limit;
  }

  refresh_status(game);
};

export const refresh_status = (game: PUZZLE.GameState) => {
  const board = game.board;
  const total = board ? board.pieces.length : 0;
  const placed = board ? board.pieces.filter(piece => piece.locked).length : 0;

  refs.status.textContent = game.solved
    ? `solved in ${(game.elapsed_ms / 1000).toFixed(1)}s / ${game.moves} moves`
    : total > 0
      ? `placed ${placed}/${total} / moves ${game.moves}`
      : '';

  refs.root.classList.toggle('controls--solved', game.solved);
};
