import { create_inputs, type Inputs } from './inputs';

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

  resources: unknown;
};

export const create_engine_context = (canvas: HTMLCanvasElement, resources: unknown): EngineContext => {
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

    resources,
  };
};

export type GameStateModule<TGame> = {
  create: (engine: EngineContext) => TGame;
  setup?: (engine: EngineContext, game: TGame) => void;
};

export const loop = async <TResources, TGame>(
  canvas_getter: () => HTMLCanvasElement,
  load_resources: () => Promise<TResources>,
  game_state: GameStateModule<TGame>,
  on_frame: (engine: EngineContext, game: TGame) => void,
) => {
  const canvas = canvas_getter();

  const engine = create_engine_context(canvas, await load_resources());

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

  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', () => {
    engine.__prev_frame_time = performance.now() | 0;
  });

  resize();

  engine.__prev_frame_time = performance.now() | 0;

  const game = game_state.create(engine);

  game_state.setup?.(engine, game);

  window.__ENGINE__ = { engine, game };

  const frame = (time: number) => {
    engine.frame += 1;

    const raw_delta = (time - engine.__prev_frame_time) | 0;

    engine.delta = raw_delta > MAX_DELTA ? MAX_DELTA : raw_delta;
    engine.delta_mul = engine.delta / 1000;
    engine.__prev_frame_time = time | 0;

    engine.ctx.setTransform(engine.dpr, 0, 0, engine.dpr, 0, 0);

    on_frame(engine, game);

    engine.__raf = requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};
