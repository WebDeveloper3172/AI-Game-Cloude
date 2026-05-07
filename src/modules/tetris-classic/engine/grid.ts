/**
 * Grid operations: creation, collision detection, piece placement, line clearing.
 * Pure functions with no side effects.
 */
import type { Grid, Cell, ActivePiece, PieceType } from './types';
import { GRID_COLS, GRID_ROWS } from './types';
import { getPieceCells, PIECE_DEFINITIONS } from './pieces';

/** Create an empty grid. */
export function createGrid(rows: number = GRID_ROWS, cols: number = GRID_COLS): Grid {
  return Array.from({ length: rows }, () => Array<Cell>(cols).fill(null));
}

/** Clone a grid (deep copy). */
export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

/** Check if a position is within the grid bounds. */
export function isInBounds(x: number, y: number, grid: Grid): boolean {
  return x >= 0 && x < grid[0].length && y >= 0 && y < grid.length;
}

/** Check if a cell is empty (in bounds and null). */
export function isCellEmpty(x: number, y: number, grid: Grid): boolean {
  if (x < 0 || x >= grid[0].length || y >= grid.length) return false;
  // Allow y < 0 (piece above visible grid)
  if (y < 0) return true;
  return grid[y][x] === null;
}

/** Check if an active piece collides with the grid or boundaries. */
export function checkCollision(
  type: PieceType,
  rotation: number,
  pos: { x: number; y: number },
  grid: Grid,
): boolean {
  const cells = getPieceCells(type, rotation, pos);
  for (const cell of cells) {
    if (!isCellEmpty(cell.x, cell.y, grid)) {
      return true;
    }
  }
  return false;
}

/** Place an active piece onto the grid, returning a new grid. */
export function placePiece(piece: ActivePiece, grid: Grid): Grid {
  const newGrid = cloneGrid(grid);
  const cells = getPieceCells(piece.type, piece.rotation, piece.position);
  for (const cell of cells) {
    if (cell.y >= 0 && cell.y < newGrid.length && cell.x >= 0 && cell.x < newGrid[0].length) {
      newGrid[cell.y][cell.x] = piece.type;
    }
  }
  return newGrid;
}

/** Find all completed (full) rows. Returns array of row indices. */
export function findFullRows(grid: Grid): number[] {
  const fullRows: number[] = [];
  for (let r = 0; r < grid.length; r++) {
    if (grid[r].every(cell => cell !== null)) {
      fullRows.push(r);
    }
  }
  return fullRows;
}

/** Remove the given rows and add empty rows at top. Returns new grid. */
export function clearRows(grid: Grid, rows: number[]): Grid {
  if (rows.length === 0) return grid;
  const newGrid = cloneGrid(grid);
  // Sort descending so we remove from bottom up
  const sorted = [...rows].sort((a, b) => b - a);
  for (const r of sorted) {
    newGrid.splice(r, 1);
  }
  // Add empty rows at top
  const cols = grid[0].length;
  for (let i = 0; i < sorted.length; i++) {
    newGrid.unshift(Array<Cell>(cols).fill(null));
  }
  return newGrid;
}

/** Calculate the ghost piece Y position (hard drop destination). */
export function getGhostY(piece: ActivePiece, grid: Grid): number {
  let y = piece.position.y;
  while (!checkCollision(piece.type, piece.rotation, { x: piece.position.x, y: y + 1 }, grid)) {
    y++;
  }
  return y;
}

/** Check if piece is on the ground (cannot move down). */
export function isPieceOnGround(piece: ActivePiece, grid: Grid): boolean {
  return checkCollision(
    piece.type,
    piece.rotation,
    { x: piece.position.x, y: piece.position.y + 1 },
    grid,
  );
}

/** Check if the grid has any blocks in the top row (game over condition). */
export function isTopRowOccupied(grid: Grid): boolean {
  return grid[0].some(cell => cell !== null);
}

/** Get the color for a cell type. */
export function getCellColor(cell: Cell): string {
  if (cell === null) return 'transparent';
  return PIECE_DEFINITIONS[cell].color;
}

/** Get the pattern for a cell type. */
export function getCellPattern(cell: Cell): string {
  if (cell === null) return 'none';
  return PIECE_DEFINITIONS[cell].pattern;
}
