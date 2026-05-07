/**
 * Main menu with game logo, play button, and settings.
 */
import { useNavigate } from 'react-router-dom';

export function MainMenu() {
  const navigate = useNavigate();

  return (
    <div className="main-menu">
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

        <div className="main-menu-buttons">
          <button
            className="menu-btn menu-btn-play"
            onClick={() => navigate('/tetris-classic')}
            type="button"
            autoFocus
          >
            <span className="menu-btn-icon">&#x25B6;</span>
            Play Classic Tetris
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

        <div className="main-menu-footer">
          <p>Use arrow keys to play. Have fun!</p>
        </div>
      </div>
    </div>
  );
}
