import { attach_keyboard, create_keyboard_inputs } from './inputs.keyboard';
import { attach_pointer, create_pointer_state } from './inputs.pointer';
import type { Inputs } from './inputs.types';

export type { Inputs, KeyboardInputs, PinchInputs, PointerInputs } from './inputs.types';

export const create_inputs = (element: HTMLCanvasElement): Inputs => {
  const kb = create_keyboard_inputs();
  const state = create_pointer_state();

  attach_keyboard(kb);
  attach_pointer(element, state);

  return { kb, pointer: state.pointer, pinch: state.pinch };
};

// Drops every transient input state; called while the game is paused so a key pressed in the menu
// can never surface as a stale edge (new game / ghost / HUD) on resume.
export const clear_inputs = (inputs: Inputs): void => {
  inputs.kb.ArrowLeft = false;
  inputs.kb.ArrowRight = false;
  inputs.kb.ArrowUp = false;
  inputs.kb.ArrowDown = false;
  inputs.kb.Minus = false;
  inputs.kb.Equal = false;
  inputs.kb.Escape = false;
  inputs.kb.KeyH = false;
  inputs.kb.KeyC = false;
  inputs.kb.KeyG = false;
  inputs.kb.KeyN = false;
  inputs.kb.KeyF = false;

  inputs.pointer.dx = 0;
  inputs.pointer.dy = 0;
  inputs.pointer.down = false;
  inputs.pointer.pressed = false;
  inputs.pointer.released = false;
  inputs.pointer.wheel = 0;

  inputs.pinch.scale = 1;
  inputs.pinch.dx = 0;
  inputs.pinch.dy = 0;
};
