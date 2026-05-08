/**
 * Level data: World 1 (4x4) ships fully spec'd.
 * Worlds 2 (6x6) and 3 (8x8) are stubs for v1.1 — locked from menu.
 *
 * Every World 1 level must pass `isSolvable` from squarePacker — the tester
 * agent runs it as part of QA. Only piece combinations with proven tilings
 * are used here:
 *  - 4xO tiles 4x4 (corner 2x2 each).
 *  - 2xI + 2xO tiles 4x4 (multiple configs: I-vertical + O-stack, I-horizontal + O-row).
 *  - 4xI tiles 4x4 (4 rows or 4 cols).
 *  - Any of the above + a leftover piece (5 pieces, 4 needed).
 */
import type { LevelDefinition, WorldDefinition } from './types.ts';

export const WORLDS: WorldDefinition[] = [
  {
    id: 1,
    name: 'Window Squares',
    description: 'A gentle 4x4 introduction.',
    size: 4,
    unlockRequirement: { previousWorld: 0, minStars: 0 },
    themeKey: 'window',
  },
  {
    id: 2,
    name: 'Garden Tiles',
    description: 'Bigger 6x6 puzzles. Arriving in the next update!',
    size: 6,
    unlockRequirement: { previousWorld: 1, minStars: 16 },
    themeKey: 'garden',
  },
  {
    id: 3,
    name: 'Castle Walls',
    description: 'Mighty 8x8 squares. Arriving in the next update!',
    size: 8,
    unlockRequirement: { previousWorld: 2, minStars: 28 },
    themeKey: 'castle',
  },
];

export const LEVELS: LevelDefinition[] = [
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
    rationale: '4 vertical I-pieces, one per column. Reinforces the row/col idea.',
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
    rationale: 'First rotation lesson: I-pieces given horizontally; rotate to fit cleanly.',
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
    rationale: '4 horizontal I-pieces, one per row. Mirrors level 2 geometry.',
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
    rationale: 'Mixed rotation: one I starts vertical, one horizontal. Player must rotate to match.',
  },
  {
    id: 7,
    worldId: 1,
    name: 'Four of Five Towers',
    size: 4,
    pieces: ['I', 'I', 'I', 'I', 'L'],
    startingRotations: [1, 1, 1, 1, 0],
    obstacles: [],
    timerSeconds: 110,
    threeStarUndos: 1,
    threeStarTimeFloor: 55,
    twoStarUndos: 3,
    twoStarTimeFloor: 25,
    rationale: 'Leftover with rotation: 4 vertical I-pieces, L is the distractor.',
  },
  {
    id: 8,
    worldId: 1,
    name: 'Smooth Sailing',
    size: 4,
    pieces: ['I', 'I', 'O', 'O'],
    startingRotations: [1, 1, 0, 0],
    obstacles: [],
    timerSeconds: 90,
    threeStarUndos: 0,
    threeStarTimeFloor: 50,
    twoStarUndos: 2,
    twoStarTimeFloor: 25,
    rationale: 'Pieces start in canonical orientation; minimal undos needed.',
  },
  {
    id: 9,
    worldId: 1,
    name: 'Five Choices',
    size: 4,
    pieces: ['I', 'I', 'O', 'O', 'O'],
    startingRotations: [0, 0, 0, 0, 0],
    obstacles: [],
    timerSeconds: 100,
    threeStarUndos: 2,
    threeStarTimeFloor: 55,
    twoStarUndos: 4,
    twoStarTimeFloor: 25,
    rationale: 'Leftover-of-O variant: 2 I + 2 O fill, the third O is leftover.',
  },
  {
    id: 10,
    worldId: 1,
    name: 'Capstone Window',
    size: 4,
    pieces: ['O', 'I', 'O', 'I', 'T'],
    startingRotations: [0, 0, 0, 1, 0],
    obstacles: [],
    timerSeconds: 120,
    threeStarUndos: 2,
    threeStarTimeFloor: 60,
    twoStarUndos: 4,
    twoStarTimeFloor: 30,
    rationale: 'Capstone: mixed rotations + leftover T. Consolidates all skills.',
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
