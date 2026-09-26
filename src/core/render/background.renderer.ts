export const render_background = (engine: PUZZLE.EngineContext, _game: PUZZLE.GameState) => {
  engine.ctx.fillStyle = '#0a0e16';
  engine.ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);
};
