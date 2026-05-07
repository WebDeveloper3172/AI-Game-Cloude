/**
 * Gravity/speed tables per level and tick timing.
 * Speed is expressed as cells per second. Higher levels = faster falling.
 */

/** Frames per grid cell at 60fps for each level (NES-style curve adapted). */
const GRAVITY_TABLE: number[] = [
  // Level 1-10
  60,  // ~1.0 cells/sec
  53,  // ~1.13
  46,  // ~1.3
  39,  // ~1.54
  33,  // ~1.82
  27,  // ~2.22
  22,  // ~2.73
  17,  // ~3.53
  13,  // ~4.62
  10,  // ~6.0
  // Level 11-15
  8,   // ~7.5
  6,   // ~10.0
  5,   // ~12.0
  4,   // ~15.0
  3,   // ~20.0
  // Level 16-20
  2,
  2,
  1,
  1,
  1,
];

/**
 * Get the gravity interval in milliseconds for a given level.
 * This is how often the piece drops one cell.
 */
export function getGravityInterval(level: number): number {
  const idx = Math.min(level - 1, GRAVITY_TABLE.length - 1);
  const frames = GRAVITY_TABLE[Math.max(0, idx)];
  // Convert frames at 60fps to milliseconds
  return (frames / 60) * 1000;
}

/**
 * Get cells per second for display purposes.
 */
export function getCellsPerSecond(level: number): number {
  const interval = getGravityInterval(level);
  return 1000 / interval;
}
