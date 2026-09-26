import { create_camera } from './entities/camera/camera';
import { DEFAULT_GRID } from './entities/controls/controls';
import { mount_controls, refresh_controls } from './entities/controls/controls.ui';
import { create_hud } from './entities/hud/hud';
import { load_default_image } from './entities/image/image.loader';
import { mount_image_input } from './entities/image/image.ui';
import { set_image } from './game.session';

export const create_game_state = (_engine: PUZZLE.EngineContext): PUZZLE.GameState => ({
  source: null,
  source_width: 0,
  source_height: 0,
  board: null,
  camera: create_camera(),
  hud: create_hud(),
  drag: { active: false, piece_id: -1, offset_x: 0, offset_y: 0, moved: false },
  target: false,
  solved: false,
  moves: 0,
  elapsed_ms: 0,
  grid: { cols: DEFAULT_GRID.cols, rows: DEFAULT_GRID.rows },
});

export const setup_game_state = (engine: PUZZLE.EngineContext, game: PUZZLE.GameState) => {
  mount_controls(engine, game);

  const apply = (image: Parameters<typeof set_image>[2]) => {
    set_image(engine, game, image);
    refresh_controls(game);
  };

  mount_image_input(image => apply(image));

  void load_default_image()
    .then(image => apply(image))
    .catch(() => undefined);
};
