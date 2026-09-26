import './pz-stage.css';

import { e } from '@src/utils/e';
import { register_web_component } from '@src/utils/register_web_component';

export class PzStage extends HTMLElement {
  static WC_IS = 'pz-stage';

  canvas = e('canvas');

  constructor() {
    super();

    this.append(this.canvas);
  }
}

register_web_component(PzStage);
