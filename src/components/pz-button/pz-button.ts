import './pz-button.css';

import { register_web_component } from '@src/utils/register_web_component';

export class PzButton extends HTMLElement {
  static WC_IS = 'pz-button';

  #onclick?: () => void;

  constructor(name: string, children: (Node | string)[] = [], onclick?: (self: PzButton) => void) {
    super();

    this.dataset.name = name;
    this.setAttribute('role', 'button');
    this.tabIndex = 0;
    this.append(...children);

    if (onclick) {
      this.#onclick = () => onclick(this);
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(on: boolean) {
    this.toggleAttribute('disabled', on);
  }

  connectedCallback() {
    this.addEventListener('click', this.#on_click);
    this.addEventListener('keydown', this.#on_keydown);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#on_click);
    this.removeEventListener('keydown', this.#on_keydown);
  }

  #on_click = () => {
    if (this.disabled) {
      return;
    }

    this.#onclick?.();
  };

  #on_keydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.click();
    }
  };
}

register_web_component(PzButton);
