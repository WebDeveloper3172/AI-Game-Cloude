/**
 * Input handling hook for keyboard and touch controls.
 * Implements DAS (Delayed Auto Shift) for smooth piece movement.
 */
import { useRef, useEffect, useCallback } from 'react';
import { DAS_INITIAL_MS, DAS_REPEAT_MS } from '../engine/types';

export type GameAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'hold'
  | 'pause';

interface DASState {
  action: 'moveLeft' | 'moveRight' | 'softDrop' | null;
  timer: number;
  initial: boolean;
}

export interface InputCallbacks {
  onAction: (action: GameAction) => void;
}

/**
 * Hook that listens for keyboard input and calls onAction for each game action.
 * Handles DAS for left/right/down movement.
 */
export function useInput(callbacks: InputCallbacks, enabled: boolean) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const dasState = useRef<DASState>({ action: null, timer: 0, initial: true });
  const keysDown = useRef(new Set<string>());
  const dasTimeout = useRef<number | null>(null);
  const dasRepeat = useRef<number | null>(null);

  const fireAction = useCallback((action: GameAction) => {
    callbacksRef.current.onAction(action);
  }, []);

  const keyToAction = useCallback((key: string): GameAction | null => {
    switch (key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        return 'moveLeft';
      case 'ArrowRight':
      case 'd':
      case 'D':
        return 'moveRight';
      case 'ArrowDown':
      case 's':
      case 'S':
        return 'softDrop';
      case 'ArrowUp':
      case 'w':
      case 'W':
        return 'rotateCW';
      case 'z':
      case 'Z':
        return 'rotateCCW';
      case ' ':
        return 'hardDrop';
      case 'c':
      case 'C':
      case 'Shift':
        return 'hold';
      case 'p':
      case 'P':
      case 'Escape':
        return 'pause';
      default:
        return null;
    }
  }, []);

  const stopDAS = useCallback(() => {
    if (dasTimeout.current !== null) {
      window.clearTimeout(dasTimeout.current);
      dasTimeout.current = null;
    }
    if (dasRepeat.current !== null) {
      window.clearInterval(dasRepeat.current);
      dasRepeat.current = null;
    }
    dasState.current = { action: null, timer: 0, initial: true };
  }, []);

  const startDAS = useCallback((action: 'moveLeft' | 'moveRight' | 'softDrop') => {
    // Clear existing DAS
    stopDAS();
    dasState.current = { action, timer: 0, initial: true };

    // Fire immediately
    fireAction(action);

    // Start DAS timer
    dasTimeout.current = window.setTimeout(() => {
      dasTimeout.current = null;
      // After initial delay, repeat at faster rate
      dasState.current.initial = false;
      fireAction(action);
      dasRepeat.current = window.setInterval(() => {
        if (dasState.current.action === action) {
          fireAction(action);
        }
      }, DAS_REPEAT_MS);
    }, DAS_INITIAL_MS);
  }, [fireAction, stopDAS]);

  useEffect(() => {
    if (!enabled) {
      stopDAS();
      keysDown.current.clear();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // We handle repeat ourselves via DAS
      const action = keyToAction(e.key);
      if (action === null) return;

      e.preventDefault();
      keysDown.current.add(e.key);

      if (action === 'moveLeft' || action === 'moveRight' || action === 'softDrop') {
        startDAS(action);
      } else {
        fireAction(action);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key);
      const action = keyToAction(e.key);
      if (action === dasState.current.action) {
        stopDAS();
      }
    };

    const handleBlur = () => {
      keysDown.current.clear();
      stopDAS();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      stopDAS();
    };
  }, [enabled, keyToAction, startDAS, stopDAS, fireAction]);
}

/**
 * Touch input helpers. Returns handlers for touch controls buttons.
 */
export function useTouchAction(onAction: (action: GameAction) => void) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const createHandler = useCallback((action: GameAction) => {
    return () => onActionRef.current(action);
  }, []);

  return { createHandler };
}
