export class LoopedArray {
  /** Number of slots; the oldest value is overwritten when the window wraps. */
  readonly length: number;

  /** Ring buffer of samples. */
  #array: Uint32Array;
  /** Next slot to write. */
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
