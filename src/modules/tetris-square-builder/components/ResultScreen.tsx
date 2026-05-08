/** Result screen: stars, retry, next, back. Confetti on 3-star wins. */
interface Props {
  outcome: 'complete' | 'timeup';
  stars: number;
  levelName: string;
  hasNext: boolean;
  onRetry: () => void;
  onNext: () => void;
  onMenu: () => void;
}

const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7', '#ec4899'];
const CONFETTI_COUNT = 32;

export function ResultScreen({ outcome, stars, levelName, hasNext, onRetry, onNext, onMenu }: Props) {
  const showConfetti = outcome === 'complete' && stars >= 3;
  return (
    <div className="sb-result" role="dialog" aria-modal="true" aria-labelledby="sb-result-title">
      {showConfetti && (
        <div className="sb-confetti" aria-hidden="true">
          {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
            <span
              key={i}
              className="sb-confetti-piece"
              style={{
                left: `${(i * 100) / CONFETTI_COUNT}%`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 8) * 0.08}s`,
                animationDuration: `${1.4 + (i % 5) * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}
      <div className="sb-result-card">
        <h2 id="sb-result-title" className="sb-result-title">
          {outcome === 'complete' ? 'Square Complete!' : 'Time’s up!'}
        </h2>
        <div className="sb-result-level">{levelName}</div>
        {outcome === 'complete' && (
          <div className="sb-stars" aria-label={`${stars} of 3 stars`}>
            {[1, 2, 3].map(i => (
              <span key={i} className={`sb-star ${i <= stars ? 'sb-star-on' : 'sb-star-off'}`}>
                {i <= stars ? '★' : '☆'}
              </span>
            ))}
          </div>
        )}
        {outcome === 'timeup' && (
          <p className="sb-result-message">No worries — you learned something. Try again?</p>
        )}
        <div className="sb-result-buttons">
          <button type="button" className="sb-btn sb-btn-secondary" onClick={onMenu}>Menu</button>
          <button type="button" className="sb-btn sb-btn-secondary" onClick={onRetry}>Retry</button>
          {outcome === 'complete' && hasNext && (
            <button type="button" className="sb-btn sb-btn-primary" onClick={onNext} autoFocus>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
