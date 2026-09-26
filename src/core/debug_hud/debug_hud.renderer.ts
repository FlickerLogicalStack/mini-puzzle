const HUD_STEP = 20;
const HUD_COLOR = 'rgba(0, 255, 42, 1)';

export const render_debug_hud = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  const ctx = engine.ctx;
  const debug_hud = game.debug_hud;

  const fps_avg = debug_hud.frames.avg();

  ctx.fillStyle = HUD_COLOR;
  ctx.font = '16px monospace';

  let cursor = 5;

  const line = (text: string) => {
    cursor += HUD_STEP;
    ctx.fillText(text, 10, cursor);
  };

  line(`fps: ${(fps_avg > 0 ? 1000 / fps_avg : 0).toFixed(1)}`);
  line(`renders: ${debug_hud.renders}`);

  const calls = debug_hud.ctx_calls;

  line(`board.save: ${calls.save}`);
  line(`board.restore: ${calls.restore}`);
  line(`board.translate: ${calls.translate}`);
  line(`board.scale: ${calls.scale}`);
  line(`board.clip: ${calls.clip}`);
  line(`board.drawImage: ${calls.drawImage}`);
  line(`board.ctx total: ${calls.save + calls.restore + calls.translate + calls.scale + calls.clip + calls.drawImage}`);

  if (game.board) {
    const total = game.board.pieces.length;
    const placed = game.board.pieces.filter(piece => piece.locked).length;

    line(`pieces: ${placed}/${total}`);
  }
};
