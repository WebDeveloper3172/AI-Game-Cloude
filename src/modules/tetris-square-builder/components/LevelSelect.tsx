/** Level select screen: shows level cards within a world; stars per level. */
import { getLevelsByWorld, getWorldById } from '../engine/levels.ts';
import type { LevelProgress } from '../engine/types.ts';

interface Props {
  worldId: number;
  progress: Record<number, LevelProgress>;
  onPick: (levelId: number) => void;
  onBack: () => void;
}

export function LevelSelect({ worldId, progress, onPick, onBack }: Props) {
  const world = getWorldById(worldId);
  const levels = getLevelsByWorld(worldId);
  if (!world) return null;
  return (
    <div className="sb-screen sb-level-select">
      <div className="sb-screen-header">
        <button type="button" className="sb-back-btn" onClick={onBack} aria-label="Back to worlds">&#x2190;</button>
        <h1 className="sb-screen-title">{world.name}</h1>
        <div />
      </div>
      <div className="sb-level-grid">
        {levels.map(level => {
          const p = progress[level.id];
          const stars = p?.stars ?? 0;
          const completed = p?.completed ?? false;
          return (
            <button
              key={level.id}
              type="button"
              className={`sb-level-card ${completed ? 'sb-level-completed' : ''}`}
              onClick={() => onPick(level.id)}
              aria-label={`Level ${level.id}: ${level.name}${completed ? `, ${stars} stars` : ''}`}
            >
              <div className="sb-level-num">{level.id}</div>
              <div className="sb-level-card-name">{level.name}</div>
              <div className="sb-level-card-stars" aria-hidden="true">
                {[1, 2, 3].map(i => (
                  <span key={i} className={`sb-star-mini ${i <= stars ? 'sb-star-mini-on' : ''}`}>
                    {i <= stars ? '★' : '☆'}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
