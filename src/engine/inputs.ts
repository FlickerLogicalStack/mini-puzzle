export type KeyboardInputs = {
  ArrowLeft: boolean;
  ArrowRight: boolean;
  ArrowUp: boolean;
  ArrowDown: boolean;
  Minus: boolean;
  Equal: boolean;
  KeyH: boolean;
  KeyC: boolean;
  KeyG: boolean;
  KeyN: boolean;
  KeyF: boolean;
  Space: boolean;
};

export type PointerInputs = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  down: boolean;
  button: number;
  pressed: boolean;
  released: boolean;
  wheel: number;
};

export type Inputs = {
  kb: KeyboardInputs;
  pointer: PointerInputs;
};

export const create_inputs = (element: HTMLCanvasElement): Inputs => {
  const kb: KeyboardInputs = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Minus: false,
    Equal: false,
    KeyH: false,
    KeyC: false,
    KeyG: false,
    KeyN: false,
    KeyF: false,
    Space: false,
  };

  const pointer: PointerInputs = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    down: false,
    button: 0,
    pressed: false,
    released: false,
    wheel: 0,
  };

  const update_position = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();

    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };

  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const code = event.code as keyof KeyboardInputs;

    if (code in kb) {
      if (code === 'Space') {
        event.preventDefault();
      }

      kb[code] = true;
    }
  });

  window.addEventListener('keyup', event => {
    const code = event.code as keyof KeyboardInputs;

    if (code in kb) {
      kb[code] = false;
    }
  });

  element.addEventListener('pointerdown', event => {
    update_position(event);

    pointer.down = true;
    pointer.button = event.button;
    pointer.pressed = true;

    element.setPointerCapture(event.pointerId);
  });

  element.addEventListener('pointermove', event => {
    update_position(event);

    if (pointer.down === true) {
      pointer.dx += event.movementX;
      pointer.dy += event.movementY;
    }
  });

  const release = (event: PointerEvent) => {
    update_position(event);

    if (pointer.down === true) {
      pointer.released = true;
    }

    pointer.down = false;

    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  };

  element.addEventListener('pointerup', release);
  element.addEventListener('pointercancel', release);

  element.addEventListener(
    'wheel',
    event => {
      pointer.wheel += event.deltaY;
    },
    { passive: true },
  );

  return { kb, pointer };
};
