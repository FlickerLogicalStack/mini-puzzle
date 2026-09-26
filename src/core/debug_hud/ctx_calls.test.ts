import { describe, expect, test } from 'bun:test';

import { create_ctx_calls, reset_ctx_calls } from './ctx_calls';

describe('ctx_calls', () => {
  test('creates zeroed counters', () => {
    expect(create_ctx_calls()).toEqual({
      save: 0,
      restore: 0,
      translate: 0,
      scale: 0,
      clip: 0,
      drawImage: 0,
    });
  });

  test('reset zeroes populated counters', () => {
    const calls = create_ctx_calls();

    calls.save = 3;
    calls.drawImage = 7;
    reset_ctx_calls(calls);

    expect(calls).toEqual({
      save: 0,
      restore: 0,
      translate: 0,
      scale: 0,
      clip: 0,
      drawImage: 0,
    });
  });
});
