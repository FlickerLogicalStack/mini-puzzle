import './pz-recent-list.css';

import type { ImageStore } from '@src/services/ImageStore/ImageStore';
import { CallbacksPool } from '@src/utils/CallbacksPool';
import { e } from '@src/utils/e';
import { register_web_component } from '@src/utils/register_web_component';

export class PzRecentList extends HTMLElement {
  static WC_IS = 'pz-recent-list';

  #on_select_pool = new CallbacksPool<[ImageStore.StoredImage]>();
  on_select = this.#on_select_pool.add;

  #urls: string[] = [];
  #buttons = new Map<number, HTMLButtonElement>();
  #active_id: number | null = null;
  #signature = '';

  constructor() {
    super();

    this.classList.add('menu__recent');
  }

  set_items = (items: ImageStore.StoredImage[]) => {
    const signature = items.map(image => `${image.id}:${image.added}`).join(',');

    if (signature === this.#signature) {
      this.#sync_active();

      return;
    }

    this.#signature = signature;

    for (const url of this.#urls) {
      URL.revokeObjectURL(url);
    }

    this.#urls = [];
    this.#buttons.clear();

    const buttons = items.map(image => {
      const url = URL.createObjectURL(image.thumb ?? image.blob);

      this.#urls.push(url);

      const button = e.button({ type: 'button', c: 'menu__thumb' });
      const img = e.img({ src: url, alt: '', loading: 'lazy' });

      button.append(img);
      button.addEventListener('click', () => this.#on_select_pool.invoke(image));

      this.#buttons.set(image.id, button);

      return button;
    });

    this.replaceChildren(...buttons);
    this.#sync_active();
  };

  set_active = (id: number | null) => {
    this.#active_id = id;
    this.#sync_active();
  };

  #sync_active = () => {
    for (const [id, button] of this.#buttons) {
      button.classList.toggle('menu__thumb--active', this.#active_id === id);
    }
  };

  disconnectedCallback() {
    for (const url of this.#urls) {
      URL.revokeObjectURL(url);
    }

    this.#urls = [];
    this.#buttons.clear();
    this.#signature = '';
  }
}

register_web_component(PzRecentList);
