/**
 * Pause menu overlay with focus trap.
 */
import { useEffect, useRef } from 'react';

interface PauseOverlayProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ onResume, onQuit }: PauseOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

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
            onClick={onQuit}
            type="button"
          >
            Quit to Menu
          </button>
        </div>
        <p className="tc-pause-hint">Press Escape or P to resume</p>
      </div>
    </div>
  );
}
