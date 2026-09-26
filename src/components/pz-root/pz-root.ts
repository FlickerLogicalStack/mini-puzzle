import './pz-root.css';

import { GameService } from '@src/services/GameService/GameService';
import { MenuService } from '@src/services/MenuService/MenuService';
import { debounce } from '@src/utils/debounce';
import { register_web_component } from '@src/utils/register_web_component';
import { PzMenu } from '../pz-menu/pz-menu';
import { PzMenuButton } from '../pz-menu-button/pz-menu-button';
import { PzStage } from '../pz-stage/pz-stage';

const MOBILE_BREAKPOINT = 800;

export class PzRoot extends HTMLElement {
  static WC_IS = 'pz-root';

  #stage = new PzStage();
  #menu_overlay = new PzMenu();
  #menu_button = new PzMenuButton();

  constructor() {
    super();
  }

  connectedCallback() {
    this.#update_platform();

    window.addEventListener('resize', debounce(this.#update_platform, 100));

    const menu_service = MenuService.boot();

    this.append(this.#stage, this.#menu_button, this.#menu_overlay);

    this.#menu_button.on_click(() => menu_service.open());
    menu_service.on_open(() => {
      if (GameService.instance) {
        GameService.instance.paused = true;
      }

      this.#menu_button.set_visible(false);
    });

    menu_service.on_close(() => {
      if (GameService.instance) {
        GameService.instance.paused = false;
      }

      this.#menu_button.set_visible(this.#game_ready());
    });

    void (async () => {
      await new GameService().boot(this.#stage.canvas);

      GameService.instance.paused = menu_service.is_open;

      this.#menu_button.set_visible(this.#game_ready());
    })();

    void menu_service.init();
  }

  #update_platform = () => {
    const is_mobile = window.innerWidth < MOBILE_BREAKPOINT;

    document.documentElement.classList.toggle('mobile', is_mobile);
    document.documentElement.classList.toggle('desktop', !is_mobile);
  };

  #game_ready = () => Boolean(GameService.instance?.game?.board);
}

register_web_component(PzRoot);
