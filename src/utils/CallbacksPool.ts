import { try_fn } from './try_fn';

import type { Unsubscribe } from '@src/types/types';

export class CallbacksPool<TPayloadType extends unknown[] = []> {
  #pool = new Array<(...payload: TPayloadType) => void>();

  get size() {
    return this.#pool.length;
  }

  add = (callback: (...payload: TPayloadType) => void): Unsubscribe => {
    this.#pool.push(callback);

    return () => this.delete(callback);
  };

  delete = (callback: (...payload: TPayloadType) => void) => {
    const index = this.#pool.indexOf(callback);

    if (index !== -1) {
      this.#pool.splice(index, 1);
    }

    return this;
  };

  clear = () => {
    this.#pool.length = 0;

    return this;
  };

  invoke = (...payload: TPayloadType) => {
    this.#pool.forEach(callback => try_fn(() => callback(...payload)));

    return this;
  };
}

export namespace CallbacksPool {
  export type Infer<T> = T extends CallbacksPool<infer TResult> ? TResult : never;
}
