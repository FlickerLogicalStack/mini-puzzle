export type KeyboardInputs = {
  ArrowLeft: boolean;
  ArrowRight: boolean;
  ArrowUp: boolean;
  ArrowDown: boolean;
  Minus: boolean;
  Equal: boolean;
  Escape: boolean;
  KeyH: boolean;
  KeyC: boolean;
  KeyG: boolean;
  KeyN: boolean;
  KeyF: boolean;
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

export type PinchInputs = {
  active: boolean;
  scale: number;
  dx: number;
  dy: number;
};

export type Inputs = {
  kb: KeyboardInputs;
  pointer: PointerInputs;
  pinch: PinchInputs;
};
