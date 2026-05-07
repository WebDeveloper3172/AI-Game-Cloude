/**
 * On-screen mobile touch controls for the game.
 * Uses onTouchStart for instant mobile response with onClick fallback for desktop.
 */
import { useCallback } from 'react';
import type { GameAction } from '../hooks/useInput';

interface TouchControlsProps {
  onAction: (action: GameAction) => void;
}

function useTouchAction(onAction: (action: GameAction) => void, action: GameAction) {
  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onAction(action);
    },
    [onAction, action],
  );
  const handleClick = useCallback(() => {
    onAction(action);
  }, [onAction, action]);

  return { onTouchStart: handleTouch, onClick: handleClick };
}

export function TouchControls({ onAction }: TouchControlsProps) {
  const rotateCCW = useTouchAction(onAction, 'rotateCCW');
  const rotateCW = useTouchAction(onAction, 'rotateCW');
  const hardDrop = useTouchAction(onAction, 'hardDrop');
  const hold = useTouchAction(onAction, 'hold');
  const moveLeft = useTouchAction(onAction, 'moveLeft');
  const softDrop = useTouchAction(onAction, 'softDrop');
  const moveRight = useTouchAction(onAction, 'moveRight');

  return (
    <div className="tc-touch-controls" role="group" aria-label="Game controls">
      <div className="tc-touch-row tc-touch-row-top">
        <button
          className="tc-touch-btn tc-touch-rotate-ccw"
          onTouchStart={rotateCCW.onTouchStart}
          onClick={rotateCCW.onClick}
          aria-label="Rotate piece counter-clockwise"
          type="button"
        >
          &#x21BA;
        </button>
        <button
          className="tc-touch-btn tc-touch-rotate"
          onTouchStart={rotateCW.onTouchStart}
          onClick={rotateCW.onClick}
          aria-label="Rotate piece clockwise"
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
      </div>
    </div>
  );
}
