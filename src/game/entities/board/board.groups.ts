import { drag_group, find, merge, piece_at, type Board } from './board';

export const SNAP_TOLERANCE_MUL = 0.3;

export const snap_tolerance = (board: Board) => SNAP_TOLERANCE_MUL * Math.min(board.pw, board.ph);

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export const group_at_home = (board: Board, group: number, tol: number) => {
  for (const piece of board.pieces) {
    if (find(board, piece.id) !== group) {
      continue;
    }

    const home_x = piece.col * board.pw;
    const home_y = piece.row * board.ph;

    if (Math.abs(piece.x - home_x) > tol || Math.abs(piece.y - home_y) > tol) {
      return false;
    }
  }

  return true;
};

export const lock_group = (board: Board, group: number) => {
  for (const piece of board.pieces) {
    if (find(board, piece.id) !== group) {
      continue;
    }

    piece.x = piece.col * board.pw;
    piece.y = piece.row * board.ph;
    piece.locked = true;
  }
};

export type SnapResult = {
  merged: boolean;
  locked: boolean;
};

export const try_snap = (board: Board, group_id: number, tol: number = snap_tolerance(board)): SnapResult => {
  let group = group_id;
  let merged_any = false;

  for (;;) {
    let merged = false;

    for (const piece of board.pieces) {
      if (find(board, piece.id) !== group) {
        continue;
      }

      for (const [dx, dy] of DIRS) {
        const neighbor = piece_at(board, piece.col + dx, piece.row + dy);

        if (!neighbor) {
          continue;
        }

        const other = find(board, neighbor.id);

        if (other === group) {
          continue;
        }

        const expected_x = dx * board.pw;
        const expected_y = dy * board.ph;

        if (Math.abs(neighbor.x - piece.x - expected_x) > tol) {
          continue;
        }

        if (Math.abs(neighbor.y - piece.y - expected_y) > tol) {
          continue;
        }

        drag_group(board, group, neighbor.x - expected_x - piece.x, neighbor.y - expected_y - piece.y);
        group = merge(board, group, other);
        merged = true;
        merged_any = true;
        break;
      }

      if (merged) {
        break;
      }
    }

    if (!merged) {
      break;
    }
  }

  let locked = false;

  if (group_at_home(board, group, tol)) {
    lock_group(board, group);
    locked = true;
  }

  return { merged: merged_any, locked };
};
