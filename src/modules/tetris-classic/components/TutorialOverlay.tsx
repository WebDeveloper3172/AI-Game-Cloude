/**
 * Tutorial overlay shown on first play.
 * Displays control instructions and dismisses permanently via localStorage.
 *
 * Integration: Import and render this component inside TetrisClassic.tsx
 * when the game phase is 'playing'. It manages its own visibility via localStorage.
 */
import { useState, useCallback } from 'react';

const TUTORIAL_KEY = 'tetris-classic-tutorial-shown';

function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === 'true';
  } catch {
    return false;
  }
}

function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, 'true');
  } catch {
    // localStorage unavailable
  }
}

export function TutorialOverlay() {
  const [visible, setVisible] = useState(() => !hasSeenTutorial());

  const dismiss = useCallback(() => {
    markTutorialSeen();
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="tc-tutorial-overlay" role="dialog" aria-label="Game controls tutorial">
      <div className="tc-tutorial-content">
        <h2 className="tc-tutorial-title">Controls</h2>

        <div className="tc-tutorial-controls">
          <div className="tc-tutorial-row">
            <kbd className="tc-tutorial-key tc-tutorial-key-arrow">
              <span className="tc-tutorial-arrow-left">&larr;</span>
              <span className="tc-tutorial-arrow-right">&rarr;</span>
            </kbd>
            <span className="tc-tutorial-desc">Move Left / Right</span>
          </div>

          <div className="tc-tutorial-row">
            <kbd className="tc-tutorial-key">&uarr;</kbd>
            <span className="tc-tutorial-desc">Rotate</span>
          </div>

          <div className="tc-tutorial-row">
            <kbd className="tc-tutorial-key">&darr;</kbd>
            <span className="tc-tutorial-desc">Soft Drop</span>
          </div>

          <div className="tc-tutorial-row">
            <kbd className="tc-tutorial-key tc-tutorial-key-wide">Space</kbd>
            <span className="tc-tutorial-desc">Hard Drop</span>
          </div>

          <div className="tc-tutorial-row">
            <kbd className="tc-tutorial-key">C</kbd>
            <span className="tc-tutorial-desc">Hold Piece</span>
          </div>

          <div className="tc-tutorial-row">
            <kbd className="tc-tutorial-key">P</kbd>
            <span className="tc-tutorial-desc">Pause</span>
          </div>
        </div>

        <button
          className="tc-btn tc-btn-primary tc-tutorial-dismiss"
          onClick={dismiss}
          type="button"
          autoFocus
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
