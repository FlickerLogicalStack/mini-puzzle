import './pz-piece-counts.css';

import { MIN_PIECE_PX } from '@src/core/board/board.layout';
import type { ImageLoader } from '@src/services/ImageLoader/ImageLoader';
import { CallbacksPool } from '@src/utils/CallbacksPool';
import { e } from '@src/utils/e';
import { register_web_component } from '@src/utils/register_web_component';
import { PzButton } from '../pz-button/pz-button';
import { DEFAULT_PIECE_COUNT, PIECE_COUNTS, grid_for_count, grid_label } from './grid';

export class PzPieceCounts extends HTMLElement {
  static WC_IS = 'pz-piece-counts';

  #on_change_pool = new CallbacksPool<[number]>();
  on_change = this.#on_change_pool.add;

  #count = DEFAULT_PIECE_COUNT;
  #has_image = false;
  #width = 0;
  #height = 0;

  #hint = e.div({ c: 'menu__hint' });

  #select = (count: number) => {
    if (count === this.#count) {
      return;
    }

    this.#count = count;
    this.#sync();
    this.#on_change_pool.invoke(count);
  };

  #buttons = PIECE_COUNTS.map(count => {
    const button = new PzButton(String(count), [String(count)], () => this.#select(count));

    button.className = 'menu__count';

    return button;
  });

  #list = e.div({ c: 'menu__counts' }, this.#buttons);

  constructor() {
    super();

    this.append(this.#list, this.#hint);
    this.#sync();
  }

  set_count = (count: number) => {
    this.#count = count;
    this.#sync();
  };

  set_image = (image: ImageLoader.LoadedImage | null, count: number) => {
    this.#has_image = image !== null;
    this.#width = image?.width ?? 0;
    this.#height = image?.height ?? 0;
    this.#count = count;
    this.#sync();
  };

  #sync = () => {
    this.#buttons.forEach((button, index) => {
      button.classList.toggle('menu__count--active', PIECE_COUNTS[index] === this.#count);
    });

    this.#hint.textContent = this.#hint_text();
  };

  #hint_text = () => {
    if (!this.#has_image) {
      return '';
    }

    const grid = grid_for_count(this.#width, this.#height, this.#count);
    const low_res = Math.min(this.#width / grid.cols, this.#height / grid.rows) < MIN_PIECE_PX;

    return `${this.#count} pieces · ${grid_label(grid)}${low_res ? ' · low-res' : ''}`;
  };
}

register_web_component(PzPieceCounts);
