import { ZOOM_ANCHOR, type Camera } from './entities/camera/camera';
import { board_bounds, drag_group, find, win, type Board } from './entities/board/board';
import { hit_test } from './entities/board/board.geometry';
import { lock_group, snap_tolerance, try_snap } from './entities/board/board.groups';
import { refresh_controls } from './entities/controls/controls.ui';
import { center_camera_rect } from './entities/misc/center_camera';
import { clamp } from './entities/misc/utils';
import { new_game } from './game.session';

const PAN_SPEED = 600;
const ZOOM_SPEED = 1.5;

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 20;

const screen_to_world = (
  camera: Camera,
  canvas_width: number,
  canvas_height: number,
  screen_x: number,
  screen_y: number,
) => {
  const anchor_x = (canvas_width / 2) * (ZOOM_ANCHOR - camera.zoom);
  const anchor_y = (canvas_height / 2) * (ZOOM_ANCHOR - camera.zoom);

  return {
    x: (screen_x - anchor_x) / camera.zoom - camera.x,
    y: (screen_y - anchor_y) / camera.zoom + camera.y,
  };
};

const bring_to_front = (board: Board, group: number) => {
  const rest: number[] = [];
  const front: number[] = [];

  for (const id of board.order) {
    if (find(board, id) === group) {
      front.push(id);
    } else {
      rest.push(id);
    }
  }

  board.order = rest.concat(front);
};

const center_board = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  if (!game.board) {
    return;
  }

  const bounds = board_bounds(game.board);
  const pad = Math.max(game.board.pw, game.board.ph) * 0.15;

  center_camera_rect(
    game.camera,
    bounds.min_x - pad,
    bounds.min_y - pad,
    bounds.max_x + pad,
    bounds.max_y + pad,
    engine.canvas.width,
    engine.canvas.height,
  );
};

export const handle_input = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const { kb, pointer } = engine.inputs;
  const camera = game.camera;
  const board = game.board;

  const delta = engine.delta_mul;
  const step = (PAN_SPEED * delta) / camera.zoom;

  if (kb.ArrowLeft === true) {
    camera.x += step;
  }

  if (kb.ArrowRight === true) {
    camera.x -= step;
  }

  if (kb.ArrowUp === true) {
    camera.y -= step;
  }

  if (kb.ArrowDown === true) {
    camera.y += step;
  }

  if (kb.Minus === true) {
    camera.zoom /= 1 + ZOOM_SPEED * delta;
  }

  if (kb.Equal === true) {
    camera.zoom *= 1 + ZOOM_SPEED * delta;
  }

  if (kb.KeyN === true) {
    kb.KeyN = false;
    new_game(engine, game, game.grid);
  }

  if (kb.KeyH === true) {
    kb.KeyH = false;
    game.hud.enabled ^= 1;
    refresh_controls(game);
  }

  if (kb.KeyG === true) {
    kb.KeyG = false;
    game.target = !game.target;
    refresh_controls(game);
  }

  if (kb.KeyC === true) {
    kb.KeyC = false;
    center_board(engine, game);
  }

  if (pointer.pressed === true && board) {
    const world = screen_to_world(camera, engine.canvas.width, engine.canvas.height, pointer.x, pointer.y);
    const hit = hit_test(board, world.x, world.y, board.order);

    if (hit && hit.locked === false) {
      game.drag.active = true;
      game.drag.piece_id = hit.id;
      game.drag.offset_x = world.x - hit.x;
      game.drag.offset_y = world.y - hit.y;
      game.drag.moved = false;

      bring_to_front(board, find(board, hit.id));
    }
  }

  if (pointer.down === true) {
    if (game.drag.active === true && board) {
      const group = find(board, game.drag.piece_id);
      const dx = pointer.dx / camera.zoom;
      const dy = pointer.dy / camera.zoom;

      if (dx !== 0 || dy !== 0) {
        drag_group(board, group, dx, dy);
        game.drag.moved = true;
      }
    } else {
      camera.x += pointer.dx / camera.zoom;
      camera.y -= pointer.dy / camera.zoom;
    }
  }

  if (pointer.released === true) {
    if (game.drag.active === true && board) {
      const group = find(board, game.drag.piece_id);

      if (game.drag.moved === true) {
        try_snap(board, group, snap_tolerance(board));
        game.moves += 1;

        if (win(board)) {
          lock_group(board, find(board, 0));
          game.solved = true;
        }

        refresh_controls(game);
      }

      game.drag.active = false;
      game.drag.piece_id = -1;
      game.drag.moved = false;
    }
  }

  if (pointer.wheel !== 0) {
    camera.zoom *= pointer.wheel < 0 ? 1.1 : 1 / 1.1;
  }

  camera.zoom = clamp(MIN_ZOOM, camera.zoom, MAX_ZOOM);

  pointer.dx = 0;
  pointer.dy = 0;
  pointer.wheel = 0;
  pointer.pressed = false;
  pointer.released = false;
};
