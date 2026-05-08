/**
 * Five-step tutorial. Shown only on first launch (gated by tutorialShown flag
 * in localStorage). Player taps Next to advance, Skip to dismiss.
 */
import { useState } from 'react';

const STEPS = [
  { title: 'Pick a piece', body: 'Tap one of the pieces at the bottom to pick it up.' },
  { title: 'Place it', body: 'Tap a cell on the square to drop the piece.' },
  { title: 'Rotate', body: 'Tap the same piece twice to rotate it.' },
  { title: 'Undo', body: 'Made a mistake? Press Undo. As many times as you need.' },
  { title: 'Fill it up!', body: 'Fill every cell to win. The timer is just a guide.' },
] as const;

interface Props {
  onClose: () => void;
}

export function TutorialOverlay({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;
  return (
    <div className="sb-tutorial" role="dialog" aria-modal="true" aria-labelledby="sb-tutorial-title">
      <div className="sb-tutorial-card">
        <h2 id="sb-tutorial-title" className="sb-tutorial-title">{cur.title}</h2>
        <p className="sb-tutorial-body">{cur.body}</p>
        <div className="sb-tutorial-progress" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={`sb-dot ${i === step ? 'sb-dot-on' : ''}`} />
          ))}
        </div>
        <div className="sb-tutorial-buttons">
          <button type="button" className="sb-btn sb-btn-secondary" onClick={onClose}>Skip</button>
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            onClick={() => (isLast ? onClose() : setStep(s => s + 1))}
            autoFocus
          >
            {isLast ? 'Let’s go!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
