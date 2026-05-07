/**
 * Game over screen with results, XP display, achievements, retry and menu buttons.
 */
import type { GameStats } from '../engine/types';

interface GameOverScreenProps {
  stats: GameStats;
  onRetry: () => void;
  onMenu: () => void;
  isNewHighScore: boolean;
}

/** Pick an encouraging message based on performance */
function getEncouragementMessage(stats: GameStats, isNewHighScore: boolean): string {
  if (isNewHighScore) return 'Incredible! New high score!';
  if (stats.score >= 10000) return 'Amazing score! You are a Tetris legend!';
  if (stats.score >= 5000) return 'Awesome job! That was seriously impressive!';
  if (stats.lines >= 20) return 'Great run! You cleared tons of lines!';
  if (stats.level >= 5) return 'Wow, you reached a high level! Well done!';
  if (stats.score >= 1000) return 'Great job! Keep it up!';
  return 'Nice try! You will do even better next time!';
}

interface Achievement {
  icon: string;
  label: string;
}

/** Check game stats and return earned achievements for this session */
function getAchievements(stats: GameStats, isNewHighScore: boolean): Achievement[] {
  const achievements: Achievement[] = [];

  // Always award first-game badge if they placed at least one piece
  if (stats.piecesPlaced > 0) {
    achievements.push({ icon: '\u{1F3AE}', label: 'First Game!' });
  }

  if (isNewHighScore) {
    achievements.push({ icon: '\u{1F3C6}', label: 'New High Score!' });
  }

  if (stats.lines >= 10) {
    achievements.push({ icon: '\u{2B50}', label: 'Cleared 10 Lines!' });
  }

  if (stats.lines >= 40) {
    achievements.push({ icon: '\u{1F525}', label: 'Line Machine! (40+ lines)' });
  }

  if (stats.tetrises >= 1) {
    achievements.push({ icon: '\u{1F4A5}', label: 'First Tetris!' });
  }

  if (stats.tetrises >= 5) {
    achievements.push({ icon: '\u{1F31F}', label: 'Tetris Master! (5+ Tetrises)' });
  }

  if (stats.maxCombo >= 3) {
    achievements.push({ icon: '\u{1F525}', label: 'Combo Master! (3x combo)' });
  }

  if (stats.maxCombo >= 5) {
    achievements.push({ icon: '\u{26A1}', label: 'Unstoppable! (5x combo)' });
  }

  if (stats.level >= 5) {
    achievements.push({ icon: '\u{1F680}', label: 'Speed Demon! (Level 5+)' });
  }

  if (stats.tSpins >= 1) {
    achievements.push({ icon: '\u{1F300}', label: 'T-Spin Pro!' });
  }

  // Return at most 3 achievements, prioritizing the rarest (later ones)
  return achievements.slice(-3);
}

export function GameOverScreen({ stats, onRetry, onMenu, isNewHighScore }: GameOverScreenProps) {
  const duration = Math.floor((Date.now() - stats.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const encouragement = getEncouragementMessage(stats, isNewHighScore);
  const achievements = getAchievements(stats, isNewHighScore);

  return (
    <div className="tc-gameover-overlay" role="dialog" aria-label="Game over">
      <div className="tc-gameover-content">
        <h2 className="tc-gameover-title">
          {isNewHighScore ? 'New High Score!' : 'Game Over!'}
        </h2>

        {isNewHighScore && <div className="tc-gameover-crown">&#x1F3C6;</div>}

        <p className="tc-gameover-encouragement">
          {encouragement}
        </p>

        <div className="tc-gameover-stats">
          <div className="tc-gameover-stat">
            <span className="tc-gameover-stat-label">Score</span>
            <span className="tc-gameover-stat-value">{stats.score.toLocaleString()}</span>
          </div>
          <div className="tc-gameover-stat">
            <span className="tc-gameover-stat-label">Level</span>
            <span className="tc-gameover-stat-value">{stats.level}</span>
          </div>
          <div className="tc-gameover-stat">
            <span className="tc-gameover-stat-label">Lines</span>
            <span className="tc-gameover-stat-value">{stats.lines}</span>
          </div>
          <div className="tc-gameover-stat">
            <span className="tc-gameover-stat-label">Tetrises</span>
            <span className="tc-gameover-stat-value">{stats.tetrises}</span>
          </div>
          <div className="tc-gameover-stat">
            <span className="tc-gameover-stat-label">Max Combo</span>
            <span className="tc-gameover-stat-value">{stats.maxCombo}x</span>
          </div>
          <div className="tc-gameover-stat">
            <span className="tc-gameover-stat-label">Time</span>
            <span className="tc-gameover-stat-value">{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <div className="tc-gameover-stat">
            <span className="tc-gameover-stat-label">Pieces</span>
            <span className="tc-gameover-stat-value">{stats.piecesPlaced}</span>
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="tc-achievements" role="list" aria-label="Achievements earned">
            {achievements.map((a) => (
              <div className="tc-achievement" role="listitem" key={a.label}>
                <span className="tc-achievement-icon" aria-hidden="true">{a.icon}</span>
                <span className="tc-achievement-text">{a.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="tc-gameover-xp">
          <span className="tc-xp-label">XP Earned</span>
          <span className="tc-xp-value">+{Math.floor(stats.score / 10)}</span>
        </div>

        <div className="tc-gameover-buttons">
          <button
            className="tc-btn tc-btn-primary tc-btn-large tc-btn-play-again"
            onClick={onRetry}
            type="button"
            autoFocus
          >
            Play Again
          </button>
          <button
            className="tc-btn tc-btn-secondary"
            onClick={onMenu}
            type="button"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
