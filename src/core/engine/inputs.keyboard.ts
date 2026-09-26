import type { KeyboardInputs } from './inputs.types';

export const create_keyboard_inputs = (): KeyboardInputs => ({
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  Minus: false,
  Equal: false,
  Escape: false,
  KeyH: false,
  KeyC: false,
  KeyG: false,
  KeyN: false,
  KeyF: false,
});

export const attach_keyboard = (kb: KeyboardInputs): void => {
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const code = event.code as keyof KeyboardInputs;

    if (code in kb) {
      kb[code] = true;
    }
  });

  window.addEventListener('keyup', event => {
    const code = event.code as keyof KeyboardInputs;

    if (code in kb) {
      kb[code] = false;
    }
  });
};
