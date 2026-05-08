/**
 * Level data: Worlds 1 and 2 ship with mixed-shape levels.
 * World 3 is a stub for v1.1.
 *
 * Every level must pass `isSolvable` from squarePacker.
 *
 * Shape variety is achieved with `obstacles` (cells the player cannot fill).
 * A level's playable region = (size x size) - obstacles. The number of pieces
 * minus leftovers must equal (playable cells) / 4.
 *
 * Tested-tileable shapes used here:
 *  - Plain 4x4 (16 cells, 4 tetrominoes)
 *  - L-shape: 4x4 minus a corner 2x2 (12 cells, 3 tetrominoes — 3 O's tile any L)
 *  - T-shape (T-cap): top corners cut, bar on top + stem down (12 cells)
 *  - 4x3 (12 cells, 3 horizontal I's)
 *  - 3x4 (12 cells, 3 vertical I's)
 *  - 4x2 (8 cells, 2 horizontal I's)
 *  - 2x4 (8 cells, 2 vertical I's)
 */
import type { LevelDefinition, WorldDefinition } from './types.ts';

export const WORLDS: WorldDefinition[] = [
  {
    id: 1,
    name: 'Window Squares',
    description: 'A gentle 4x4 introduction. Squares, towers, and L-shapes.',
    size: 4,
    unlockRequirement: { previousWorld: 0, minStars: 0 },
    themeKey: 'window',
  },
  {
    id: 2,
    name: 'Garden Tiles',
    description: 'Different shapes! Crosses, benches, and pillars.',
    size: 4,
    unlockRequirement: { previousWorld: 1, minStars: 6 },
    themeKey: 'garden',
  },
  {
    id: 3,
    name: 'Castle Walls',
    description: 'Mighty 8x8 squares. Arriving in the next update!',
    size: 8,
    unlockRequirement: { previousWorld: 2, minStars: 16 },
    themeKey: 'castle',
  },
];

