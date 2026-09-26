import { create_ctx_calls, type CtxCalls } from './ctx_calls';
import { LoopedArray } from './LoopedArray';

export type DebugHud = {
  /** Debug HUD visibility flag (1 = shown, 0 = hidden), toggled with `H`. */
  enabled: number;
  /** Rolling window of frame deltas (ms) used to average the FPS readout. */
  frames: LoopedArray;
  /** Renders counter for the current frame; reset at the start of every frame. */
  renders: number;
  /** Per-frame CanvasRenderingContext2D method calls made by the board renderer. */
  ctx_calls: CtxCalls;
};

export const create_debug_hud = (): DebugHud => ({
  enabled: 0,
  frames: new LoopedArray(64),
  renders: 0,
  ctx_calls: create_ctx_calls(),
});
