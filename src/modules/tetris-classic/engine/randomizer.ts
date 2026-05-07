/**
 * 7-bag randomizer for piece generation.
 * Generates pieces in shuffled bags of all 7 types,
 * ensuring fair distribution and no long droughts.
 */
import type { PieceType } from './types';
import { ALL_PIECE_TYPES } from './pieces';

/** Fisher-Yates shuffle (in-place). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate a new shuffled bag of all 7 piece types. */
function newBag(): PieceType[] {
  return shuffle([...ALL_PIECE_TYPES]);
}

export interface Randomizer {
  /** Get the next piece from the bag. */
  next(): PieceType;
  /** Peek at upcoming pieces without consuming them. */
  peek(count: number): PieceType[];
  /** Reset the randomizer. */
  reset(): void;
}

export function createRandomizer(): Randomizer {
  let queue: PieceType[] = [];

  function ensureQueue(count: number): void {
    while (queue.length < count) {
      queue = queue.concat(newBag());
    }
  }

  function next(): PieceType {
    ensureQueue(1);
    return queue.shift()!;
  }

  function peek(count: number): PieceType[] {
    ensureQueue(count);
    return queue.slice(0, count);
  }

  function reset(): void {
    queue = [];
    ensureQueue(14); // Pre-fill 2 bags
  }

  // Initialize
  reset();

  return { next, peek, reset };
}
