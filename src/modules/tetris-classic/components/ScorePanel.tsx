/**
 * Score, level, and lines display panel with personal best indicator.
 */
import { useEffect, useRef, useState } from 'react';
import type { GameStats } from '../engine/types';

interface ScorePanelProps {
  stats: GameStats;
  /** Personal best high score. Defaults to 0 if not provided. */
  highScore?: number;
}

export function ScorePanel({ stats, highScore = 0 }: ScorePanelProps) {
  const [isNewBest, setIsNewBest] = useState(false);
  const prevExceededRef = useRef(false);

  useEffect(() => {
    if (highScore > 0 && stats.score > highScore && !prevExceededRef.current) {
      prevExceededRef.current = true;
      setIsNewBest(true);
    }
    // Reset when score goes back to 0 (new game)
    if (stats.score === 0) {
      prevExceededRef.current = false;
      setIsNewBest(false);
    }
  }, [stats.score, highScore]);

  return (
    <div className="tc-score-panel" aria-label="Game statistics">
      <div className="tc-stat-block">
        <span className="tc-stat-label">Score</span>
        <span className="tc-stat-value" aria-live="polite">
          {stats.score.toLocaleString()}
        </span>
        {isNewBest ? (
          <span className="tc-personal-best tc-new-best">NEW BEST!</span>
        ) : (
          highScore > 0 && (
            <span className="tc-personal-best">BEST: {highScore.toLocaleString()}</span>
          )
        )}
      </div>
      <div className="tc-stat-block">
        <span className="tc-stat-label">Level</span>
        <span className="tc-stat-value">{stats.level}</span>
      </div>
      <div className="tc-stat-block">
        <span className="tc-stat-label">Lines</span>
        <span className="tc-stat-value">{stats.lines}</span>
      </div>
      <div className="tc-stat-block">
        <span className="tc-stat-label">Combo</span>
        <span className="tc-stat-value">{stats.combo > 0 ? `${stats.combo}x` : '-'}</span>
      </div>
    </div>
  );
}
