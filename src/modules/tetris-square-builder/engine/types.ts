/** Types for the Square Builder engine. Reuses Classic piece definitions. */
import type { PieceType, RotationState, Position } from '../../tetris-classic/engine/types';

export type { PieceType, RotationState, Position };

export type CellState = number | null;
export type PackingGrid = CellState[][];

export interface TrayPiece {
  id: string;
  type: PieceType;
  rotation: RotationState;
  used: boolean;
}

export interface PlacedPiece {
  trayPieceId: string;
  type: PieceType;
  rotation: RotationState;
  position: Position;
  /** Order of placement, used for undo */
  sequence: number;
}

export interface LevelDefinition {
  id: number;
  worldId: number;
  name: string;
  size: 4 | 6 | 8;
  pieces: PieceType[];
  startingRotations: RotationState[];
  obstacles: Position[];
  timerSeconds: number;
  threeStarUndos: number;
  threeStarTimeFloor: number;
  twoStarUndos: number;
  twoStarTimeFloor: number;
  rationale?: string;
}

export interface WorldDefinition {
  id: number;
  name: string;
  description: string;
  size: 4 | 6 | 8;
  unlockRequirement: { previousWorld: number; minStars: number };
  themeKey: 'window' | 'garden' | 'castle';
}

export type GamePhase = 'world-select' | 'level-select' | 'play' | 'paused' | 'complete' | 'timeup';

export interface LevelProgress {
  levelId: number;
  stars: number;
  completed: boolean;
  bestUndos: number;
  bestTimeRemaining: number;
}

export interface SquareBuilderSave {
  progress: Record<number, LevelProgress>;
  unlockedWorlds: number[];
  tutorialShown: boolean;
  unlockedFrames: string[];
  totalStars: number;
}

export const DEFAULT_SAVE: SquareBuilderSave = {
  progress: {},
  unlockedWorlds: [1],
  tutorialShown: false,
  unlockedFrames: ['plain-wood'],
  totalStars: 0,
};

export interface PlayState {
  level: LevelDefinition;
  grid: PackingGrid;
  tray: TrayPiece[];
  placed: PlacedPiece[];
  selectedTrayPieceId: string | null;
  cursor: Position;
  cursorRotation: RotationState;
  undosUsed: number;
  hintsUsed: number;
  timeRemainingMs: number;
  startedAt: number;
  lastInteractionAt: number;
  isComplete: boolean;
  isTimeUp: boolean;
}

export const HINT_TIME_PENALTY_MS = 10000;
export const INACTIVITY_HINT_MS = 18000;
export const STORAGE_PREFIX = 'tetris-square-builder-';
