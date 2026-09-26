import { to_screen_x, to_screen_y } from '../camera/camera';

export const render_target = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const board = game.board;

  if (!game.target || !board) {
    return;
  }

  const ctx = engine.ctx;
  const camera = game.camera;
  const width = engine.canvas.width;
  const height = engine.canvas.height;

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.translate(to_screen_x(camera, width, 0), to_screen_y(camera, height, 0));
  ctx.scale(camera.zoom, camera.zoom);
  ctx.drawImage(board.source, board.src_x, board.src_y, board.src_w, board.src_h, 0, 0, board.width, board.height);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(96, 121, 242, 0.35)';
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(
    to_screen_x(camera, width, 0),
    to_screen_y(camera, height, 0),
    board.width * camera.zoom,
    board.height * camera.zoom,
  );
  ctx.restore();
};
