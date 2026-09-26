import { refresh_status } from './entities/controls/controls.ui';

export const handle_gameplay = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  if (game.hud.enabled === 1) {
    game.hud.frames.push(engine.delta);
  }

  if (game.board && !game.solved && game.moves > 0) {
    game.elapsed_ms += engine.delta;
  }

  refresh_status(game);
};
