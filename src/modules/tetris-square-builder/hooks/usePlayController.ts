/**
 * Game controller for an active level: state, timer, undo/hint/place, completion.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildInitialPlayState,
  commitPlacement,
  computeStars,
  findHint,
  isLegalPlacement,
  undoLast,
} from '../engine/squarePacker.ts';
import {
  HINT_TIME_PENALTY_MS,
  INACTIVITY_HINT_MS,
  type LevelDefinition,
  type LevelProgress,
  type PlayState,
  type Position,
  type RotationState,
  type TrayPiece,
} from '../engine/types.ts';

interface PlayControllerOpts {
  level: LevelDefinition;
  paused: boolean;
  onComplete: (result: LevelProgress) => void;
  onTimeUp: () => void;
  onInactivityHint: () => void;
}

export function usePlayController(opts: PlayControllerOpts) {
  const [state, setState] = useState<PlayState>(() => buildInitialPlayState(opts.level));
  const stateRef = useRef(state);
  stateRef.current = state;
  const completedRef = useRef(false);
  const timeUpRef = useRef(false);

  // Reset on level change
  useEffect(() => {
    setState(buildInitialPlayState(opts.level));
    completedRef.current = false;
    timeUpRef.current = false;
  }, [opts.level]);

  // Game timer (counts down). Stops on pause / complete / time up.
  useEffect(() => {
    if (opts.paused) return;
    if (state.isComplete || state.isTimeUp) return;
    const id = window.setInterval(() => {
      setState(prev => {
        if (prev.isComplete || prev.isTimeUp) return prev;
        const next = Math.max(0, prev.timeRemainingMs - 250);
        if (next === 0) {
          if (!timeUpRef.current) {
            timeUpRef.current = true;
            queueMicrotask(() => opts.onTimeUp());
          }
          return { ...prev, timeRemainingMs: 0, isTimeUp: true };
        }
        return { ...prev, timeRemainingMs: next };
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [opts.paused, state.isComplete, state.isTimeUp, opts]);

  // Inactivity hint timer
  useEffect(() => {
    if (opts.paused || state.isComplete || state.isTimeUp) return;
    const id = window.setInterval(() => {
      const idleMs = Date.now() - stateRef.current.lastInteractionAt;
      if (idleMs >= INACTIVITY_HINT_MS) {
        opts.onInactivityHint();
        // Reset interaction stamp to prevent re-firing
        setState(prev => ({ ...prev, lastInteractionAt: Date.now() }));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [opts.paused, state.isComplete, state.isTimeUp, opts]);

  // Completion side-effect.
  // Guard with `state.level.id === opts.level.id` to prevent the brief window
  // during a level transition where state still reports the previous level as
  // complete; without this, the result dialog can fire twice in a row.
  useEffect(() => {
    if (
      state.isComplete &&
      state.level.id === opts.level.id &&
      !completedRef.current
    ) {
      completedRef.current = true;
      const stars = computeStars(opts.level, state.undosUsed, state.timeRemainingMs);
      const result: LevelProgress = {
        levelId: opts.level.id,
        stars,
        completed: true,
        bestUndos: state.undosUsed,
        bestTimeRemaining: state.timeRemainingMs,
      };
      opts.onComplete(result);
    }
  }, [state.isComplete, state.level.id, state.undosUsed, state.timeRemainingMs, opts]);

  const selectTrayPiece = useCallback((trayPieceId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedTrayPieceId: trayPieceId,
      lastInteractionAt: Date.now(),
    }));
  }, []);

  const rotateSelectedPiece = useCallback(() => {
    setState(prev => {
      if (!prev.selectedTrayPieceId) return prev;
      const tray = prev.tray.map((p): TrayPiece =>
        p.id === prev.selectedTrayPieceId
          ? { ...p, rotation: ((p.rotation + 1) & 3) as RotationState }
          : p,
      );
      return { ...prev, tray, lastInteractionAt: Date.now() };
    });
  }, []);

  const place = useCallback((position: Position) => {
    setState(prev => {
      if (!prev.selectedTrayPieceId) return prev;
      const piece = prev.tray.find(p => p.id === prev.selectedTrayPieceId);
      if (!piece) return prev;
      return commitPlacement(prev, piece.id, piece.rotation, position);
    });
  }, []);

  const tryPlaceLegal = useCallback((position: Position): boolean => {
    const cur = stateRef.current;
    if (!cur.selectedTrayPieceId) return false;
    const piece = cur.tray.find(p => p.id === cur.selectedTrayPieceId);
    if (!piece) return false;
    return isLegalPlacement(cur.grid, piece, piece.rotation, position);
  }, []);

  const undo = useCallback(() => {
    setState(prev => undoLast(prev));
  }, []);

  const requestHint = useCallback(() => {
    setState(prev => {
      const hint = findHint(prev.grid, prev.tray);
      if (!hint) return prev;
      const next = commitPlacement(prev, hint.trayPieceId, hint.rotation, hint.position);
      // Penalty: take time away
      return {
        ...next,
        timeRemainingMs: Math.max(0, next.timeRemainingMs - HINT_TIME_PENALTY_MS),
        hintsUsed: prev.hintsUsed + 1,
        lastInteractionAt: Date.now(),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(buildInitialPlayState(opts.level));
    completedRef.current = false;
    timeUpRef.current = false;
  }, [opts.level]);

  return {
    state,
    selectTrayPiece,
    rotateSelectedPiece,
    place,
    tryPlaceLegal,
    undo,
    requestHint,
    reset,
  };
}
