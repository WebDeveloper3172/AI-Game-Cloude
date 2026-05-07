/**
 * Pause menu overlay with focus trap and audio settings.
 */
import { useEffect, useRef, useState } from 'react';
import type { GameSettings } from '../engine/types';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  settings: GameSettings;
  onUpdateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
}

export function PauseOverlay({ onResume, onRestart, onQuit, settings, onUpdateSetting }: PauseOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAudio, setShowAudio] = useState(false);

  // Focus trap: keep focus within the overlay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableEls = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableEls.length > 0) {
      focusableEls[0].focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const allFocusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = allFocusable[0];
      const last = allFocusable[allFocusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onResume();
      }
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onResume]);

  return (
    <div className="tc-pause-overlay" role="dialog" aria-label="Game paused" ref={containerRef}>
      <div className="tc-pause-content">
        <h2 className="tc-pause-title">Paused</h2>

        {!showAudio ? (
          <>
            <div className="tc-pause-buttons">
              <button
                className="tc-btn tc-btn-primary"
                onClick={onResume}
                type="button"
              >
                Resume
              </button>
              <button
                className="tc-btn tc-btn-secondary"
                onClick={() => setShowAudio(true)}
                type="button"
              >
                &#x266B; Audio Settings
              </button>
              <button
                className="tc-btn tc-btn-secondary"
                onClick={onRestart}
                type="button"
              >
                Restart
              </button>
              <button
                className="tc-btn tc-btn-secondary"
                onClick={onQuit}
                type="button"
              >
                Quit to Menu
              </button>
            </div>
            <p className="tc-pause-hint">Press Escape or P to resume</p>
          </>
        ) : (
          <>
            <div className="tc-pause-audio">
              <div className="tc-pause-audio-row">
                <span className="tc-pause-audio-label">Music</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={e => onUpdateSetting('volume', parseFloat(e.target.value))}
                  className="tc-pause-slider"
                  aria-label="Music volume"
                />
                <span className="tc-pause-audio-value">{Math.round(settings.volume * 100)}%</span>
              </div>

              <div className="tc-pause-audio-row">
                <span className="tc-pause-audio-label">SFX</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.sfxVolume}
                  onChange={e => onUpdateSetting('sfxVolume', parseFloat(e.target.value))}
                  className="tc-pause-slider"
                  aria-label="Sound effects volume"
                />
                <span className="tc-pause-audio-value">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>

              <div className="tc-pause-audio-row">
                <span className="tc-pause-audio-label">Music</span>
                <button
                  type="button"
                  className={`tc-pause-toggle ${settings.musicEnabled ? 'active' : ''}`}
                  onClick={() => onUpdateSetting('musicEnabled', !settings.musicEnabled)}
                >
                  {settings.musicEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="tc-pause-audio-row">
                <span className="tc-pause-audio-label">SFX</span>
                <button
                  type="button"
                  className={`tc-pause-toggle ${settings.sfxEnabled ? 'active' : ''}`}
                  onClick={() => onUpdateSetting('sfxEnabled', !settings.sfxEnabled)}
                >
                  {settings.sfxEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="tc-pause-buttons" style={{ marginTop: 'var(--gap-md)' }}>
              <button
                className="tc-btn tc-btn-primary"
                onClick={() => setShowAudio(false)}
                type="button"
              >
                &#x2190; Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
