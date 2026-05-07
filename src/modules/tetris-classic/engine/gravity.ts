/**
 * Gravity/speed tables per level and tick timing.
 * Speed is expressed as cells per second. Higher levels = faster falling.
 */

/** Frames per grid cell at 60fps for each level (NES-style curve adapted). */
const GRAVITY_TABLE: number[] = [
  // Level 1-5: comfortable start, noticeable speed increase each level
  48,  // ~1.25 cells/sec
  38,  // ~1.58
  30,  // ~2.0
  24,  // ~2.5
  19,  // ~3.16
  // Level 6-10: getting fast
  15,  // ~4.0
  12,  // ~5.0
  9,   // ~6.67
  7,   // ~8.57
  5,   // ~12.0
  // Level 11-15: very fast
  4,   // ~15.0
  3,   // ~20.0
  3,   // ~20.0
  2,   // ~30.0
  2,   // ~30.0
  // Level 16-20: extreme
  1,
  1,
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
