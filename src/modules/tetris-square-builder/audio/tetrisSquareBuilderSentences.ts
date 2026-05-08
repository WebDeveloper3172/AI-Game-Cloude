/**
 * Narration text for Square Builder.
 * Used by the audio hook to drive ARIA captions and (when wired) ElevenLabs TTS.
 * Keys are stable; sentences may evolve.
 */
export const NARRATION = {
  // Welcome / first time
  welcomeFirstTime: 'Welcome, builder! Let\'s fill the window.',
  welcomeReturning: 'Welcome back!',

  // Tutorial cues (only shown on first level)
  tutorialPickPiece: 'Tap a piece at the bottom to pick it up.',
  tutorialPlace: 'Drag the piece into the square to place it.',
  tutorialRotate: 'Tap a piece twice to rotate it.',
  tutorialUndo: 'Press Undo if you change your mind.',
  tutorialComplete: 'Fill every cell to finish the square!',

  // Encouragement during play
  encouragementHalfway: 'Halfway there!',
  encouragementAlmostDone: 'Almost done — one more piece!',
  encouragementGoodPlace: 'Nice fit!',

  // Hints
  hintInactivity: 'Try a piece in the corner.',
  hintCornersFirst: 'Try the corners first.',
  hintRotate: 'Try rotating a piece.',
  hintLeftover: 'Not every piece needs to fit — pick the best four.',

  // Time warnings
  timeLow: 'A little time left — keep going!',
  timeUp: 'Time\'s up. Want to try again?',

  // Completion
  completePerfect: 'Perfect! Three stars!',
  completeGreat: 'Great job!',
  completeGood: 'Square complete!',

  // Retry
  retryWelcome: 'Let\'s try again!',
  retryEncouragement: 'You learned something — go for it!',
} as const;

export type NarrationKey = keyof typeof NARRATION;
