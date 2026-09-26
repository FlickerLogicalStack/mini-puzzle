import {
  SAVE_VERSION,
  clear_save,
  read_save,
  snapshot_board,
  write_save,
  type SaveData,
  type SaveStorage,
} from '@src/services/SaveService/save';
import { ImageStore } from '@src/services/ImageStore/ImageStore';
import { ImageLoader } from '@src/services/ImageLoader/ImageLoader';
import { start_game, type RestoreData } from '@src/services/GameService/game.session';

const SAVE_DEBOUNCE_MS = 600;

const storage = (): SaveStorage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export class SaveService {
  static #engine_ref: PUZZLE.EngineContext | null = null;
  static #game_ref: PUZZLE.GameState | null = null;
  static #current_image: { id: number; added: number } | null = null;
  static #timer: ReturnType<typeof setTimeout> | null = null;
  static #dirty = false;
  static #has_saved_cache: boolean | null = null;

  static set_image(id: number, added: number): void {
    SaveService.#current_image = { id, added };
  }

  static has_saved = (): boolean => {
    if (SaveService.#has_saved_cache !== null) {
      return SaveService.#has_saved_cache;
    }

    const store = storage();
    const value = store !== null && read_save(store) !== null;

    SaveService.#has_saved_cache = value;

    return value;
  };

  static flush(): void {
    SaveService.#timer = null;

    if (!SaveService.#dirty) {
      return;
    }

    SaveService.#dirty = false;

    const game = SaveService.#game_ref;
    const store = storage();

    if (!game || game.board === null || SaveService.#current_image === null || store === null) {
      return;
    }

    const { pieces, parent } = snapshot_board(game.board);

    const data: SaveData = {
      version: SAVE_VERSION,
      image_id: SaveService.#current_image.id,
      image_added: SaveService.#current_image.added,
      grid: { cols: game.grid.cols, rows: game.grid.rows },
      pieces,
      parent,
      camera: { x: game.camera.x, y: game.camera.y, zoom: game.camera.zoom },
      moves: game.moves,
      elapsed_ms: game.elapsed_ms,
      solved: game.solved,
      target: game.target,
      debug_hud: game.debug_hud.enabled,
      saved_at: Date.now(),
    };

    write_save(store, data);
  }

  static mark_dirty(): void {
    SaveService.#has_saved_cache = null;
    SaveService.#dirty = true;

    if (SaveService.#timer === null) {
      SaveService.#timer = setTimeout(SaveService.flush, SAVE_DEBOUNCE_MS);
    }
  }

  static clear(): void {
    SaveService.#has_saved_cache = null;

    const store = storage();

    if (store) {
      clear_save(store);
    }

    if (SaveService.#timer !== null) {
      clearTimeout(SaveService.#timer);
      SaveService.#timer = null;
    }

    SaveService.#dirty = false;
    SaveService.#current_image = null;
  }

  static async continue_saved(): Promise<boolean> {
    const game = SaveService.#game_ref;
    const engine = SaveService.#engine_ref;
    const store = storage();

    if (!game || !engine || !store) {
      return false;
    }

    const save = read_save(store);

    if (!save) {
      return false;
    }

    const stored = await ImageStore.load(save.image_id).catch(() => null);

    if (!stored || stored.added !== save.image_added || stored.blob.size === 0) {
      clear_save(store);
      return false;
    }

    const image = await ImageLoader.load_blob(stored.blob).catch(() => null);

    if (!image) {
      return false;
    }

    const restore: RestoreData = { pieces: save.pieces, parent: save.parent };
    const restored = start_game(engine, game, image, save.grid, restore);

    if (!restored) {
      return false;
    }

    game.camera.x = save.camera.x;
    game.camera.y = save.camera.y;
    game.camera.zoom = save.camera.zoom;
    game.moves = save.moves;
    game.elapsed_ms = save.elapsed_ms;
    game.solved = save.solved;
    game.target = save.target;
    game.debug_hud.enabled = save.debug_hud;

    SaveService.#current_image = { id: save.image_id, added: save.image_added };

    return true;
  }

  static mount(engine: PUZZLE.EngineContext, game: PUZZLE.GameState): void {
    SaveService.#has_saved_cache = null;
    SaveService.#engine_ref = engine;
    SaveService.#game_ref = game;

    window.addEventListener('pagehide', on_hide);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        on_hide();
      }
    });
  }
}

const on_hide = () => {
  SaveService.flush();
};
