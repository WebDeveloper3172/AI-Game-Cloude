/**
 * All narration text strings for ElevenLabs TTS integration.
 * These are the sentences that will be spoken to the player during gameplay.
 */

export const NARRATION = {
  // Game start
  gameStart: 'Get ready! Your Tetris game is starting!',
  gameStartExplorer: 'Let\'s play Tetris! Match the shapes to fill rows!',

  // Piece spawned
  pieceSpawned: (piece: string) => `A ${piece} piece appeared!`,

  // Line clears
  singleClear: 'Nice! You cleared a line!',
  doubleClear: 'Double clear! Great job!',
  tripleClear: 'Triple clear! Amazing!',
  tetrisClear: 'Tetris! Four lines at once! Incredible!',

  // Combos
  combo2: 'Two in a row! Keep going!',
  combo3: 'Three combo! You\'re on fire!',
  combo4plus: (count: number) => `${count} combo! Unstoppable!`,

  // T-spins
  tSpin: 'T-Spin! That was a clever move!',
  tSpinSingle: 'T-Spin Single! Impressive technique!',
  tSpinDouble: 'T-Spin Double! Master move!',
  tSpinTriple: 'T-Spin Triple! Absolutely legendary!',

  // Level up
  levelUp: (level: number) => `Level ${level}! Things are getting faster!`,
  levelUpExplorer: (level: number) => `You reached level ${level}! You\'re doing great!`,

  // Game over
  gameOver: 'Game over! Great effort!',
  gameOverWithScore: (score: number) => `Game over! You scored ${score} points!`,
  gameOverEncouraging: 'Great job! You cleared many lines! Want to play again?',

  // High score
  newHighScore: 'New high score! Congratulations!',

  // Hints (Explorer mode)
  hintRotate: 'Try pressing the up arrow to rotate the piece!',
  hintMove: 'Use the left and right arrows to move the piece!',
  hintDrop: 'Press the down arrow to make it fall faster!',

  // Pause
  gamePaused: 'Game paused.',
  gameResumed: 'Game resumed!',
} as const;
