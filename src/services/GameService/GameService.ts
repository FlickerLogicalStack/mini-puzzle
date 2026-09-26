import { create_engine_context, set_loop_paused, start_loop, type EngineContext } from '@src/core/engine/engine';
import { render_board } from '@src/core/board/board.renderer';
import { render_debug_hud } from '@src/core/debug_hud/debug_hud.renderer';
import { reset_ctx_calls } from '@src/core/debug_hud/ctx_calls';
import { render_target } from '@src/core/render/target.renderer';
import { render_background } from '@src/core/render/background.renderer';
import { render_board_frame } from '@src/core/render/board_frame.renderer';
import { handle_gameplay } from './game.gameplay';
import { handle_input } from './game.inputs';
import { create_game_state, setup_game_state } from './game.state';

const on_frame = (engine: EngineContext, game: PUZZLE.GameState) => {
  handle_input(engine, game);
  handle_gameplay(engine, game);

  game.debug_hud.renders = 0;
  reset_ctx_calls(game.debug_hud.ctx_calls);

  render_background(engine, game);
  render_board_frame(engine, game);

  if (game.target === true) {
    render_target(engine, game);
  }

  render_board(engine, game);

  if (game.debug_hud.enabled === 1) {
    render_debug_hud(engine, game);
  }
};

export class GameService {
  static instance: GameService;

  engine: EngineContext | null = null;
  game: PUZZLE.GameState | null = null;

  #paused = false;

  constructor() {
    GameService.instance = this;
  }

  get paused(): boolean {
    return this.#paused;
  }

  set paused(value: boolean) {
    this.#paused = value;

    if (this.engine) {
      set_loop_paused(this.engine, value);
    }
  }

  boot = async (canvas: HTMLCanvasElement): Promise<void> => {
    const engine = create_engine_context(canvas);
    const game = create_game_state(engine);

    this.engine = engine;
    this.game = game;

    setup_game_state(engine, game);

    start_loop(engine, game, on_frame);

    set_loop_paused(engine, this.#paused);
  };
}
