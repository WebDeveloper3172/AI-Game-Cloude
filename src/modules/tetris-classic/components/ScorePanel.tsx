/**
 * Score, level, and lines display panel.
 */
import type { GameStats } from '../engine/types';

interface ScorePanelProps {
  stats: GameStats;
}

export function ScorePanel({ stats }: ScorePanelProps) {
  return (
    <div className="tc-score-panel" aria-label="Game statistics">
      <div className="tc-stat-block">
        <span className="tc-stat-label">Score</span>
        <span className="tc-stat-value" aria-live="polite">
          {stats.score.toLocaleString()}
        </span>
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
