// CanvasRenderingContext2D methods counted for the board renderer (see board.renderer.ts). Only the
// methods that renderer actually calls are tracked; counting is explicit, with no loops or wrapping.
export type CtxCalls = {
  save: number;
  restore: number;
  translate: number;
  scale: number;
  clip: number;
  drawImage: number;
};

export const create_ctx_calls = (): CtxCalls => ({
  save: 0,
  restore: 0,
  translate: 0,
  scale: 0,
  clip: 0,
  drawImage: 0,
});

export const reset_ctx_calls = (calls: CtxCalls): void => {
  calls.save = 0;
  calls.restore = 0;
  calls.translate = 0;
  calls.scale = 0;
  calls.clip = 0;
  calls.drawImage = 0;
};
