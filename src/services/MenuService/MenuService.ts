import { DEFAULT_PIECE_COUNT, grid_for_count } from '@src/components/pz-piece-counts/grid';
import { GameService } from '@src/services/GameService/GameService';
import { set_image } from '@src/services/GameService/game.session';
import { ImageLoader } from '@src/services/ImageLoader/ImageLoader';
import { DEFAULT_NAME, ImageStore } from '@src/services/ImageStore/ImageStore';
import { SaveService } from '@src/services/SaveService/SaveService';
import { CallbacksPool } from '@src/utils/CallbacksPool';

const is_image_blob = (blob: Blob) =>
  blob.size > 0 && (blob.type.startsWith('image/') || blob.type === '' || blob.type === 'application/octet-stream');

export class MenuService {
  static instance: MenuService;

  static boot = (): MenuService => new MenuService();

  #on_open_pool = new CallbacksPool();
  #on_close_pool = new CallbacksPool();
  #on_selection_pool = new CallbacksPool();
  #on_recent_pool = new CallbacksPool<[ImageStore.StoredImage[]]>();
  #on_count_pool = new CallbacksPool<[number]>();
  #on_error_pool = new CallbacksPool<[string]>();

  on_open = this.#on_open_pool.add;
  on_close = this.#on_close_pool.add;
  on_selection = this.#on_selection_pool.add;
  on_recent = this.#on_recent_pool.add;
  on_count = this.#on_count_pool.add;
  on_error = this.#on_error_pool.add;

  is_open = true;
  selected: ImageStore.StoredImage | null = null;
  loaded: ImageLoader.LoadedImage | null = null;
  piece_count = DEFAULT_PIECE_COUNT;
  #recent_cache: ImageStore.StoredImage[] = [];

  constructor() {
    MenuService.instance = this;
  }

  init = async () => {
    try {
      const stored = await ImageStore.list();

      // Drop records that are not images (e.g. an HTML error page saved by a failed default fetch).
      const broken = stored.filter(item => !is_image_blob(item.blob));

      if (broken.length > 0) {
        await Promise.all(broken.map(item => ImageStore.remove(item.id)));
      }

      const valid = stored.filter(item => is_image_blob(item.blob));

      // Always keep the bundled default around, even if it was never stored or got removed.
      if (!valid.some(item => item.name === DEFAULT_NAME)) {
        const response = await fetch(ImageLoader.default_url);
        const blob = response.ok ? await response.blob() : null;

        if (blob !== null && is_image_blob(blob)) {
          await ImageStore.save(blob, DEFAULT_NAME);
        }
      }

      // Records from before the thumbnail feature have no `thumb`; fill them in once.
      await ImageStore.ensure_thumbs();
    } catch {
      // storage unavailable; the file picker still works
    }

    await this.reload_recent();
  };

  #emit_recent = () => {
    this.#on_recent_pool.invoke(this.#recent_cache);
  };

  reload_recent = async () => {
    try {
      this.#recent_cache = await ImageStore.list();
      this.#emit_recent();
    } catch {
      this.#on_error_pool.invoke('image storage unavailable');
    }
  };

  add_file = async (file: File) => {
    try {
      const stored = await ImageStore.save(file, file.name);

      this.#recent_cache = [stored, ...this.#recent_cache.filter(item => item.id !== stored.id)].slice(
        0,
        ImageStore.RECENT_LIMIT,
      );

      this.#emit_recent();
      await this.select(stored);
    } catch {
      // Storage can be unavailable (Safari private mode, quota, older iOS). The file itself is still
      // playable, so fall back to an in-memory selection that simply is not persisted.
      try {
        const loaded = await ImageLoader.load_blob(file);

        this.loaded = loaded;
        this.selected = { id: -1, name: file.name, blob: file, thumb: null, added: Date.now() };
        this.#on_selection_pool.invoke();
      } catch (error) {
        console.error('[mini-puzzle] could not load image', error);
        this.#on_error_pool.invoke('could not load image');
      }
    }
  };

  select = async (stored: ImageStore.StoredImage) => {
    try {
      this.loaded = await ImageLoader.load_blob(stored.blob);
      this.selected = stored;
      this.#on_selection_pool.invoke();
    } catch {
      this.#on_error_pool.invoke('could not read image');
    }
  };

  set_count = (count: number) => {
    this.piece_count = count;
    this.#on_count_pool.invoke(count);
  };

  open = () => {
    this.is_open = true;
    this.#on_open_pool.invoke();
    this.#emit_recent();
  };

  close = () => {
    this.is_open = false;
    this.#on_close_pool.invoke();
  };

  start = () => {
    const loaded = this.loaded;
    const selected = this.selected;

    if (!loaded || !selected) {
      return;
    }

    const game_service = GameService.instance;

    if (!game_service?.engine || !game_service.game) {
      return;
    }

    const engine = game_service.engine;
    const game = game_service.game;

    game.grid = grid_for_count(loaded.width, loaded.height, this.piece_count);
    set_image(engine, game, loaded);

    // Only persist a resume point when the image is actually stored (id >= 0).
    if (selected.id >= 0) {
      SaveService.set_image(selected.id, selected.added);
      SaveService.mark_dirty();
    }

    this.close();
  };

  continue_saved = async () => {
    if (await SaveService.continue_saved()) {
      this.close();
      return true;
    }

    this.#on_error_pool.invoke('could not restore saved game');
    return false;
  };
}
