import { ZOOM_ANCHOR, zoom_camera_at, type Camera } from '@src/core/camera/camera';
import { board_bounds, drag_group, find, win, type Board } from '@src/core/board/board';
import { hit_test } from '@src/core/board/board.geometry';
import { lock_group, snap_tolerance, try_snap } from '@src/core/board/board.groups';
import { center_camera_rect } from '@src/core/render/center_camera';
import { toggle_fullscreen } from '@src/utils/fullscreen';
import { clamp } from '@src/utils/clamp';
import { new_game } from '@src/services/GameService/game.session';
import { MenuService } from '@src/services/MenuService/MenuService';
import { SaveService } from '@src/services/SaveService/SaveService';

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
  const pinching = engine.inputs.pinch.active === true;

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
    SaveService.mark_dirty();
  }

  if (kb.KeyH === true) {
    kb.KeyH = false;
    game.debug_hud.enabled ^= 1;
    SaveService.mark_dirty();
  }

  if (kb.KeyG === true) {
    kb.KeyG = false;
    game.target = !game.target;
    SaveService.mark_dirty();
  }

  if (kb.KeyC === true) {
    kb.KeyC = false;
    center_board(engine, game);
  }

  if (kb.KeyF === true) {
    kb.KeyF = false;
    toggle_fullscreen();
  }

  if (kb.Escape === true) {
    kb.Escape = false;
    MenuService.instance?.open();
  }

  if (pinching === false && pointer.pressed === true && board) {
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

  if (pinching === false && pointer.down === true) {
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

  if (pinching === false && pointer.released === true) {
    if (game.drag.active === true && board) {
      const group = find(board, game.drag.piece_id);

      if (game.drag.moved === true) {
        try_snap(board, group, snap_tolerance(board));
        game.moves += 1;

        if (win(board)) {
          lock_group(board, find(board, 0));
          game.solved = true;
        }

        SaveService.mark_dirty();
      }

      game.drag.active = false;
      game.drag.piece_id = -1;
      game.drag.moved = false;
    }
  }

  if (pinching === true) {
    const pinch = engine.inputs.pinch;

    if (pinch.scale !== 1) {
      camera.zoom = clamp(MIN_ZOOM, camera.zoom * pinch.scale, MAX_ZOOM);
    }

    if (pinch.dx !== 0 || pinch.dy !== 0) {
      camera.x += pinch.dx / camera.zoom;
      camera.y -= pinch.dy / camera.zoom;
    }

    if (game.drag.active === true) {
      game.drag.active = false;
      game.drag.piece_id = -1;
      game.drag.moved = false;
    }

    SaveService.mark_dirty();
  }

  if (pointer.wheel !== 0) {
    const next_zoom = clamp(MIN_ZOOM, camera.zoom * (pointer.wheel < 0 ? 1.1 : 1 / 1.1), MAX_ZOOM);

    zoom_camera_at(camera, engine.canvas.width, engine.canvas.height, pointer.x, pointer.y, next_zoom);
  }

  camera.zoom = clamp(MIN_ZOOM, camera.zoom, MAX_ZOOM);

  pointer.dx = 0;
  pointer.dy = 0;
  pointer.wheel = 0;
  pointer.pressed = false;
  pointer.released = false;

  engine.inputs.pinch.scale = 1;
  engine.inputs.pinch.dx = 0;
  engine.inputs.pinch.dy = 0;
};
