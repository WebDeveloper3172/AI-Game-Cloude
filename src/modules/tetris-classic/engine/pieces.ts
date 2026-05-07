/**
 * Tetromino definitions with SRS rotation states.
 * Each piece has 4 rotation states (0, 1, 2, 3) = (spawn, CW, 180, CCW).
 */
import type { PieceDefinition, PieceType, ShapeMatrix } from './types';

function m(rows: number[][]): ShapeMatrix {
  return rows.map(r => r.map(v => v === 1));
}

export const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  I: {
    type: 'I',
    color: '#00d4ff',
    pattern: 'stripe',
    rotations: [
      m([[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]),
      m([[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]]),
      m([[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]]),
      m([[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]),
    ],
  },
  O: {
    type: 'O',
    color: '#ffd700',
    pattern: 'dot',
    rotations: [
      m([[1,1],[1,1]]),
      m([[1,1],[1,1]]),
      m([[1,1],[1,1]]),
      m([[1,1],[1,1]]),
    ],
  },
  T: {
    type: 'T',
    color: '#b44dff',
    pattern: 'cross',
    rotations: [
      m([[0,1,0],[1,1,1],[0,0,0]]),
      m([[0,1,0],[0,1,1],[0,1,0]]),
      m([[0,0,0],[1,1,1],[0,1,0]]),
      m([[0,1,0],[1,1,0],[0,1,0]]),
    ],
  },
  S: {
    type: 'S',
    color: '#4dff4d',
    pattern: 'zigzag',
    rotations: [
      m([[0,1,1],[1,1,0],[0,0,0]]),
      m([[0,1,0],[0,1,1],[0,0,1]]),
      m([[0,0,0],[0,1,1],[1,1,0]]),
      m([[1,0,0],[1,1,0],[0,1,0]]),
    ],
  },
  Z: {
    type: 'Z',
    color: '#ff4d4d',
    pattern: 'diamond',
    rotations: [
      m([[1,1,0],[0,1,1],[0,0,0]]),
      m([[0,0,1],[0,1,1],[0,1,0]]),
      m([[0,0,0],[1,1,0],[0,1,1]]),
      m([[0,1,0],[1,1,0],[1,0,0]]),
    ],
  },
  J: {
    type: 'J',
    color: '#4d4dff',
    pattern: 'square',
    rotations: [
      m([[1,0,0],[1,1,1],[0,0,0]]),
      m([[0,1,1],[0,1,0],[0,1,0]]),
      m([[0,0,0],[1,1,1],[0,0,1]]),
      m([[0,1,0],[0,1,0],[1,1,0]]),
    ],
  },
  L: {
    type: 'L',
    color: '#ff9f1a',
    pattern: 'triangle',
    rotations: [
      m([[0,0,1],[1,1,1],[0,0,0]]),
      m([[0,1,0],[0,1,0],[0,1,1]]),
      m([[0,0,0],[1,1,1],[1,0,0]]),
      m([[1,1,0],[0,1,0],[0,1,0]]),
    ],
  },
};

/** Get the cells occupied by a piece at a given position and rotation. */
export function getPieceCells(
  type: PieceType,
  rotation: number,
  pos: { x: number; y: number },
): { x: number; y: number }[] {
  const shape = PIECE_DEFINITIONS[type].rotations[rotation & 3];
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        cells.push({ x: pos.x + c, y: pos.y + r });
      }
    }
  }
  return cells;
}

/** Get the spawn position for a piece (centered, top of grid). */
export function getSpawnPosition(type: PieceType): { x: number; y: number } {
  const shape = PIECE_DEFINITIONS[type].rotations[0];
  const width = shape[0].length;
  return { x: Math.floor((10 - width) / 2), y: 0 };
}

export const ALL_PIECE_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
