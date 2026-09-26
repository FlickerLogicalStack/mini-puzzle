import { describe, expect, test } from 'bun:test';

import { CallbacksPool } from '@src/utils/CallbacksPool';
import { try_fn } from '@src/utils/try_fn';

describe('CallbacksPool', () => {
  test('invokes subscribers with payload and unsubscribes', () => {
    const pool = new CallbacksPool<[number, string]>();
    const seen: Array<[number, string]> = [];
    const unsubscribe = pool.add((n, s) => seen.push([n, s]));

    pool.invoke(1, 'a');
    unsubscribe();
    pool.invoke(2, 'b');

    expect(seen).toEqual([[1, 'a']]);
  });

  test('delete and clear', () => {
    const pool = new CallbacksPool();
    let count = 0;
    const callback = () => {
      count += 1;
    };

    pool.add(callback);
    expect(pool.size).toBe(1);

    pool.delete(callback);
    expect(pool.size).toBe(0);

    pool.add(callback);
    pool.clear();
    pool.invoke();

    expect(count).toBe(0);
  });

  test('swallows callback errors and keeps going', () => {
    const pool = new CallbacksPool();
    let reached = false;

    pool.add(() => {
      throw new Error('boom');
    });
    pool.add(() => {
      reached = true;
    });

    expect(() => pool.invoke()).not.toThrow();
    expect(reached).toBe(true);
  });
});

describe('try_fn', () => {
  test('returns the value and forwards errors to the handler', () => {
    expect(try_fn(() => 42)).toBe(42);

    const errors: unknown[] = [];

    try_fn(
      () => {
        throw new Error('x');
      },
      error => errors.push(error),
    );

    expect(errors.length).toBe(1);
  });
});
