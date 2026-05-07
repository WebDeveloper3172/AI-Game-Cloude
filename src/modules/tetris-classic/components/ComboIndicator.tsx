/**
 * Floating combo/clear text animation.
 */
import { useEffect, useState } from 'react';

interface ComboIndicatorProps {
  label: string;
  /** Increment this to trigger a new animation */
  trigger: number;
}

export function ComboIndicator({ label, trigger }: ComboIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const [displayLabel, setDisplayLabel] = useState('');

  useEffect(() => {
    if (trigger === 0 || !label) return;
    setDisplayLabel(label);
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [trigger, label]);

  if (!visible) return null;

  return (
    <div className="tc-combo-indicator" aria-live="assertive" role="alert">
      <span className="tc-combo-text">{displayLabel}</span>
    </div>
  );
}
