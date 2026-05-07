/** All TypeScript types and interfaces for the Classic Tetris engine. */

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type RotationState = 0 | 1 | 2 | 3;

/** A 2D coordinate on the grid (col, row). Row 0 is the top. */
export interface Position {
  x: number;
  y: number;
}

/** A single cell on the grid. null means empty. */
export type Cell = PieceType | null;

/** The 10×20 grid represented as rows of cells. grid[row][col]. */
export type Grid = Cell[][];

/** Shape matrix: true where the piece occupies a cell. */
export type ShapeMatrix = boolean[][];

/** Definition of a tetromino including all rotation states. */
export interface PieceDefinition {
  type: PieceType;
  color: string;
  /** Pattern identifier for colorblind accessibility */
  pattern: string;
  /** All 4 rotation states as shape matrices */
  rotations: ShapeMatrix[];
}

/** An active piece on the board. */
export interface ActivePiece {
  type: PieceType;
  position: Position;
  rotation: RotationState;
}

/** Wall kick offset data: [dx, dy] */
export type WallKickOffset = [number, number];

/** Wall kick table: from rotation -> to rotation -> list of offsets to try */
export type WallKickData = WallKickOffset[][];

export interface ScoreEvent {
  linesCleared: number;
  isTSpin: boolean;
  isMiniTSpin: boolean;
  combo: number;
  level: number;
}

export interface ScoreResult {
  points: number;
  label: string;
}

export interface GameStats {
  score: number;
  level: number;
  lines: number;
  combo: number;
  maxCombo: number;
  tetrises: number;
  tSpins: number;
  piecesPlaced: number;
  startTime: number;
}

export type GamePhase = 'idle' | 'playing' | 'paused' | 'gameOver';

export interface GameState {
  grid: Grid;
  activePiece: ActivePiece | null;
  holdPiece: PieceType | null;
  holdUsed: boolean;
  nextPieces: PieceType[];
  stats: GameStats;
  phase: GamePhase;
  /** Ghost piece Y position (lowest valid row for current piece) */
  ghostY: number;
  /** Lock delay timer in ms; null when piece is not touching ground */
  lockTimer: number | null;
  /** Lines currently being cleared (for animation) */
  clearingLines: number[];
  /** Time remaining on clear animation in ms */
  clearAnimTimer: number;
  /** Last rotation was a T-spin */
  lastWasTSpin: boolean;
  lastWasMiniTSpin: boolean;
}

export interface HighScoreEntry {
  score: number;
  lines: number;
  level: number;
  date: string;
}

export interface GameSettings {
  volume: number;
  sfxVolume: number;
  ghostPiece: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  volume: 0.7,
  sfxVolume: 0.8,
  ghostPiece: true,
  highContrast: false,
  reducedMotion: false,
};

export const GRID_COLS = 10;
export const GRID_ROWS = 20;
export const LOCK_DELAY_MS = 500;
export const CLEAR_ANIM_MS = 300;
export const DAS_INITIAL_MS = 170;
export const DAS_REPEAT_MS = 50;
export const NEXT_PIECES_COUNT = 3;
