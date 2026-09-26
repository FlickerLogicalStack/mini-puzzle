import './pz-menu-button.css';

import { CallbacksPool } from '@src/utils/CallbacksPool';
import { e } from '@src/utils/e';
import { register_web_component } from '@src/utils/register_web_component';

export class PzMenuButton extends HTMLElement {
  static WC_IS = 'pz-menu-button';

  #on_click_pool = new CallbacksPool();
  on_click = this.#on_click_pool.add;

  constructor() {
    super();

    this.className = 'game-menu';

    this.append(e.icon('menu', 22));

    this.setAttribute('role', 'button');
    this.setAttribute('aria-label', 'menu');
    this.tabIndex = 0;
    this.hidden = true;
  }

  connectedCallback() {
    this.addEventListener('click', this.#handle_click);
    this.addEventListener('keydown', this.#handle_keydown);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#handle_click);
    this.removeEventListener('keydown', this.#handle_keydown);
  }

  set_visible = (visible: boolean) => {
    this.hidden = !visible;
  };

  #handle_click = () => this.#on_click_pool.invoke();

  #handle_keydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.click();
    }
  };
}

register_web_component(PzMenuButton);
