/**
 * Scoring system: line clear points, combos, T-spin detection, level progression.
 */
import type { ScoreEvent, ScoreResult, ActivePiece, Grid } from './types';

/** Points for line clears (base, before level multiplier). */
const LINE_CLEAR_POINTS: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

/** T-spin bonus points (base), per design doc Section 6. */
const TSPIN_POINTS: Record<number, number> = {
  0: 100,   // T-spin no lines
  1: 200,   // T-spin single
  2: 600,   // T-spin double
  3: 900,   // T-spin triple
};

const MINI_TSPIN_POINTS: Record<number, number> = {
  0: 100,
  1: 200,
  2: 400,
};

/** Combo bonus per consecutive clear (added on top of line clear points). */
const COMBO_BONUS = 50;

/**
 * T-spin detection using the 3-corner rule.
 * A T-spin occurs when:
 * 1. The last piece placed was a T-piece
 * 2. The last move was a rotation
 * 3. At least 3 of the 4 corners of the T-piece's bounding box are occupied
 */
export function detectTSpin(
  piece: ActivePiece,
  grid: Grid,
  lastMoveWasRotation: boolean,
): { isTSpin: boolean; isMiniTSpin: boolean } {
  if (piece.type !== 'T' || !lastMoveWasRotation) {
    return { isTSpin: false, isMiniTSpin: false };
  }

  // The T piece bounding box is 3x3. Check the 4 corners.
  const bx = piece.position.x;
  const by = piece.position.y;
  const corners = [
    { x: bx, y: by },
    { x: bx + 2, y: by },
    { x: bx, y: by + 2 },
    { x: bx + 2, y: by + 2 },
  ];

  let occupied = 0;
  for (const c of corners) {
    if (
      c.x < 0 || c.x >= grid[0].length ||
      c.y < 0 || c.y >= grid.length ||
      (c.y >= 0 && c.y < grid.length && c.x >= 0 && c.x < grid[0].length && grid[c.y][c.x] !== null)
    ) {
      occupied++;
    }
  }

  if (occupied >= 3) {
    // Check if the two corners in front of the T are filled for full T-spin
    // vs mini T-spin. For simplicity: if 4 corners occupied -> full, 3 -> mini
    const isFull = occupied >= 4;
    return { isTSpin: isFull, isMiniTSpin: !isFull };
  }

  return { isTSpin: false, isMiniTSpin: false };
}

/** Calculate score for a scoring event. */
export function calculateScore(event: ScoreEvent): ScoreResult {
  let points = 0;
  let label = '';

  if (event.isTSpin) {
    points = TSPIN_POINTS[event.linesCleared] ?? 0;
    const lineLabels = ['', 'Single', 'Double', 'Triple'];
    label = `T-Spin ${lineLabels[event.linesCleared] ?? ''}`.trim();
  } else if (event.isMiniTSpin) {
    points = MINI_TSPIN_POINTS[event.linesCleared] ?? 0;
    label = `Mini T-Spin${event.linesCleared > 0 ? ` ${event.linesCleared}` : ''}`;
  } else if (event.linesCleared > 0) {
    points = LINE_CLEAR_POINTS[event.linesCleared] ?? event.linesCleared * 100;
    const labels: Record<number, string> = {
      1: 'Single',
      2: 'Double',
      3: 'Triple',
      4: 'Tetris!',
    };
    label = labels[event.linesCleared] ?? `${event.linesCleared} Lines`;
  }

  // Level multiplier
  points *= event.level;

  // Combo bonus
  if (event.combo > 0 && event.linesCleared > 0) {
    points += COMBO_BONUS * event.combo * event.level;
    if (event.combo >= 2) {
      label += ` (${event.combo}x Combo!)`;
    }
  }

  return { points, label };
}

/** Soft drop bonus (1 point per cell). */
export function softDropPoints(cells: number): number {
  return cells;
}

/** Hard drop bonus (2 points per cell). */
export function hardDropPoints(cells: number): number {
  return cells * 2;
}

/** Calculate level from total lines cleared (every 10 lines = 1 level). */
export function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / 10) + 1;
}

/** Check if a level-up occurred. */
export function didLevelUp(oldLines: number, newLines: number): boolean {
  return calculateLevel(newLines) > calculateLevel(oldLines);
}

