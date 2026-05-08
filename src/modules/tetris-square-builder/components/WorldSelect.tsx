/** World select screen: 3 worlds shown; locked worlds dimmed. */
import { WORLDS } from '../engine/levels.ts';

interface Props {
  unlockedIds: number[];
  totalStars: number;
  onPick: (worldId: number) => void;
  onBack: () => void;
}

export function WorldSelect({ unlockedIds, totalStars, onPick, onBack }: Props) {
  return (
    <div className="sb-screen sb-world-select">
      <div className="sb-screen-header">
        <button type="button" className="sb-back-btn" onClick={onBack} aria-label="Back to main menu">&#x2190;</button>
        <h1 className="sb-screen-title">Pick a World</h1>
        <div className="sb-stars-count" aria-label={`${totalStars} total stars`}>★ {totalStars}</div>
      </div>
      <div className="sb-world-grid">
        {WORLDS.map(w => {
          const unlocked = unlockedIds.includes(w.id);
          return (
            <button
              key={w.id}
              type="button"
              className={`sb-world-card sb-world-${w.themeKey} ${unlocked ? '' : 'sb-world-locked'}`}
              onClick={() => unlocked && onPick(w.id)}
              disabled={!unlocked}
              aria-label={`World ${w.id}: ${w.name}${unlocked ? '' : `, locked, needs ${w.unlockRequirement.minStars} stars`}`}
            >
              <div className="sb-world-card-title">{w.name}</div>
              <div className="sb-world-card-desc">{w.description}</div>
              {!unlocked && (
                <div className="sb-world-card-lock">
                  &#x1F512; {w.unlockRequirement.minStars} stars
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
