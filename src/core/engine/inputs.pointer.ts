import { pinch_metrics, type PinchBaseline, type Point } from './pinch';
import type { PinchInputs, PointerInputs } from './inputs.types';

export type PointerState = {
  pointer: PointerInputs;
  pinch: PinchInputs;
  pointers: Map<number, Point>;
  primary_id: number | null;
  baseline: PinchBaseline | null;
  last_x: number;
  last_y: number;
};

export const create_pointer_state = (): PointerState => ({
  pointer: { x: 0, y: 0, dx: 0, dy: 0, down: false, button: 0, pressed: false, released: false, wheel: 0 },
  pinch: { active: false, scale: 1, dx: 0, dy: 0 },
  pointers: new Map<number, Point>(),
  primary_id: null,
  baseline: null,
  last_x: 0,
  last_y: 0,
});

const local_point = (element: HTMLCanvasElement, event: PointerEvent): Point => {
  const rect = element.getBoundingClientRect();

  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};

const two_points = (state: PointerState): [Point, Point] | null => {
  if (state.pointers.size !== 2) {
    return null;
  }

  const values = Array.from(state.pointers.values());

  return [values[0], values[1]];
};

const set_baseline = (state: PointerState): void => {
  const pair = two_points(state);

  if (!pair) {
    state.baseline = null;
    state.pinch.active = false;

    return;
  }

  const mid_x = (pair[0].x + pair[1].x) / 2;
  const mid_y = (pair[0].y + pair[1].y) / 2;

  state.baseline = { distance: Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y), mid_x, mid_y };
  state.pinch.active = true;
};

const on_down = (state: PointerState, element: HTMLCanvasElement, event: PointerEvent): void => {
  const point = local_point(element, event);

  state.pointers.set(event.pointerId, point);
  element.setPointerCapture(event.pointerId);

  if (state.pointers.size === 1) {
    state.primary_id = event.pointerId;
    state.last_x = point.x;
    state.last_y = point.y;

    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.down = true;
    state.pointer.button = event.button;
    state.pointer.pressed = true;
  } else if (state.pointers.size === 2) {
    state.pointer.down = false;
    state.pointer.dx = 0;
    state.pointer.dy = 0;

    set_baseline(state);
  }
};

const on_hover = (state: PointerState, element: HTMLCanvasElement, event: PointerEvent): void => {
  const point = local_point(element, event);

  state.pointer.x = point.x;
  state.pointer.y = point.y;
};

const on_move = (state: PointerState, element: HTMLCanvasElement, event: PointerEvent): void => {
  const point = local_point(element, event);

  // Track the cursor even without a pressed button, so hover-based features (cursor-anchored zoom)
  // always see the current position.
  if (state.pointers.size === 0 || event.pointerId === state.primary_id) {
    state.pointer.x = point.x;
    state.pointer.y = point.y;
  }

  if (!state.pointers.has(event.pointerId)) {
    return;
  }

  state.pointers.set(event.pointerId, point);

  if (state.pinch.active && state.baseline) {
    const pair = two_points(state);

    if (pair) {
      const metrics = pinch_metrics(state.baseline, pair[0], pair[1]);

      state.baseline = { distance: metrics.distance, mid_x: metrics.mid_x, mid_y: metrics.mid_y };
      state.pinch.scale *= metrics.scale;
      state.pinch.dx += metrics.dx;
      state.pinch.dy += metrics.dy;
    }

    return;
  }

  if (event.pointerId === state.primary_id) {
    state.pointer.x = point.x;
    state.pointer.y = point.y;

    if (state.pointer.down === true) {
      state.pointer.dx += point.x - state.last_x;
      state.pointer.dy += point.y - state.last_y;
    }

    state.last_x = point.x;
    state.last_y = point.y;
  }
};

const on_release = (state: PointerState, element: HTMLCanvasElement, event: PointerEvent): void => {
  const point = local_point(element, event);

  state.pointers.delete(event.pointerId);

  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId);
  }

  if (state.pinch.active) {
    if (state.pointers.size >= 2) {
      set_baseline(state);
    } else {
      state.pinch.active = false;
      state.baseline = null;

      const remaining = Array.from(state.pointers.entries())[0];

      if (remaining) {
        state.primary_id = remaining[0];
        state.last_x = remaining[1].x;
        state.last_y = remaining[1].y;
        state.pointer.x = remaining[1].x;
        state.pointer.y = remaining[1].y;
        state.pointer.down = true;
      } else {
        state.primary_id = null;
        state.pointer.down = false;
        state.pointer.released = true;
        state.pointer.x = point.x;
        state.pointer.y = point.y;
      }
    }

    return;
  }

  if (event.pointerId === state.primary_id) {
    state.pointer.x = point.x;
    state.pointer.y = point.y;

    if (state.pointer.down === true) {
      state.pointer.released = true;
    }

    state.pointer.down = false;
    state.primary_id = null;
  }
};

const on_wheel = (state: PointerState, delta_y: number): void => {
  state.pointer.wheel += delta_y;
};

export const attach_pointer = (element: HTMLCanvasElement, state: PointerState): void => {
  element.addEventListener('pointerdown', event => on_down(state, element, event));
  element.addEventListener('pointerenter', event => on_hover(state, element, event));
  element.addEventListener('pointermove', event => on_move(state, element, event));
  element.addEventListener('pointerup', event => on_release(state, element, event));
  element.addEventListener('pointercancel', event => on_release(state, element, event));
  element.addEventListener('wheel', event => on_wheel(state, event.deltaY), { passive: true });
};
