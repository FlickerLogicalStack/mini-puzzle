export type GridSpec = {
  /** Number of piece columns the user picked. */
  cols: number;
  /** Number of piece rows the user picked. */
  rows: number;
};

// Below this many source pixels per piece the result looks soft; the menu only warns, never blocks.
export const MIN_PIECE_PX = 130;
