import './pz-dropzone.css';

import type { ImageLoader } from '@src/services/ImageLoader/ImageLoader';
import { MenuService } from '@src/services/MenuService/MenuService';
import { CallbacksPool } from '@src/utils/CallbacksPool';
import { e } from '@src/utils/e';
import { register_web_component } from '@src/utils/register_web_component';

export class PzDropzone extends HTMLElement {
  static WC_IS = 'pz-dropzone';

  #on_file_pool = new CallbacksPool<[File]>();
  on_file = this.#on_file_pool.add;

  #input = e.input({ type: 'file', accept: 'image/*', c: 'dropzone__input' });
  #icon = e.span({ c: 'dropzone__icon' });
  #preview = e.img({ c: 'dropzone__preview', alt: '', hidden: true });
  #title = e.div({ c: 'dropzone__title' }, ['Drop an image here']);
  #subtitle = e.div({ c: 'dropzone__subtitle' }, ['click, drag & drop, or paste from clipboard']);
  #text = e.div({ c: 'dropzone__text' }, [this.#title, this.#subtitle]);
  #pick = e.button({ type: 'button', c: 'dropzone__pick' }, ['choose file']);

  #preview_url: string | null = null;
  // Window-level drop/paste must only act while the menu is on screen; otherwise a paste during play would silently load a new image.
  #menu_open = () => MenuService.instance?.is_open === true;

  constructor() {
    super();

    this.classList.add('dropzone');
    this.setAttribute('role', 'button');
    this.tabIndex = 0;
    this.#icon.append(e.icon('image', 36));
    this.append(this.#input, this.#icon, this.#preview, this.#text, this.#pick);
  }

  show_preview = (image: ImageLoader.LoadedImage, blob: Blob) => {
    if (this.#preview_url) {
      URL.revokeObjectURL(this.#preview_url);
    }

    this.#preview_url = URL.createObjectURL(blob);
    this.#preview.src = this.#preview_url;
    this.#preview.hidden = false;
    this.#preview.alt = '';
    this.classList.add('dropzone--filled');
    this.#title.textContent = `${image.width} × ${image.height}`;
    this.#subtitle.textContent = 'click or drop to replace';
    this.#pick.textContent = 'replace';
  };

  connectedCallback() {
    this.addEventListener('click', this.#pick_file);
    this.addEventListener('keydown', this.#on_keydown);
    this.#pick.addEventListener('click', this.#on_pick_click);
    this.#input.addEventListener('change', this.#on_change);
    this.addEventListener('dragover', this.#on_dragover);
    this.addEventListener('dragleave', this.#on_dragleave);
    this.addEventListener('drop', this.#on_drop);
    window.addEventListener('dragover', this.#on_window_dragover);
    window.addEventListener('drop', this.#on_window_drop);
    window.addEventListener('paste', this.#on_window_paste);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#pick_file);
    this.removeEventListener('keydown', this.#on_keydown);
    this.#pick.removeEventListener('click', this.#on_pick_click);
    this.#input.removeEventListener('change', this.#on_change);
    this.removeEventListener('dragover', this.#on_dragover);
    this.removeEventListener('dragleave', this.#on_dragleave);
    this.removeEventListener('drop', this.#on_drop);
    window.removeEventListener('dragover', this.#on_window_dragover);
    window.removeEventListener('drop', this.#on_window_drop);
    window.removeEventListener('paste', this.#on_window_paste);
  }

  #pick_file = () => {
    this.#input.click();
  };

  #on_keydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.#pick_file();
    }
  };

  #on_pick_click = (event: MouseEvent) => {
    event.stopPropagation();
    this.#pick_file();
  };

  #on_change = () => {
    const file = this.#input.files?.[0];

    if (file) {
      this.#on_file_pool.invoke(file);
    }

    this.#input.value = '';
  };

  #on_dragover = (event: DragEvent) => {
    event.preventDefault();
    this.classList.add('dropzone--dragging');
  };

  #on_dragleave = () => {
    this.classList.remove('dropzone--dragging');
  };

  #on_drop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.classList.remove('dropzone--dragging');

    const file = event.dataTransfer?.files?.[0];

    if (file) {
      this.#on_file_pool.invoke(file);
    }
  };

  #on_window_dragover = (event: DragEvent) => {
    if (!this.#menu_open()) {
      return;
    }

    event.preventDefault();
  };

  #on_window_drop = (event: DragEvent) => {
    if (!this.#menu_open()) {
      return;
    }

    event.preventDefault();
    this.classList.remove('dropzone--dragging');

    const file = event.dataTransfer?.files?.[0];

    if (file) {
      this.#on_file_pool.invoke(file);
    }
  };

  #on_window_paste = (event: ClipboardEvent) => {
    if (!this.#menu_open()) {
      return;
    }

    const item = Array.from(event.clipboardData?.items ?? []).find(entry => entry.type.startsWith('image/'));
    const file = item?.getAsFile();

    if (file) {
      this.#on_file_pool.invoke(file);
    }
  };
}

register_web_component(PzDropzone);
