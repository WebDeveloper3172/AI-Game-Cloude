/**
 * Floating combo/clear text animation with enhanced combo counter visual.
 */
import { useEffect, useState, useMemo } from 'react';

interface ComboIndicatorProps {
  label: string;
  /** Increment this to trigger a new animation */
  trigger: number;
  /** Current combo count for enhanced visual display */
  comboCount?: number;
}

/** Determine color based on combo level */
function getComboColor(count: number): string {
  if (count <= 2) return '#ffffff';
  if (count === 3) return '#00ff88';
  if (count === 4) return '#00e5ff';
  if (count === 5) return '#ffd700';
  // 6+ rainbow gradient
  return 'rainbow';
}

/** Determine scale class based on combo level */
function getComboSizeClass(count: number): string {
  if (count <= 2) return 'tc-combo-size-normal';
  if (count <= 4) return 'tc-combo-size-large';
  if (count <= 7) return 'tc-combo-size-xlarge';
  return 'tc-combo-size-huge';
}

export function ComboIndicator({ label, trigger, comboCount = 0 }: ComboIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const [displayLabel, setDisplayLabel] = useState('');
  const [displayCombo, setDisplayCombo] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (trigger === 0 || !label) return;
    setDisplayLabel(label);
    setDisplayCombo(comboCount);
    setVisible(true);
    setPulseKey(prev => prev + 1);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [trigger, label, comboCount]);

  const comboColor = useMemo(() => getComboColor(displayCombo), [displayCombo]);
  const sizeClass = useMemo(() => getComboSizeClass(displayCombo), [displayCombo]);
  const isRainbow = comboColor === 'rainbow';

  if (!visible) return null;

  const comboNumberStyle: React.CSSProperties = isRainbow
    ? {
        background: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #8800ff, #ff00ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : { color: comboColor };

  return (
    <div className="tc-combo-indicator" aria-live="assertive" role="alert">
      {displayCombo >= 2 && (
        <span
          key={pulseKey}
          className={`tc-combo-number ${sizeClass} tc-combo-pulse`}
          style={comboNumberStyle}
        >
          x{displayCombo}
        </span>
      )}
      <span className="tc-combo-text">{displayLabel}</span>
    </div>
  );
}
