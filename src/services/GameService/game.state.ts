import { DEFAULT_GRID } from '@src/components/pz-piece-counts/grid';
import { create_camera } from '@src/core/camera/camera';
import { create_debug_hud } from '@src/core/debug_hud/debug_hud';
import { fit_view } from '@src/services/GameService/game.session';
import { SaveService } from '@src/services/SaveService/SaveService';

export const create_game_state = (_engine: PUZZLE.EngineContext): PUZZLE.GameState => ({
  source: null,
  source_width: 0,
  source_height: 0,
  board: null,
  camera: create_camera(),
  debug_hud: create_debug_hud(),
  drag: { active: false, piece_id: -1, offset_x: 0, offset_y: 0, moved: false },
  target: false,
  solved: false,
  moves: 0,
  elapsed_ms: 0,
  grid: { cols: DEFAULT_GRID.cols, rows: DEFAULT_GRID.rows },
});

export const setup_game_state = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  SaveService.mount(engine, game);

  document.addEventListener('fullscreenchange', () => {
    requestAnimationFrame(() => fit_view(engine, game));
  });
};
