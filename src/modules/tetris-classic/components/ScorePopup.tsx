/**
 * Floating score popup that appears on line clears.
 * Shows points earned with color based on clear type.
 */
import { useEffect, useState } from 'react';

interface ScorePopupProps {
  points: number;
  label: string;
  /** Increment to trigger a new popup animation */
  trigger: number;
}

function getPopupColor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('t-spin') || l.includes('t spin')) return '#b44dff';
  if (l.includes('tetris')) return '#ffd700';
  if (l.includes('triple')) return '#00d4ff';
  if (l.includes('double')) return '#4dff4d';
  return '#ffffff';
}

export function ScorePopup({ points, label, trigger }: ScorePopupProps) {
  const [visible, setVisible] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [displayLabel, setDisplayLabel] = useState('');
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    if (trigger === 0 || points === 0) return;
    setDisplayPoints(points);
    setDisplayLabel(label);
    setColor(getPopupColor(label));
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [trigger, points, label]);

  if (!visible) return null;

  return (
    <div className="tc-score-popup" style={{ color }}>
      <div className="tc-score-popup-label">{displayLabel}</div>
      <div className="tc-score-popup-points">+{displayPoints.toLocaleString()}</div>
    </div>
  );
}
