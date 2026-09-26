import { describe, expect, test } from 'bun:test';

import { ATLAS_BUDGET_PX, ATLAS_MIN_SCALE, atlas_scale_for } from './board.atlas';

describe('atlas_scale_for', () => {
  test('keeps full scale at or below the budget', () => {
    expect(atlas_scale_for(0)).toBe(1);
    expect(atlas_scale_for(ATLAS_BUDGET_PX)).toBe(1);
  });

  test('shrinks to stay near the budget', () => {
    expect(atlas_scale_for(ATLAS_BUDGET_PX * 4)).toBeCloseTo(0.5, 6);
  });

  test('never drops below the minimum scale', () => {
    expect(atlas_scale_for(ATLAS_BUDGET_PX * 100000)).toBe(ATLAS_MIN_SCALE);
  });
});
