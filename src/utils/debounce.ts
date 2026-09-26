export type Debounced<A extends unknown[]> = ((...args: A) => void) & {
  cancel: () => void;
  flush: () => void;
};

export const debounce = <A extends unknown[]>(fn: (...args: A) => void, wait: number): Debounced<A> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: A | null = null;

  const run = () => {
    if (pending === null) {
      return;
    }

    const args = pending;

    pending = null;
    fn(...args);
  };

  const debounced = ((...args: A) => {
    pending = args;

    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      run();
    }, wait);
  }) as Debounced<A>;

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    pending = null;
  };

  debounced.flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    run();
  };

  return debounced;
};
