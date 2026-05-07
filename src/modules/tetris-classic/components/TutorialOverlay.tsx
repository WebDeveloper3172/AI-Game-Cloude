/**
 * Interactive tutorial overlay shown before gameplay starts.
 * Steps through controls one by one with animated visuals.
 */
import { useState, useCallback } from 'react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

interface TutorialStep {
  keys: string[];
  label: string;
  description: string;
  icon: string;
  color: string;
}

const STEPS: TutorialStep[] = [
  {
    keys: ['\u2190', '\u2192'],
    label: 'Move',
    description: 'Move the piece left and right',
    icon: '\u2B05\uFE0F',
    color: '#00d4ff',
  },
  {
    keys: ['\u2191'],
    label: 'Rotate',
    description: 'Spin the piece to fit gaps',
    icon: '\u21BB',
    color: '#b44dff',
  },
  {
    keys: ['\u2193'],
    label: 'Soft Drop',
    description: 'Push the piece down faster',
    icon: '\u2B07\uFE0F',
    color: '#4dff4d',
  },
  {
    keys: ['Space'],
    label: 'Hard Drop',
    description: 'Instantly drop the piece down',
    icon: '\u26A1',
    color: '#ffd700',
  },
  {
    keys: ['C'],
    label: 'Hold',
    description: 'Save a piece for later',
    icon: '\u{1F4E6}',
    color: '#ff9f1a',
  },
  {
    keys: ['P'],
    label: 'Pause',
    description: 'Take a break anytime',
    icon: '\u23F8',
    color: '#ff4d4d',
  },
];

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  const nextStep = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const skipAll = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="tc-tut-overlay" role="dialog" aria-label="Game controls tutorial">
      <div className="tc-tut-card" key={step}>
        {/* Progress bar */}
        <div className="tc-tut-progress-bar">
          <div className="tc-tut-progress-fill" style={{ width: `${progress}%`, background: current.color }} />
        </div>

        {/* Step counter */}
        <div className="tc-tut-step-counter">
          {step + 1} / {STEPS.length}
        </div>

        {/* Icon */}
        <div className="tc-tut-icon" style={{ color: current.color }}>
          {current.icon}
        </div>

        {/* Label */}
        <h2 className="tc-tut-label" style={{ color: current.color }}>
          {current.label}
        </h2>

        {/* Keys */}
        <div className="tc-tut-keys">
          {current.keys.map((k, i) => (
            <kbd key={i} className="tc-tut-key" style={{ borderColor: current.color, boxShadow: `0 3px 0 ${current.color}40` }}>
              {k}
            </kbd>
          ))}
        </div>

        {/* Description */}
        <p className="tc-tut-desc">{current.description}</p>

        {/* Dots indicator */}
        <div className="tc-tut-dots">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`tc-tut-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              style={i === step ? { background: current.color } : undefined}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="tc-tut-buttons">
          <button className="tc-tut-btn-skip" onClick={skipAll} type="button">
            Skip
          </button>
          <button
            className="tc-tut-btn-next"
            onClick={nextStep}
            type="button"
            autoFocus
            style={{ background: current.color }}
          >
            {isLast ? "Let's Play!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
