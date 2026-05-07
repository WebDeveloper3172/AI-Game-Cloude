/**
 * On-screen mobile touch controls for the game.
 * Uses onTouchStart for instant response; onClick is blocked if touch already fired.
 */
import { useCallback, useRef } from 'react';
import type { GameAction } from '../hooks/useInput';

interface TouchControlsProps {
  onAction: (action: GameAction) => void;
}

function useTouchAction(onAction: (action: GameAction) => void, action: GameAction) {
  const touchedRef = useRef(false);

  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      touchedRef.current = true;
      onAction(action);
      // Reset after a short delay so onClick doesn't also fire
      setTimeout(() => { touchedRef.current = false; }, 300);
    },
    [onAction, action],
  );

  const handleClick = useCallback(() => {
    // Only fire if touch didn't already handle it (desktop fallback)
    if (!touchedRef.current) {
      onAction(action);
    }
  }, [onAction, action]);

  return { onTouchStart: handleTouch, onClick: handleClick };
}

export function TouchControls({ onAction }: TouchControlsProps) {
  const rotateCW = useTouchAction(onAction, 'rotateCW');
  const hardDrop = useTouchAction(onAction, 'hardDrop');
  const hold = useTouchAction(onAction, 'hold');
  const moveLeft = useTouchAction(onAction, 'moveLeft');
  const softDrop = useTouchAction(onAction, 'softDrop');
  const moveRight = useTouchAction(onAction, 'moveRight');
  const pause = useTouchAction(onAction, 'pause');

  return (
    <div className="tc-touch-controls" role="group" aria-label="Game controls">
      <div className="tc-touch-row tc-touch-row-top">
        <button
          className="tc-touch-btn tc-touch-rotate"
          onTouchStart={rotateCW.onTouchStart}
          onClick={rotateCW.onClick}
          aria-label="Rotate piece"
          type="button"
        >
          &#x21BB;
        </button>
        <button
          className="tc-touch-btn tc-touch-hard-drop"
          onTouchStart={hardDrop.onTouchStart}
          onClick={hardDrop.onClick}
          aria-label="Hard drop"
          type="button"
        >
          &#x21E9;
        </button>
        <button
          className="tc-touch-btn tc-touch-hold"
          onTouchStart={hold.onTouchStart}
          onClick={hold.onClick}
          aria-label="Hold piece"
          type="button"
        >
          HOLD
        </button>
      </div>
      <div className="tc-touch-row tc-touch-row-bottom">
        <button
          className="tc-touch-btn tc-touch-left"
          onTouchStart={moveLeft.onTouchStart}
          onClick={moveLeft.onClick}
          aria-label="Move left"
          type="button"
        >
          &#x25C0;
        </button>
        <button
          className="tc-touch-btn tc-touch-down"
          onTouchStart={softDrop.onTouchStart}
          onClick={softDrop.onClick}
          aria-label="Soft drop"
          type="button"
        >
          &#x25BC;
        </button>
        <button
          className="tc-touch-btn tc-touch-right"
          onTouchStart={moveRight.onTouchStart}
          onClick={moveRight.onClick}
          aria-label="Move right"
          type="button"
        >
          &#x25B6;
        </button>
        <button
          className="tc-touch-btn tc-touch-pause"
          onTouchStart={pause.onTouchStart}
          onClick={pause.onClick}
          aria-label="Pause game"
          type="button"
        >
          &#x23F8;
        </button>
      </div>
    </div>
  );
}