export const LEVELS: LevelDefinition[] = [
  // ===== WORLD 1: Window Squares — pure 4x4 squares (1-6), then shapes (7-10) =====
  {
    id: 1,
    worldId: 1,
    name: 'Hello Square',
    size: 4,
    pieces: ['O', 'O', 'O', 'O'],
    startingRotations: [0, 0, 0, 0],
    obstacles: [],
    timerSeconds: 90,
    threeStarUndos: 0,
    threeStarTimeFloor: 60,
    twoStarUndos: 2,
    twoStarTimeFloor: 30,
    rationale: 'Confidence: 4 O-pieces fill 4 corners. No rotation needed.',
  },
  {
    id: 2,
    worldId: 1,
    name: 'Tall Towers',
    size: 4,
    pieces: ['I', 'I', 'I', 'I'],
    startingRotations: [1, 1, 1, 1],
    obstacles: [],
    timerSeconds: 90,
    threeStarUndos: 0,
    threeStarTimeFloor: 55,
    twoStarUndos: 2,
    twoStarTimeFloor: 25,
    rationale: '4 vertical I-pieces, one per column.',
  },
  {
    id: 3,
    worldId: 1,
    name: 'Turning Trick',
    size: 4,
    pieces: ['I', 'I', 'O', 'O'],
    startingRotations: [0, 0, 0, 0],
    obstacles: [],
    timerSeconds: 90,
    threeStarUndos: 1,
    threeStarTimeFloor: 50,
    twoStarUndos: 3,
    twoStarTimeFloor: 25,
    rationale: 'First rotation lesson: I-pieces given horizontally; rotate to fit.',
  },
  {
    id: 4,
    worldId: 1,
    name: 'Pick Four of Five',
    size: 4,
    pieces: ['O', 'O', 'O', 'O', 'T'],
    startingRotations: [0, 0, 0, 0, 0],
    obstacles: [],
    timerSeconds: 100,
    threeStarUndos: 1,
    threeStarTimeFloor: 50,
    twoStarUndos: 3,
    twoStarTimeFloor: 25,
    rationale: 'First leftover: T is the distractor; 4 O-pieces fill the square.',
  },
  {
    id: 5,
    worldId: 1,
    name: 'Long Roof',
    size: 4,
    pieces: ['I', 'I', 'I', 'I'],
    startingRotations: [0, 0, 0, 0],
    obstacles: [],
    timerSeconds: 90,
    threeStarUndos: 0,
    threeStarTimeFloor: 55,
    twoStarUndos: 2,
    twoStarTimeFloor: 25,
    rationale: '4 horizontal I-pieces, one per row.',
  },
  {
    id: 6,
    worldId: 1,
    name: 'Switching Sides',
    size: 4,
    pieces: ['I', 'O', 'I', 'O'],
    startingRotations: [1, 0, 0, 0],
    obstacles: [],
    timerSeconds: 100,
    threeStarUndos: 2,
    threeStarTimeFloor: 50,
    twoStarUndos: 4,
    twoStarTimeFloor: 25,
    rationale: 'Mixed rotation: one I starts vertical, one horizontal.',
  },

  // --- New shaped levels in World 1 ---
  {
    id: 7,
    worldId: 1,
    name: 'Notched Window',
    size: 4,
    pieces: ['O', 'O', 'O'],
    startingRotations: [0, 0, 0],
    obstacles: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    timerSeconds: 80,
    threeStarUndos: 0,
    threeStarTimeFloor: 50,
    twoStarUndos: 2,
    twoStarTimeFloor: 25,
    rationale: 'First non-square shape! L-shape carved by a top-right notch. 3 O-pieces tile.',
  },
  {
    id: 8,
    worldId: 1,
    name: 'Half Window',
    size: 4,
    pieces: ['I', 'I', 'I'],
    startingRotations: [0, 0, 0],
    obstacles: [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
    timerSeconds: 80,
    threeStarUndos: 0,
    threeStarTimeFloor: 50,
    twoStarUndos: 2,
    twoStarTimeFloor: 25,
    rationale: 'A 4x3 strip. Three horizontal I-pieces stack into rows.',
  },
  {
    id: 9,
    worldId: 1,
    name: 'Tall Window',
    size: 4,
    pieces: ['I', 'I', 'I'],
    startingRotations: [1, 1, 1],
    obstacles: [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }],
    timerSeconds: 80,
    threeStarUndos: 0,
    threeStarTimeFloor: 50,
    twoStarUndos: 2,
    twoStarTimeFloor: 25,
    rationale: 'A 3x4 strip. Three vertical I-pieces line up.',
  },
  {
    id: 10,
    worldId: 1,
    name: 'Capstone Window',
    size: 4,
    pieces: ['O', 'O', 'I', 'I', 'T'],
    startingRotations: [0, 0, 0, 0, 0],
    obstacles: [],
    timerSeconds: 120,
    threeStarUndos: 2,
    threeStarTimeFloor: 60,
    twoStarUndos: 4,
    twoStarTimeFloor: 30,
    rationale: 'Capstone with leftover. 2 O + 2 I horizontal tile cleanly. T is the leftover.',
  },

  // ===== WORLD 2: Garden Tiles — diverse shapes + leftovers =====
  {
    id: 11,
    worldId: 2,
    name: 'T-Garden',
    size: 4,
    pieces: ['I', 'I', 'O'],
    startingRotations: [0, 0, 0],
    obstacles: [{ x: 0, y: 2 }, { x: 3, y: 2 }, { x: 0, y: 3 }, { x: 3, y: 3 }],
    timerSeconds: 100,
    threeStarUndos: 1,
    threeStarTimeFloor: 60,
    twoStarUndos: 3,
    twoStarTimeFloor: 30,
    rationale: 'T-cap shape: 2 horizontal I-pieces fill the bar; O fills the stem.',
  },
  {
    id: 12,
    worldId: 2,
    name: 'Wide Bench',
    size: 4,
    pieces: ['I', 'I'],
    startingRotations: [0, 0],
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
      { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
    ],
    timerSeconds: 60,
    threeStarUndos: 0,
    threeStarTimeFloor: 35,
    twoStarUndos: 1,
    twoStarTimeFloor: 15,
    rationale: 'Just two rows: 4x2 bench. Two horizontal I-pieces.',
  },
  {
    id: 13,
    worldId: 2,
    name: 'Pillar Pair',
    size: 4,
    pieces: ['I', 'I'],
    startingRotations: [1, 1],
    obstacles: [
      { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 },
    ],
    timerSeconds: 60,
    threeStarUndos: 0,
    threeStarTimeFloor: 35,
    twoStarUndos: 1,
    twoStarTimeFloor: 15,
    rationale: 'A 2x4 column strip. Two vertical I-pieces.',
  },
  {
    id: 14,
    worldId: 2,
    name: 'Mirror Notch',
    size: 4,
    pieces: ['O', 'O', 'O'],
    startingRotations: [0, 0, 0],
    obstacles: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
    timerSeconds: 80,
    threeStarUndos: 0,
    threeStarTimeFloor: 50,
    twoStarUndos: 2,
    twoStarTimeFloor: 25,
    rationale: 'L-shape mirrored: bottom-right cut. 3 O-pieces tile.',
  },
  {
    id: 15,
    worldId: 2,
    name: 'Big L Garden',
    size: 4,
    pieces: ['O', 'O', 'O', 'T'],
    startingRotations: [0, 0, 0, 0],
    obstacles: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    timerSeconds: 100,
    threeStarUndos: 1,
    threeStarTimeFloor: 60,
    twoStarUndos: 3,
    twoStarTimeFloor: 30,
    rationale: 'L-shape with leftover: T is the distractor; 3 O-pieces fill the L.',
  },
  {
    id: 16,
    worldId: 2,
    name: 'Garden Capstone',
    size: 4,
    pieces: ['I', 'I', 'O', 'T'],
    startingRotations: [0, 0, 0, 0],
    obstacles: [{ x: 0, y: 2 }, { x: 3, y: 2 }, { x: 0, y: 3 }, { x: 3, y: 3 }],
    timerSeconds: 110,
    threeStarUndos: 1,
    threeStarTimeFloor: 60,
    twoStarUndos: 3,
    twoStarTimeFloor: 30,
    rationale: 'T-cap with leftover. 2 horizontal I + O tile; T is the distractor.',
  },
];

export function getLevelById(id: number): LevelDefinition | undefined {
  return LEVELS.find(l => l.id === id);
}

export function getLevelsByWorld(worldId: number): LevelDefinition[] {
  return LEVELS.filter(l => l.worldId === worldId);
}

export function getWorldById(id: number): WorldDefinition | undefined {
  return WORLDS.find(w => w.id === id);
}
