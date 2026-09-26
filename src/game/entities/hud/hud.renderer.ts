const HUD_STEP = 20;
const HUD_COLOR = 'rgba(207, 214, 230, 0.9)';

export const render_hud = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const ctx = engine.ctx;
  const hud = game.hud;

  const fps_avg = hud.frames.avg();

  ctx.fillStyle = HUD_COLOR;
  ctx.font = '16px monospace';

  let cursor = 5;

  const line = (text: string) => {
    cursor += HUD_STEP;
    ctx.fillText(text, 10, cursor);
  };

  line(`fps: ${(fps_avg > 0 ? 1000 / fps_avg : 0).toFixed(1)}`);
  line(`renders: ${hud.renders}`);

  if (game.board) {
    const total = game.board.pieces.length;
    const placed = game.board.pieces.filter(piece => piece.locked).length;

    line(`pieces: ${placed}/${total}`);
  }

  line(`moves: ${game.moves}`);
  line(`time: ${(game.elapsed_ms / 1000).toFixed(1)}s`);
};
