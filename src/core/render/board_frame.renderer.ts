import { to_screen_x, to_screen_y } from '../camera/camera';

// Background tint + dashed outline of the board rectangle, drawn under the pieces so the
// playfield boundaries are always visible.
const FRAME_FILL = 'rgba(96, 121, 242, 0.05)';
const FRAME_COLOR = 'rgba(96, 121, 242, 0.5)';
const FRAME_WIDTH = 1.5;
const FRAME_DASH = [8, 8];

export const render_board_frame = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const board = game.board;

  if (!board) {
    return;
  }

  const ctx = engine.ctx;
  const camera = game.camera;
  const width = engine.canvas.width;
  const height = engine.canvas.height;

  const screen_x = to_screen_x(camera, width, 0);
  const screen_y = to_screen_y(camera, height, 0);
  const screen_w = board.width * camera.zoom;
  const screen_h = board.height * camera.zoom;

  ctx.save();
  ctx.fillStyle = FRAME_FILL;
  ctx.fillRect(screen_x, screen_y, screen_w, screen_h);
  ctx.strokeStyle = FRAME_COLOR;
  ctx.lineWidth = FRAME_WIDTH;
  ctx.setLineDash(FRAME_DASH);
  ctx.strokeRect(screen_x, screen_y, screen_w, screen_h);
  ctx.restore();
};
