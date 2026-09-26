export const try_fn = <T>(fn: () => T, on_error?: (error: unknown) => void): T | undefined => {
  try {
    return fn();
  } catch (error) {
    on_error?.(error);

    return undefined;
  }
};
