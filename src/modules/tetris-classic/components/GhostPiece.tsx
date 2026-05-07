/**
 * Ghost piece calculation logic.
 * This is used by GameBoard to render the ghost piece (drop preview).
 * Exported as utility functions, not a React component.
 */
import type { ActivePiece } from '../engine/types';
import type { Grid } from '../engine/types';
import { getGhostY } from '../engine/grid';
import { getPieceCells } from '../engine/pieces';

export interface GhostCell {
  x: number;
  y: number;
}

/**
 * Calculate the ghost piece cells for the current active piece.
 * Returns the positions where the ghost should be rendered.
 */
export function getGhostCells(piece: ActivePiece, grid: Grid): GhostCell[] {
  const ghostY = getGhostY(piece, grid);
  if (ghostY === piece.position.y) return []; // Already at bottom, no ghost needed
  return getPieceCells(piece.type, piece.rotation, { x: piece.position.x, y: ghostY });
}

/**
 * Placeholder component that documents this module's purpose.
 * The actual ghost rendering is done inside GameBoard using the utility functions above.
 */
export function GhostPieceInfo() {
  return null; // Ghost piece rendering is handled by GameBoard canvas
}
