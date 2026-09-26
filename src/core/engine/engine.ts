import { create_inputs, clear_inputs, type Inputs } from './inputs';

const MAX_DELTA = 100;

export type EngineContext = {
  __raf: number;
  __prev_frame_time: number;

  canvas: {
    element: HTMLCanvasElement;
    width: number;
    height: number;
  };

  ctx: CanvasRenderingContext2D;
  inputs: Inputs;

  frame: number;
  delta: number;
  delta_mul: number;

  dpr: number;

  paused: boolean;
};

export const create_engine_context = (canvas: HTMLCanvasElement): EngineContext => {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context (canvas.getContext(2d))');
  }

  return {
    __raf: 0,
    __prev_frame_time: 0,

    canvas: {
      element: canvas,
      width: canvas.width,
      height: canvas.height,
    },

    ctx,
    inputs: create_inputs(canvas),

    frame: 0,
    delta: 0,
    delta_mul: 0,

    dpr: window.devicePixelRatio || 1,

    paused: false,
  };
};

type Loop = { frame: FrameRequestCallback };

const loops = new WeakMap<EngineContext, Loop>();

export const start_loop = <TGame>(
  engine: EngineContext,
  game: TGame,
  on_frame: (engine: EngineContext, game: TGame) => void,
): (() => void) => {
  const canvas = engine.canvas.element;

  // DPR-aware: engine.canvas.width/height stay in CSS pixels (single source of truth for
  // camera/culling/renderers); the drawing buffer is scaled by dpr via the context transform.
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;

    engine.dpr = dpr;
    engine.canvas.width = Math.max(1, canvas.clientWidth);
    engine.canvas.height = Math.max(1, canvas.clientHeight);

    canvas.width = Math.floor(engine.canvas.width * dpr);
    canvas.height = Math.floor(engine.canvas.height * dpr);

    engine.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const on_visibility = () => {
    engine.__prev_frame_time = performance.now() | 0;
  };

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', on_visibility);

  resize();

  engine.__prev_frame_time = performance.now() | 0;

  const frame = (time: number) => {
    engine.frame += 1;

    const raw_delta = (time - engine.__prev_frame_time) | 0;

    engine.delta = raw_delta > MAX_DELTA ? MAX_DELTA : raw_delta;
    engine.delta_mul = engine.delta / 1000;
    engine.__prev_frame_time = time | 0;

    engine.ctx.setTransform(engine.dpr, 0, 0, engine.dpr, 0, 0);

    on_frame(engine, game);

    // A pause can be requested from inside on_frame (Esc -> menu open); never reschedule then.
    if (engine.paused === false) {
      schedule();
    }
  };

  const schedule = () => {
    engine.__raf = requestAnimationFrame(frame);
  };

  loops.set(engine, { frame });
  schedule();

  return () => {
    cancelAnimationFrame(engine.__raf);
    engine.__raf = 0;
    loops.delete(engine);

    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', on_visibility);
  };
};

// Pauses/resumes the whole loop (RAF is cancelled while paused, so no frame work happens at all).
// Transient input is cleared on both edges: a key pressed while the menu is open must never surface
// as a stale edge (new game / ghost / HUD) when play resumes.
export const set_loop_paused = (engine: EngineContext, paused: boolean): void => {
  if (engine.paused === paused) {
    return;
  }

  engine.paused = paused;

  clear_inputs(engine.inputs);

  if (paused) {
    cancelAnimationFrame(engine.__raf);
    engine.__raf = 0;

    return;
  }

  const loop = loops.get(engine);

  if (loop) {
    engine.__prev_frame_time = performance.now() | 0;
    engine.__raf = requestAnimationFrame(loop.frame);
  }
};
