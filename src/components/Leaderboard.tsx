/**
 * Leaderboard screen showing top 10 high scores from localStorage.
 */
import { useNavigate } from 'react-router-dom';
import { useHighScores } from '../modules/tetris-classic/hooks/useLocalStorage';

export function Leaderboard() {
  const navigate = useNavigate();
  const { scores } = useHighScores();

  // Determine the most recent score entry (by date) to highlight it
  const mostRecentDate = scores.length > 0
    ? scores.reduce((latest, entry) => (entry.date > latest ? entry.date : latest), scores[0].date)
    : null;

  // Only highlight the first occurrence of the most recent date
  let highlightedIndex = -1;
  if (mostRecentDate) {
    highlightedIndex = scores.findIndex(entry => entry.date === mostRecentDate);
  }

  function getRankClass(rank: number): string {
    if (rank === 1) return 'leaderboard-rank leaderboard-rank-1';
    if (rank === 2) return 'leaderboard-rank leaderboard-rank-2';
    if (rank === 3) return 'leaderboard-rank leaderboard-rank-3';
    return 'leaderboard-rank';
  }

  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="leaderboard-panel">
      <div className="leaderboard-content">
        <h1 className="leaderboard-title">Leaderboard</h1>

        {scores.length === 0 ? (
          <div className="leaderboard-empty">
            <p>No scores yet -- play a game!</p>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr className="leaderboard-header-row">
                <th className="leaderboard-th">Rank</th>
                <th className="leaderboard-th">Score</th>
                <th className="leaderboard-th">Lines</th>
                <th className="leaderboard-th">Level</th>
                <th className="leaderboard-th">Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((entry, index) => (
                <tr
                  key={`${entry.date}-${index}`}
                  className={`leaderboard-row ${index === highlightedIndex ? 'leaderboard-row-recent' : ''}`}
                >
                  <td className={getRankClass(index + 1)}>#{index + 1}</td>
                  <td className="leaderboard-cell leaderboard-score">{entry.score.toLocaleString()}</td>
                  <td className="leaderboard-cell">{entry.lines}</td>
                  <td className="leaderboard-cell">{entry.level}</td>
                  <td className="leaderboard-cell leaderboard-date">{formatDate(entry.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button
          className="menu-btn menu-btn-back"
          onClick={() => navigate('/')}
          type="button"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
