import { LoopedArray } from '../misc/utils';

export type Hud = {
  enabled: number;
  frames: LoopedArray;
  steps: LoopedArray;
  renders: number;
};

export const create_hud = (): Hud => ({
  enabled: 0,
  frames: new LoopedArray(64),
  steps: new LoopedArray(64),
  renders: 0,
});
