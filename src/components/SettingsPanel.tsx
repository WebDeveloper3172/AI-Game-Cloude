/**
 * Settings panel with volume, SFX, accessibility toggles, and theme selector.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../modules/tetris-classic/hooks/useLocalStorage';
import { getAudioEngine } from '../modules/tetris-classic/audio/AudioEngine';
import type { ThemeName } from '../modules/tetris-classic/engine/types';

const THEMES: { id: ThemeName; label: string; description: string }[] = [
  { id: 'dark', label: 'Dark', description: 'Classic dark theme' },
  { id: 'neon', label: 'Neon', description: 'Vibrant neon glow' },
  { id: 'pastel', label: 'Pastel', description: 'Soft and friendly' },
];

export function SettingsPanel() {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();

  // Ensure music is playing (continues from main menu via singleton)
  useEffect(() => {
    const engine = getAudioEngine();
    engine.init();
    engine.resume();
    engine.startMusic();
  }, []);

  // Sync volume/music toggle changes instantly
  useEffect(() => {
    const engine = getAudioEngine();
    engine.setMasterVolume(settings.volume);
    engine.setMusicVolume(settings.musicEnabled ? settings.volume : 0);
  }, [settings.volume, settings.musicEnabled]);

  return (
    <div className="settings-panel">
      <div className="settings-content">
        <h1 className="settings-title">Settings</h1>

        <div className="settings-group">
          <h2 className="settings-group-title">Theme</h2>
          <div className="settings-theme-cards">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                type="button"
                className={`settings-theme-card ${settings.theme === theme.id ? 'settings-theme-card-active' : ''}`}
                onClick={() => updateSetting('theme', theme.id)}
                aria-pressed={settings.theme === theme.id}
              >
                <span className={`settings-theme-preview settings-theme-preview-${theme.id}`} aria-hidden="true" />
                <span className="settings-theme-label">{theme.label}</span>
                <span className="settings-theme-desc">{theme.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">Audio</h2>

          <label className="settings-row">
            <span className="settings-label">Music Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={e => updateSetting('volume', parseFloat(e.target.value))}
              className="settings-slider"
              aria-label="Music volume"
            />
            <span className="settings-value">{Math.round(settings.volume * 100)}%</span>
          </label>

          <label className="settings-row">
            <span className="settings-label">Sound Effects</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.sfxVolume}
              onChange={e => updateSetting('sfxVolume', parseFloat(e.target.value))}
              className="settings-slider"
              aria-label="Sound effects volume"
            />
            <span className="settings-value">{Math.round(settings.sfxVolume * 100)}%</span>
          </label>

          <label className="settings-row settings-toggle-row">
            <span className="settings-label">Music</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.musicEnabled}
              className={`settings-toggle ${settings.musicEnabled ? 'active' : ''}`}
              onClick={() => updateSetting('musicEnabled', !settings.musicEnabled)}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </label>

          <label className="settings-row settings-toggle-row">
            <span className="settings-label">Sound Effects</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.sfxEnabled}
              className={`settings-toggle ${settings.sfxEnabled ? 'active' : ''}`}
              onClick={() => updateSetting('sfxEnabled', !settings.sfxEnabled)}
            >
              {settings.sfxEnabled ? 'ON' : 'OFF'}
            </button>
          </label>
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">Gameplay</h2>

          <label className="settings-row settings-toggle-row">
            <span className="settings-label">Ghost Piece</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.ghostPiece}
              className={`settings-toggle ${settings.ghostPiece ? 'active' : ''}`}
              onClick={() => updateSetting('ghostPiece', !settings.ghostPiece)}
            >
              {settings.ghostPiece ? 'ON' : 'OFF'}
            </button>
          </label>
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">Accessibility</h2>

          <label className="settings-row settings-toggle-row">
            <span className="settings-label">High Contrast</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.highContrast}
              className={`settings-toggle ${settings.highContrast ? 'active' : ''}`}
              onClick={() => updateSetting('highContrast', !settings.highContrast)}
            >
              {settings.highContrast ? 'ON' : 'OFF'}
            </button>
          </label>

          <label className="settings-row settings-toggle-row">
            <span className="settings-label">Reduced Motion</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.reducedMotion}
              className={`settings-toggle ${settings.reducedMotion ? 'active' : ''}`}
              onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
            >
              {settings.reducedMotion ? 'ON' : 'OFF'}
            </button>
          </label>
        </div>

        <button
          className="menu-btn menu-btn-back"
          onClick={() => navigate('/')}
          type="button"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
