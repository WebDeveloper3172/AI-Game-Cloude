/**
 * Core packer logic: cell legality, placement, undo, completion, hint.
 * Reuses tetromino shape definitions from tetris-classic.
 */
import { PIECE_DEFINITIONS, getPieceCells } from '../../tetris-classic/engine/pieces.ts';
import type {
  LevelDefinition,
  PackingGrid,
  PlacedPiece,
  PlayState,
  Position,
  RotationState,
  TrayPiece,
} from './types.ts';

export function makeEmptyGrid(size: number): PackingGrid {
  return Array.from({ length: size }, () => Array<number | null>(size).fill(null));
}

export function applyObstacles(grid: PackingGrid, obstacles: Position[]): PackingGrid {
  const next = grid.map(row => row.slice());
  for (const o of obstacles) {
    if (o.y >= 0 && o.y < next.length && o.x >= 0 && o.x < next[0].length) {
      next[o.y][o.x] = -1;
    }
  }
  return next;
}

export function withinBounds(grid: PackingGrid, cells: Position[]): boolean {
  const size = grid.length;
  return cells.every(c => c.x >= 0 && c.y >= 0 && c.x < size && c.y < size);
}

export function isLegalPlacement(
  grid: PackingGrid,
  piece: TrayPiece,
  rotation: RotationState,
  position: Position,
): boolean {
  const cells = getPieceCells(piece.type, rotation, position);
  if (!withinBounds(grid, cells)) return false;
  return cells.every(c => grid[c.y][c.x] === null);
}

export function commitPlacement(
  state: PlayState,
  trayPieceId: string,
  rotation: RotationState,
  position: Position,
): PlayState {
  const trayPiece = state.tray.find(p => p.id === trayPieceId);
  if (!trayPiece || trayPiece.used) return state;
  if (!isLegalPlacement(state.grid, trayPiece, rotation, position)) return state;

  const cells = getPieceCells(trayPiece.type, rotation, position);
  const fillId = state.placed.length + 1;
  const nextGrid = state.grid.map(row => row.slice());
  for (const c of cells) nextGrid[c.y][c.x] = fillId;

  const placed: PlacedPiece = {
    trayPieceId,
    type: trayPiece.type,
    rotation,
    position,
    sequence: fillId,
  };

  const tray = state.tray.map(p => (p.id === trayPieceId ? { ...p, used: true } : p));

  const isComplete = isGridComplete(nextGrid);

  return {
    ...state,
    grid: nextGrid,
    tray,
    placed: [...state.placed, placed],
    selectedTrayPieceId: null,
    isComplete,
    lastInteractionAt: Date.now(),
  };
}

export function undoLast(state: PlayState): PlayState {
  if (state.placed.length === 0) return state;
  const last = state.placed[state.placed.length - 1];
  const cells = getPieceCells(last.type, last.rotation, last.position);
  const nextGrid = state.grid.map(row => row.slice());
  for (const c of cells) nextGrid[c.y][c.x] = null;
  const tray = state.tray.map(p => (p.id === last.trayPieceId ? { ...p, used: false } : p));
  return {
    ...state,
    grid: nextGrid,
    tray,
    placed: state.placed.slice(0, -1),
    undosUsed: state.undosUsed + 1,
    isComplete: false,
    lastInteractionAt: Date.now(),
  };
}

export function isGridComplete(grid: PackingGrid): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell === null) return false;
    }
  }
  return true;
}

/**
 * Find a hint: a (rotation, position) that places an unused piece legally and
 * leaves the remaining unused pieces still able to fit. Cheap depth-1 lookahead.
 */
