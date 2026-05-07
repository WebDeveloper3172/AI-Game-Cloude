/**
 * requestAnimationFrame-based game loop with gravity ticks.
 * Calls the tick callback at each frame with delta time.
 */
import { useRef, useCallback, useEffect } from 'react';

export interface GameLoopControls {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * Game loop hook. Calls `onTick(deltaMs)` every animation frame while running.
 */
export function useGameLoop(onTick: (deltaMs: number) => void): GameLoopControls {
  const rafId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);
  const running = useRef(false);
  const tickRef = useRef(onTick);

  // Keep callback ref up to date without re-creating loop
  useEffect(() => {
    tickRef.current = onTick;
  }, [onTick]);

  const loop = useCallback((now: number) => {
    if (!running.current) return;
    const delta = lastTime.current === 0 ? 16.67 : now - lastTime.current;
    lastTime.current = now;
    // Cap delta to avoid huge jumps (e.g., after tab switch)
    const cappedDelta = Math.min(delta, 200);
    tickRef.current(cappedDelta);
    rafId.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    lastTime.current = 0;
    rafId.current = requestAnimationFrame(loop);
  }, [loop]);

  const stop = useCallback(() => {
    running.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const isRunning = useCallback(() => running.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      running.current = false;
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return { start, stop, isRunning };
}
