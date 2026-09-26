import './pz-menu.css';

import { MenuService } from '@src/services/MenuService/MenuService';
import { SaveService } from '@src/services/SaveService/SaveService';
import type { Unsubscribe } from '@src/types/types';
import { e } from '@src/utils/e';
import { register_web_component } from '@src/utils/register_web_component';
import { PzButton } from '../pz-button/pz-button';
import { PzDropzone } from '../pz-dropzone/pz-dropzone';
import { PzPieceCounts } from '../pz-piece-counts/pz-piece-counts';
import { PzRecentList } from '../pz-recent-list/pz-recent-list';

export class PzMenu extends HTMLElement {
  static WC_IS = 'pz-menu';

  #dropzone = new PzDropzone();
  #recent = new PzRecentList();
  #counts = new PzPieceCounts();
  #continue = new PzButton('continue', ['continue'], () => void MenuService.instance.continue_saved());
  #start = new PzButton('start', ['start game'], () => MenuService.instance.start());
  #error = e.div({ c: 'menu__error' });
  #unsubs: Unsubscribe[] = [];

  constructor() {
    super();

    this.classList.add('menu');

    this.#continue.className = 'menu__start';
    this.#start.className = 'menu__start';
    this.#continue.hidden = !SaveService.has_saved();
    this.#start.disabled = true;

    const panel = e.div({ c: 'menu__panel' }, [
      e('h1', { c: 'menu__title' }, ['Mini Puzzle']),
      e('section', { c: 'menu__section' }, [this.#dropzone, this.#recent]),
      e('section', { c: 'menu__section' }, [this.#counts]),
      this.#continue,
      this.#start,
      this.#error,
    ]);

    this.append(panel);
  }

  connectedCallback() {
    if (this.#unsubs.length > 0) {
      return;
    }

    this.#unsubs.push(
      this.#dropzone.on_file(file => void MenuService.instance.add_file(file)),
      this.#recent.on_select(stored => void MenuService.instance.select(stored)),
      this.#counts.on_change(count => MenuService.instance.set_count(count)),
      MenuService.instance.on_open(() => this.open()),
      MenuService.instance.on_close(() => this.close()),
      MenuService.instance.on_recent(items => this.#recent.set_items(items)),
      MenuService.instance.on_selection(() => this.#on_selection()),
      MenuService.instance.on_count(() => this.#on_count()),
      MenuService.instance.on_error(message => (this.#error.textContent = message)),
    );
  }

  disconnectedCallback() {
    for (const unsubscribe of this.#unsubs) {
      unsubscribe();
    }

    this.#unsubs = [];
  }

  open = () => {
    this.classList.remove('menu--hidden');
    this.#continue.hidden = !SaveService.has_saved();
  };

  close = () => {
    this.classList.add('menu--hidden');
  };

  #on_selection = () => {
    const service = MenuService.instance;
    const loaded = service.loaded;
    const selected = service.selected;

    this.#counts.set_image(loaded, service.piece_count);
    this.#recent.set_active(selected?.id ?? null);

    if (loaded && selected) {
      this.#dropzone.show_preview(loaded, selected.thumb ?? selected.blob);
    }

    this.#start.disabled = !loaded;
    this.#error.textContent = '';
  };

  #on_count = () => {
    const service = MenuService.instance;

    this.#counts.set_count(service.piece_count);
    this.#counts.set_image(service.loaded, service.piece_count);
  };
}

register_web_component(PzMenu);
