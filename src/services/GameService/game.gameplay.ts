export const handle_gameplay = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  if (game.debug_hud.enabled === 1) {
    game.debug_hud.frames.push(engine.delta);
  }

  if (game.board && !game.solved && game.moves > 0) {
    game.elapsed_ms += engine.delta;
  }
};
