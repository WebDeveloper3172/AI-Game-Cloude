/**
 * Sound effect definitions and paths.
 * Actual audio files are not included yet -- this defines the architecture.
 */

export interface SoundEffectDef {
  id: string;
  path: string;
  description: string;
  defaultVolume: number;
}

export const SOUND_EFFECTS: SoundEffectDef[] = [
  { id: 'move', path: '/audio/tetris/move.mp3', description: 'Piece moved left or right', defaultVolume: 0.3 },
  { id: 'rotate', path: '/audio/tetris/rotate.mp3', description: 'Piece rotated', defaultVolume: 0.4 },
  { id: 'soft-drop', path: '/audio/tetris/soft-drop.mp3', description: 'Piece soft-dropped one cell', defaultVolume: 0.3 },
  { id: 'hard-drop', path: '/audio/tetris/hard-drop.mp3', description: 'Piece hard-dropped to bottom', defaultVolume: 0.6 },
  { id: 'lock', path: '/audio/tetris/lock.mp3', description: 'Piece locked into place', defaultVolume: 0.5 },
  { id: 'line-clear', path: '/audio/tetris/line-clear.mp3', description: '1-3 lines cleared', defaultVolume: 0.7 },
  { id: 'tetris', path: '/audio/tetris/tetris.mp3', description: '4 lines cleared (Tetris)', defaultVolume: 0.8 },
  { id: 'combo', path: '/audio/tetris/combo.mp3', description: 'Combo streak continues', defaultVolume: 0.6 },
  { id: 'tspin', path: '/audio/tetris/tspin.mp3', description: 'T-spin detected', defaultVolume: 0.7 },
  { id: 'level-up', path: '/audio/tetris/level-up.mp3', description: 'Player leveled up', defaultVolume: 0.7 },
  { id: 'hold', path: '/audio/tetris/hold.mp3', description: 'Piece held/swapped', defaultVolume: 0.4 },
  { id: 'game-over', path: '/audio/tetris/game-over.mp3', description: 'Game over jingle', defaultVolume: 0.8 },
  { id: 'pause', path: '/audio/tetris/pause.mp3', description: 'Game paused sound', defaultVolume: 0.4 },
];
