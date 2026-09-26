export const r = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

export const clamp = (min: number, value: number, max: number) => {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  }

  return value;
};

export class LoopedArray {
  readonly length: number;

  #array: Uint32Array;
  #index = 0;

  constructor(length: number) {
    this.length = length;
    this.#array = new Uint32Array(length);
  }

  push = (value: number) => {
    this.#array[this.#index] = value;

    this.#index = (this.#index + 1) % this.length;
  };

  avg = () => {
    let total = 0;
    let i = 0;

    const length = this.#array.length;

    while (i < length) {
      total += this.#array[i++];
    }

    return length ? total / length : 0;
  };
}
