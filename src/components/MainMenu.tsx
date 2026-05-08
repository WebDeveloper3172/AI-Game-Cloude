/**
 * Main menu with game logo, play button, settings, and daily challenge.
 */
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { getAudioEngine } from '../modules/tetris-classic/audio/AudioEngine';
import { useSettings } from '../modules/tetris-classic/hooks/useLocalStorage';

/** Get today's date string for daily challenge tracking */
function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface DailyProgress {
  date: string;
  lines: number;
}

function getDailyProgress(): DailyProgress {
  try {
    const raw = localStorage.getItem('tetris-classic-daily');
    if (raw) {
      const parsed = JSON.parse(raw) as DailyProgress;
      if (parsed.date === getTodayStr()) return parsed;
    }
  } catch { /* ignore */ }
  return { date: getTodayStr(), lines: 0 };
}

const FALLING_PIECES = [
  { color: 'var(--tc-i)', size: 20, left: 5, duration: 25, delay: 0 },
  { color: 'var(--tc-o)', size: 16, left: 15, duration: 32, delay: 4 },
  { color: 'var(--tc-t)', size: 24, left: 28, duration: 28, delay: 8 },
  { color: 'var(--tc-s)', size: 18, left: 42, duration: 35, delay: 2 },
  { color: 'var(--tc-z)', size: 22, left: 55, duration: 22, delay: 12 },
  { color: 'var(--tc-j)', size: 15, left: 68, duration: 30, delay: 6 },
  { color: 'var(--tc-l)', size: 28, left: 80, duration: 38, delay: 10 },
  { color: 'var(--tc-i)', size: 17, left: 92, duration: 26, delay: 15 },
  { color: 'var(--tc-t)', size: 30, left: 35, duration: 40, delay: 18 },
  { color: 'var(--tc-z)', size: 19, left: 72, duration: 20, delay: 7 },
];

export function MainMenu() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [daily, setDaily] = useState<DailyProgress>(getDailyProgress);
  const DAILY_GOAL = 20;

  // Re-check daily progress on mount (handles midnight reset)
  useEffect(() => {
    setDaily(getDailyProgress());
  }, []);

  // Start music on mount (continues between pages via singleton)
  useEffect(() => {
    const engine = getAudioEngine();
    engine.init();
    engine.resume();
    engine.setMasterVolume(settings.volume);
    engine.setMusicVolume(settings.musicEnabled ? settings.volume : 0);
    engine.startMusic();
    // No cleanup — music continues when navigating to other pages
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume changes in real time
  useEffect(() => {
    const engine = getAudioEngine();
    engine.setMasterVolume(settings.volume);
    engine.setMusicVolume(settings.musicEnabled ? settings.volume : 0);
  }, [settings.volume, settings.musicEnabled]);

  const fallingBlocks = useMemo(() => (
    <div className="main-menu-falling-bg" aria-hidden="true">
      {FALLING_PIECES.map((p, i) => (
        <div
          key={i}
          className="main-menu-falling-block"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  ), []);

  return (
    <div className="main-menu">
      {fallingBlocks}
      <div className="main-menu-content">
        <div className="main-menu-logo">
          <h1 className="main-menu-title">
            <span className="logo-block logo-t">T</span>
            <span className="logo-block logo-e">E</span>
            <span className="logo-block logo-t2">T</span>
            <span className="logo-block logo-r">R</span>
            <span className="logo-block logo-i">I</span>
            <span className="logo-block logo-s">S</span>
          </h1>
          <p className="main-menu-subtitle">Fun Blocks for Kids!</p>
        </div>

        <div className="main-menu-games-section">
          <h2 className="main-menu-section-title">Pick a Game</h2>
          <div className="main-menu-games-grid">
            <button
              className="game-card game-card-classic"
              onClick={() => navigate('/tetris-classic')}
              type="button"
              autoFocus
              aria-label="Play Classic Tetris"
            >
              <div className="game-card-icon" aria-hidden="true">&#x25B6;</div>
              <div className="game-card-title">Classic Tetris</div>
              <div className="game-card-desc">Falling blocks. Clear lines to score!</div>
            </button>

            <button
              className="game-card game-card-square-builder"
              onClick={() => navigate('/tetris-square-builder')}
              type="button"
              aria-label="Play Square Builder"
            >
              <div className="game-card-icon" aria-hidden="true">&#x25A2;</div>
              <div className="game-card-title">Square Builder</div>
              <div className="game-card-desc">Fill the square with tetromino pieces!</div>
            </button>
          </div>
        </div>

        <div className="main-menu-buttons main-menu-utility-row">
          <button
            className="menu-btn menu-btn-leaderboard"
            onClick={() => navigate('/leaderboard')}
            type="button"
          >
            <span className="menu-btn-icon">&#x265B;</span>
            Leaderboard
          </button>

          <button
            className="menu-btn menu-btn-settings"
            onClick={() => navigate('/settings')}
            type="button"
          >
            <span className="menu-btn-icon">&#x2699;</span>
            Settings
          </button>
        </div>

        <div className="main-menu-daily">
          {daily.lines >= DAILY_GOAL ? (
            <span className="main-menu-daily-complete">Daily Complete!</span>
          ) : (
            <span className="main-menu-daily-progress">
              Daily: {daily.lines}/{DAILY_GOAL} lines
            </span>
          )}
        </div>

        <div className="main-menu-footer">
          <p>Use arrow keys to play. Have fun!</p>
        </div>
      </div>
    </div>
  );
}
