import { loop } from '../engine/engine';
import { load_resources } from '../engine/resources/resources';
import { render_board } from './entities/board/board.renderer';
import { render_hud } from './entities/hud/hud.renderer';
import { render_target } from './entities/image/image.renderer';
import { render_background } from './entities/misc/background.renderer';
import { render_board_frame } from './entities/misc/board_frame.renderer';
import { handle_gameplay } from './game.gameplay';
import { handle_input } from './game.inputs';
import { create_game_state, setup_game_state } from './game.state';

const on_frame = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  handle_input(engine, game);
  handle_gameplay(engine, game);

  game.hud.renders = 0;

  render_background(engine, game);
  render_board_frame(engine, game);

  if (game.target === true) {
    render_target(engine, game);
  }

  render_board(engine, game);

  if (game.hud.enabled === 1) {
    render_hud(engine, game);
  }
};

void loop(
  () => document.querySelector('canvas') as HTMLCanvasElement,
  load_resources,
  { create: create_game_state, setup: setup_game_state },
  on_frame,
);
