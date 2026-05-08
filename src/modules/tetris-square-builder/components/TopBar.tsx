/** Header for the play screen: timer, undo, hint, pause. */
interface Props {
  levelName: string;
  timeRemainingMs: number;
  totalTimeMs: number;
  undosUsed: number;
  onUndo: () => void;
  onHint: () => void;
  onPause: () => void;
  canUndo: boolean;
}

function formatTime(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TopBar({ levelName, timeRemainingMs, totalTimeMs, undosUsed, onUndo, onHint, onPause, canUndo }: Props) {
  const pct = totalTimeMs > 0 ? Math.max(0, Math.min(100, (timeRemainingMs / totalTimeMs) * 100)) : 0;
  const low = timeRemainingMs <= 15000;
  return (
    <div className="sb-topbar" role="region" aria-label="Game controls">
      <button type="button" className="sb-topbar-btn sb-pause-btn" onClick={onPause} aria-label="Pause">
        &#x23F8;
      </button>
      <div className="sb-topbar-center">
        <div className="sb-level-name">{levelName}</div>
        <div className="sb-timer-bar">
          <div
            className={`sb-timer-fill ${low ? 'sb-timer-fill-low' : ''}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-label={`Time remaining: ${formatTime(timeRemainingMs)}`}
          />
        </div>
        <div className="sb-timer-text" aria-hidden="true">{formatTime(timeRemainingMs)}</div>
      </div>
      <div className="sb-topbar-right">
        <button
          type="button"
          className="sb-topbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={`Undo, used ${undosUsed} times`}
        >
          &#x21B6;
        </button>
        <button type="button" className="sb-topbar-btn" onClick={onHint} aria-label="Hint, costs 10 seconds">
          &#x1F4A1;
        </button>
      </div>
    </div>
  );
}
