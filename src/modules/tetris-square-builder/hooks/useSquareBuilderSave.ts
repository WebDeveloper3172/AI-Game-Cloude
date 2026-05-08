/**
 * localStorage save state for Square Builder.
 * Namespace: 'tetris-square-builder-*' — distinct from tetris-classic.
 */
import { useCallback, useState } from 'react';
import {
  DEFAULT_SAVE,
  STORAGE_PREFIX,
  type LevelProgress,
  type SquareBuilderSave,
} from '../engine/types.ts';

const SAVE_KEY = `${STORAGE_PREFIX}save`;

function loadSave(): SquareBuilderSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw) as Partial<SquareBuilderSave>;
    return { ...DEFAULT_SAVE, ...parsed };
  } catch {
    return DEFAULT_SAVE;
  }
}

function persist(save: SquareBuilderSave): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // localStorage might be full or unavailable — silent fail
  }
}

export function useSquareBuilderSave() {
  const [save, setSave] = useState<SquareBuilderSave>(loadSave);

  const recordLevelResult = useCallback((result: LevelProgress) => {
    setSave(prev => {
      const existing = prev.progress[result.levelId];
      const merged: LevelProgress = existing
        ? {
            ...result,
            stars: Math.max(existing.stars, result.stars),
            bestUndos: Math.min(existing.bestUndos, result.bestUndos),
            bestTimeRemaining: Math.max(existing.bestTimeRemaining, result.bestTimeRemaining),
            completed: true,
          }
        : { ...result, completed: true };
      const progress = { ...prev.progress, [result.levelId]: merged };
      const totalStars = Object.values(progress).reduce((sum, p) => sum + p.stars, 0);
      const next = { ...prev, progress, totalStars };
      persist(next);
      return next;
    });
  }, []);

  const markTutorialShown = useCallback(() => {
    setSave(prev => {
      if (prev.tutorialShown) return prev;
      const next = { ...prev, tutorialShown: true };
      persist(next);
      return next;
    });
  }, []);

  const isWorldUnlocked = useCallback((worldId: number): boolean => {
    return save.unlockedWorlds.includes(worldId);
  }, [save.unlockedWorlds]);

  const unlockWorld = useCallback((worldId: number) => {
    setSave(prev => {
      if (prev.unlockedWorlds.includes(worldId)) return prev;
      const next = { ...prev, unlockedWorlds: [...prev.unlockedWorlds, worldId] };
      persist(next);
      return next;
    });
  }, []);

  return {
    save,
    recordLevelResult,
    markTutorialShown,
    isWorldUnlocked,
    unlockWorld,
  };
}
