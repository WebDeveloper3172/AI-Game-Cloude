/**
 * SRS (Super Rotation System) with wall kicks.
 * Handles clockwise and counter-clockwise rotation with 5 kick tests per attempt.
 */
import type { ActivePiece, RotationState, WallKickOffset } from './types';
import type { Grid } from './types';
import { checkCollision } from './grid';

/**
 * SRS wall kick data for J, L, S, T, Z pieces.
 * Index: [fromRotation][testIndex] = [dx, dy]
 * Tests are tried in order 0..4 for CW rotation from state.
 */
const JLSTZ_KICKS_CW: WallKickOffset[][] = [
  // 0 -> 1
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  // 1 -> 2
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  // 2 -> 3
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  // 3 -> 0
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
];

const JLSTZ_KICKS_CCW: WallKickOffset[][] = [
  // 0 -> 3
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  // 1 -> 0
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  // 2 -> 1
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  // 3 -> 2
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
];

/** SRS wall kick data for I piece. */
const I_KICKS_CW: WallKickOffset[][] = [
  // 0 -> 1
  [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  // 1 -> 2
  [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  // 2 -> 3
  [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  // 3 -> 0
  [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
];

const I_KICKS_CCW: WallKickOffset[][] = [
  // 0 -> 3
  [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  // 1 -> 0
  [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  // 2 -> 1
  [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  // 3 -> 2
  [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
];

function getKickTable(pieceType: string, clockwise: boolean): WallKickOffset[][] {
  if (pieceType === 'I') {
    return clockwise ? I_KICKS_CW : I_KICKS_CCW;
  }
  if (pieceType === 'O') {
    // O piece never kicks, just one test at [0,0]
    return [[[0, 0]], [[0, 0]], [[0, 0]], [[0, 0]]];
  }
  return clockwise ? JLSTZ_KICKS_CW : JLSTZ_KICKS_CCW;
}

/** Attempt to rotate a piece. Returns the new piece if successful, or null if blocked. */
export function tryRotate(
  piece: ActivePiece,
  grid: Grid,
  clockwise: boolean,
): ActivePiece | null {
  const fromRot = piece.rotation;
  const toRot: RotationState = clockwise
    ? (((fromRot + 1) % 4) as RotationState)
    : (((fromRot + 3) % 4) as RotationState);

  const kicks = getKickTable(piece.type, clockwise);
  const tests = kicks[fromRot];

  for (const [dx, dy] of tests) {
    const newPos = { x: piece.position.x + dx, y: piece.position.y - dy };
    if (!checkCollision(piece.type, toRot, newPos, grid)) {
      return {
        type: piece.type,
        position: newPos,
        rotation: toRot,
      };
    }
  }

  return null; // All kick tests failed
}

/** Rotate clockwise. */
export function rotateCW(piece: ActivePiece, grid: Grid): ActivePiece | null {
  return tryRotate(piece, grid, true);
}

/** Rotate counter-clockwise. */
export function rotateCCW(piece: ActivePiece, grid: Grid): ActivePiece | null {
  return tryRotate(piece, grid, false);
}
