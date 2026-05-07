/**
 * Hook for saving/loading game state, high scores, and settings to localStorage.
 * All keys are prefixed with 'tetris-classic-'.
 */
import { useState, useCallback } from 'react';
import type { HighScoreEntry, GameSettings } from '../engine/types';
import { DEFAULT_SETTINGS } from '../engine/types';

const PREFIX = 'tetris-classic-';

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => getItem(key, initialValue));

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        setItem(key, newValue);
        return newValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}

/** High scores management. */
export function useHighScores() {
  const [scores, setScores] = useLocalStorage<HighScoreEntry[]>('high-scores', []);

  const addScore = useCallback(
    (entry: HighScoreEntry) => {
      setScores(prev => {
        const updated = [...prev, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Keep top 10
        return updated;
      });
    },
    [setScores],
  );

  return { scores, addScore };
}

/** Settings management. */
export function useSettings() {
  const [settings, setSettings] = useLocalStorage<GameSettings>('settings', DEFAULT_SETTINGS);

  const updateSetting = useCallback(
    <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    },
    [setSettings],
  );

  return { settings, updateSetting, setSettings };
}