export function findHint(
  grid: PackingGrid,
  tray: TrayPiece[],
): { trayPieceId: string; rotation: RotationState; position: Position } | null {
  const size = grid.length;
  const unused = tray.filter(p => !p.used);
  if (unused.length === 0) return null;

  for (const piece of unused) {
    for (let rot = 0 as RotationState; rot <= 3; rot = (rot + 1) as RotationState) {
      const shape = PIECE_DEFINITIONS[piece.type].rotations[rot];
      for (let y = 0; y <= size - shape.length; y++) {
        for (let x = 0; x <= size - shape[0].length; x++) {
          const pos = { x, y };
          if (isLegalPlacement(grid, piece, rot, pos)) {
            // Cheap: any legal placement counts as a hint.
            return { trayPieceId: piece.id, rotation: rot, position: pos };
          }
        }
      }
      if (rot === 3) break;
    }
  }
  return null;
}

export function computeStars(
  level: LevelDefinition,
  undosUsed: number,
  timeRemainingMs: number,
): number {
  const timeRemainingS = timeRemainingMs / 1000;
  if (undosUsed <= level.threeStarUndos && timeRemainingS >= level.threeStarTimeFloor) return 3;
  if (undosUsed <= level.twoStarUndos && timeRemainingS >= level.twoStarTimeFloor) return 2;
  return 1;
}

export function buildInitialPlayState(level: LevelDefinition): PlayState {
  const grid = applyObstacles(makeEmptyGrid(level.size), level.obstacles);
  const tray: TrayPiece[] = level.pieces.map((type, i) => ({
    id: `${level.id}-${i}`,
    type,
    rotation: (level.startingRotations[i] ?? 0) as RotationState,
    used: false,
  }));
  return {
    level,
    grid,
    tray,
    placed: [],
    selectedTrayPieceId: null,
    cursor: { x: 0, y: 0 },
    cursorRotation: 0,
    undosUsed: 0,
    hintsUsed: 0,
    timeRemainingMs: level.timerSeconds * 1000,
    startedAt: Date.now(),
    lastInteractionAt: Date.now(),
    isComplete: false,
    isTimeUp: false,
  };
}

/**
 * Brute-force solvability check (for tests + dev validation only).
 * Returns true iff there exists an assignment of unused pieces with rotations
 * and positions that fills every empty cell exactly once.
 */
export function isSolvable(level: LevelDefinition): boolean {
  const grid = applyObstacles(makeEmptyGrid(level.size), level.obstacles);
  const piecesAvailable = level.pieces.slice();
  const targetEmpty = level.size * level.size - level.obstacles.length;
  const totalPieceCells = piecesAvailable.length * 4;
  // If pieces is greater than needed, we have leftovers — solver tolerates.
  if (totalPieceCells < targetEmpty) return false;

  const used = new Array<boolean>(piecesAvailable.length).fill(false);
  const size = level.size;

  function findFirstEmpty(g: PackingGrid): Position | null {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (g[y][x] === null) return { x, y };
      }
    }
    return null;
  }

  function placeCells(g: PackingGrid, cells: Position[], v: number): PackingGrid {
    const next = g.map(r => r.slice());
    for (const c of cells) next[c.y][c.x] = v;
    return next;
  }

  function tryFill(g: PackingGrid): boolean {
    const target = findFirstEmpty(g);
    if (!target) return true;
    for (let i = 0; i < piecesAvailable.length; i++) {
      if (used[i]) continue;
      const pieceType = piecesAvailable[i];
      for (let rot = 0; rot <= 3; rot++) {
        const shape = PIECE_DEFINITIONS[pieceType].rotations[rot as RotationState];
        // Find offset so that the FIRST true cell of the shape lines up with target.
        let firstC = -1;
        let firstR = -1;
        outer: for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              firstR = r;
              firstC = c;
              break outer;
            }
          }
        }
        if (firstR === -1) continue;
        const pos: Position = { x: target.x - firstC, y: target.y - firstR };
        const cells = getPieceCells(pieceType, rot as RotationState, pos);
        if (
          cells.every(
            cc => cc.x >= 0 && cc.y >= 0 && cc.x < size && cc.y < size && g[cc.y][cc.x] === null,
          )
        ) {
          used[i] = true;
          const next = placeCells(g, cells, i + 1);
          if (tryFill(next)) return true;
          used[i] = false;
        }
      }
    }
    return false;
  }

  return tryFill(grid);
}
