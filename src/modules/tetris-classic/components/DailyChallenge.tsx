/**
 * Daily Challenge Counter widget.
 * Tracks daily lines cleared toward a goal of 20.
 * Persists via localStorage key 'tetris-classic-daily'.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tetris-classic-daily';
const DAILY_GOAL = 20;

interface DailyData {
  date: string;
  lines: number;
}

function getTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function loadDaily(): DailyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyData;
      if (parsed.date === getTodayStr()) {
        return parsed;
      }
    }
  } catch {
    // ignore parse errors
  }
  return { date: getTodayStr(), lines: 0 };
}

function saveDaily(data: DailyData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be full
  }
}

/**
 * Add lines to the daily counter. Can be called from outside the component.
 * Returns the updated line count.
 */
export function addDailyLines(count: number): number {
  const data = loadDaily();
  data.lines += count;
  saveDaily(data);
  // Dispatch a custom event so the component can re-render
  window.dispatchEvent(new CustomEvent('tetris-daily-update', { detail: data }));
  return data.lines;
}

export function DailyChallenge() {
  const [daily, setDaily] = useState<DailyData>(loadDaily);

  // Listen for external updates via addDailyLines
  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent<DailyData>).detail;
      setDaily({ ...data });
    };
    window.addEventListener('tetris-daily-update', handler);
    return () => window.removeEventListener('tetris-daily-update', handler);
  }, []);

  // Re-check on mount in case the date rolled over
  useEffect(() => {
    setDaily(loadDaily());
  }, []);

  const progress = Math.min(daily.lines, DAILY_GOAL);
  const pct = Math.min((progress / DAILY_GOAL) * 100, 100);
  const isComplete = daily.lines >= DAILY_GOAL;

  return (
    <div className="tc-daily-challenge">
      <div className="tc-daily-title">Daily Challenge</div>
      {isComplete ? (
        <div className="tc-daily-count tc-daily-complete">Complete!</div>
      ) : (
        <div className="tc-daily-count">
          {daily.lines} / {DAILY_GOAL} lines
        </div>
      )}
      <div className="tc-daily-progress-bar">
        <div
          className="tc-daily-progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
