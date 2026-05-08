/** Pause overlay: resume, restart, menu. */
interface Props {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export function PauseOverlay({ onResume, onRestart, onMenu }: Props) {
  return (
    <div className="sb-pause" role="dialog" aria-modal="true" aria-labelledby="sb-pause-title">
      <div className="sb-pause-card">
        <h2 id="sb-pause-title" className="sb-pause-title">Paused</h2>
        <div className="sb-pause-buttons">
          <button type="button" className="sb-btn sb-btn-primary" onClick={onResume} autoFocus>Resume</button>
          <button type="button" className="sb-btn sb-btn-secondary" onClick={onRestart}>Restart</button>
          <button type="button" className="sb-btn sb-btn-secondary" onClick={onMenu}>Menu</button>
        </div>
      </div>
    </div>
  );
}
