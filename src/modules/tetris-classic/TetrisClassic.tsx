/**
 * Main Tetris Classic game component.
 * Orchestrates game engine, input, rendering, and audio.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  GameState,
  GamePhase,
  ActivePiece,
  GameStats,
} from './engine/types';
import {
  LOCK_DELAY_MS,
  CLEAR_ANIM_MS,
  NEXT_PIECES_COUNT,
  DEFAULT_SETTINGS,
} from './engine/types';
import { createGrid, checkCollision, placePiece, findFullRows, clearRows, getGhostY, isPieceOnGround } from './engine/grid';
import { getSpawnPosition } from './engine/pieces';
import { rotateCW, rotateCCW } from './engine/rotation';
import { calculateScore, calculateLevel, didLevelUp, softDropPoints, hardDropPoints, detectTSpin } from './engine/scoring';
import { getGravityInterval } from './engine/gravity';
import { createRandomizer } from './engine/randomizer';
import type { Randomizer } from './engine/randomizer';

import { GameBoard } from './components/GameBoard';
import { PiecePreview } from './components/PiecePreview';
import { HoldPiece } from './components/HoldPiece';
import { ScorePanel } from './components/ScorePanel';
import { getThemeColors } from './engine/themes';
import { ComboIndicator } from './components/ComboIndicator';
import { ScorePopup } from './components/ScorePopup';
import { TouchControls } from './components/TouchControls';
import { PauseOverlay } from './components/PauseOverlay';
import { GameOverScreen } from './components/GameOverScreen';
import { BackgroundParticles } from './components/BackgroundParticles';
import { TutorialOverlay } from './components/TutorialOverlay';

import { useGameLoop } from './hooks/useGameLoop';
import { useInput } from './hooks/useInput';
import type { GameAction } from './hooks/useInput';
import { useTetrisClassicAudio } from './hooks/useTetrisClassicAudio';
import { useHighScores, useSettings } from './hooks/useLocalStorage';
import { useAnnouncer } from '../../hooks/useAccessibility';

import './styles/TetrisClassic.css';

function createInitialStats(): GameStats {
  return {
    score: 0,
    level: 1,
    lines: 0,
    combo: -1, // -1 means no active combo; first clear sets it to 0
    maxCombo: 0,
    tetrises: 0,
    tSpins: 0,
    piecesPlaced: 0,
    startTime: Date.now(),
  };
}

function createInitialState(): GameState {
  return {
    grid: createGrid(),
    activePiece: null,
    holdPiece: null,
    holdUsed: false,
    nextPieces: [],
    stats: createInitialStats(),
    phase: 'idle',
    ghostY: 0,
    lockTimer: null,
    clearingLines: [],
    clearAnimTimer: 0,
    lastWasTSpin: false,
    lastWasMiniTSpin: false,
  };
}

export default function TetrisClassic() {
  const navigate = useNavigate();
  const [state, setState] = useState<GameState>(createInitialState);
  const [comboLabel, setComboLabel] = useState('');
  const [comboTrigger, setComboTrigger] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Feature 1: Countdown state (3, 2, 1, 0=GO, null=inactive)
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Feature 2: Score popup state
  const [scorePopup, setScorePopup] = useState<{ points: number; label: string; trigger: number }>({ points: 0, label: '', trigger: 0 });

  // Feature 3: Level-up celebration
  const [levelUpCelebration, setLevelUpCelebration] = useState<number | null>(null);
  const levelUpTimerRef = useRef<number | null>(null);

  // Hard drop trail (disabled — was causing blue column artifacts)
  const hardDropTrail = null;

  const { settings, updateSetting } = useSettings();
  const { scores, addScore } = useHighScores();
  const announce = useAnnouncer();
  const audio = useTetrisClassicAudio(settings ?? DEFAULT_SETTINGS);
  const themeColors = getThemeColors(settings.theme || 'dark');
  const highScore = scores.length > 0 ? scores[0].score : 0;

  // Inactivity hint system
  const INACTIVITY_HINT_MS = 18_000;
  const [inactivityHint, setInactivityHint] = useState<string | null>(null);
  const lastInputTime = useRef<number>(Date.now());
  const inactivityTimer = useRef<number | null>(null);

  const INACTIVITY_HINTS: string[] = [
    'Try rotating the piece with the Up arrow!',
    'You can hold a piece with C!',
    'Press Space to hard drop the piece!',
    'Use left and right arrows to move the piece!',
    'Press Down to soft drop for extra points!',
  ];
  const hintIndexRef = useRef(0);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current !== null) {
      window.clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimer.current = window.setTimeout(() => {
      const hint = INACTIVITY_HINTS[hintIndexRef.current % INACTIVITY_HINTS.length];
      hintIndexRef.current++;
      setInactivityHint(hint);
      announce(hint);
      // Store that we showed a hint (informational, hints always show on inactivity)
      try {
        localStorage.setItem('tetris-classic-inactivity-hints-shown', 'true');
      } catch { /* ignore */ }
    }, INACTIVITY_HINT_MS);
  }, [clearInactivityTimer, announce]);

  const resetInactivityTimer = useCallback(() => {
    setInactivityHint(null);
    lastInputTime.current = Date.now();
    startInactivityTimer();
  }, [startInactivityTimer]);

  // Clean up inactivity timer on unmount or phase change
  useEffect(() => {
    if (state.phase === 'playing') {
      startInactivityTimer();
    } else {
      clearInactivityTimer();
      setInactivityHint(null);
    }
    return clearInactivityTimer;
  }, [state.phase, startInactivityTimer, clearInactivityTimer]);

  // Refs for mutable game state (avoid stale closures in game loop)
  const stateRef = useRef(state);
  stateRef.current = state;
  const randomizerRef = useRef<Randomizer | null>(null);
  const gravityAccum = useRef(0);
  const lastMoveWasRotation = useRef(false);

  // ---- Spawn a new piece ----
  // NOTE: This consumes from the randomizer (side effect) so it must NOT be called
  // inside a setState updater function — React StrictMode double-invokes those,
  // which would consume pieces twice and desync the NEXT preview.
  const spawnPiece = useCallback((gs: GameState): GameState => {
    let rand = randomizerRef.current;
    if (!rand) {
      rand = createRandomizer();
      randomizerRef.current = rand;
    }

    // Consume next piece from the queue
    const type = rand.next();
    const pos = getSpawnPosition(type);
    const nextPieces = rand.peek(NEXT_PIECES_COUNT);

    // Check if spawn position is blocked -> game over
    if (checkCollision(type, 0, pos, gs.grid)) {
      return {
        ...gs,
        phase: 'gameOver',
        activePiece: null,
        nextPieces,
      };
    }

    const newPiece: ActivePiece = { type, position: pos, rotation: 0 };
    return {
      ...gs,
      activePiece: newPiece,
      nextPieces,
      holdUsed: false,
      ghostY: getGhostY(newPiece, gs.grid),
      lockTimer: null,
      lastWasTSpin: false,
      lastWasMiniTSpin: false,
    };
  }, []);

  // ---- Lock the active piece ----
  const lockPiece = useCallback((gs: GameState): GameState => {
    if (!gs.activePiece) return gs;

    // Detect T-spin before placing
    const { isTSpin, isMiniTSpin } = detectTSpin(gs.activePiece, gs.grid, lastMoveWasRotation.current);
    lastMoveWasRotation.current = false;

    // Place piece on grid
    let newGrid = placePiece(gs.activePiece, gs.grid);
    const newStats = { ...gs.stats, piecesPlaced: gs.stats.piecesPlaced + 1 };

    // Find full rows
    const fullRows = findFullRows(newGrid);

    if (fullRows.length > 0) {
      // Calculate score
      const combo = gs.stats.combo + 1;
      const maxCombo = Math.max(combo, gs.stats.maxCombo);
      const scoreEvent = {
        linesCleared: fullRows.length,
        isTSpin,
        isMiniTSpin,
        combo,
        level: gs.stats.level,
      };
      const result = calculateScore(scoreEvent);

      newStats.score += result.points;
      newStats.lines += fullRows.length;
      newStats.combo = combo;
      newStats.maxCombo = maxCombo;
      if (fullRows.length === 4) newStats.tetrises++;
      if (isTSpin || isMiniTSpin) newStats.tSpins++;

      // Level up check
      const newLevel = calculateLevel(newStats.lines);
      const leveledUp = didLevelUp(newStats.lines - fullRows.length, newStats.lines);
      newStats.level = newLevel;

      // Show combo label
      if (result.label) {
        setComboLabel(result.label);
        setComboTrigger(t => t + 1);
      }

      // Feature 2: Show score popup
      if (result.points > 0) {
        setScorePopup(prev => ({
          points: result.points,
          label: result.label,
          trigger: prev.trigger + 1,
        }));
      }

      // Audio & announcements
      if (fullRows.length === 4) {
        audio.playTetris();
        announce('Tetris! Four lines cleared!');
      } else {
        audio.playLineClear();
        announce(`${fullRows.length} line${fullRows.length > 1 ? 's' : ''} cleared!`);
      }
      if (combo >= 2) audio.playCombo();
      if (isTSpin) audio.playTSpin();
      if (leveledUp) {
        audio.playLevelUp();
        announce(`Level up! Level ${newLevel}`);
        // Feature 3: Level-up celebration
        setLevelUpCelebration(newLevel);
        if (levelUpTimerRef.current !== null) {
          window.clearTimeout(levelUpTimerRef.current);
        }
        levelUpTimerRef.current = window.setTimeout(() => {
          setLevelUpCelebration(null);
          levelUpTimerRef.current = null;
        }, 800);
      }

      // Start clear animation
      return {
        ...gs,
        grid: newGrid,
        activePiece: null,
        stats: newStats,
        clearingLines: fullRows,
        clearAnimTimer: CLEAR_ANIM_MS,
        lockTimer: null,
        lastWasTSpin: isTSpin,
        lastWasMiniTSpin: isMiniTSpin,
      };
    } else {
      // No lines cleared, reset combo
      newStats.combo = -1;
      audio.playLock();

      // Spawn next piece immediately
      return spawnPiece({
        ...gs,
        grid: newGrid,
        activePiece: null,
        stats: newStats,
        clearingLines: [],
        clearAnimTimer: 0,
        lockTimer: null,
      });
    }
  }, [audio, announce, spawnPiece]);

  // ---- Game tick (called every frame) ----
  const gameTick = useCallback((deltaMs: number) => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      let gs = { ...prev };

      // Handle clear animation
      if (gs.clearAnimTimer > 0) {
        gs.clearAnimTimer -= deltaMs;
        if (gs.clearAnimTimer <= 0) {
          gs.clearAnimTimer = 0;
          gs.grid = clearRows(gs.grid, gs.clearingLines);
          gs.clearingLines = [];
          gs = spawnPiece(gs);
        }
        return gs;
      }

      if (!gs.activePiece) return gs;

      // Gravity
      const interval = getGravityInterval(gs.stats.level);
      gravityAccum.current += deltaMs;

      if (gravityAccum.current >= interval) {
        gravityAccum.current -= interval;

        if (!isPieceOnGround(gs.activePiece, gs.grid)) {
          // Move piece down
          gs.activePiece = {
            ...gs.activePiece,
            position: {
              ...gs.activePiece.position,
              y: gs.activePiece.position.y + 1,
            },
          };
          gs.ghostY = getGhostY(gs.activePiece, gs.grid);
          gs.lockTimer = null;
        }
      }

      // Lock delay
      if (gs.activePiece && isPieceOnGround(gs.activePiece, gs.grid)) {
        if (gs.lockTimer === null) {
          gs.lockTimer = LOCK_DELAY_MS;
        } else {
          gs.lockTimer -= deltaMs;
          if (gs.lockTimer <= 0) {
            gs = lockPiece(gs);
          }
        }
      } else {
        gs.lockTimer = null;
      }

      return gs;
    });
  }, [spawnPiece, lockPiece]);

  const gameLoop = useGameLoop(gameTick);

  // ---- Cleanup audio on unmount ----
  useEffect(() => {
    return () => {
      audio.stopMusic();
    };
  }, [audio]);

  // ---- Cleanup countdown/levelup timers on unmount ----
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current);
      if (levelUpTimerRef.current !== null) window.clearTimeout(levelUpTimerRef.current);
    };
  }, []);

  // ---- Daily challenge tracking ----
  const prevLinesRef = useRef(0);
  useEffect(() => {
    const newLines = state.stats.lines;
    const diff = newLines - prevLinesRef.current;
    if (diff > 0 && state.phase !== 'idle') {
      prevLinesRef.current = newLines;
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const raw = localStorage.getItem('tetris-classic-daily');
        let daily = { date: todayStr, lines: 0 };
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.date === todayStr) daily = parsed;
        }
        daily.lines += diff;
        daily.date = todayStr;
        localStorage.setItem('tetris-classic-daily', JSON.stringify(daily));
      } catch { /* ignore */ }
    }
    // Reset tracking on new game
    if (newLines === 0) {
      prevLinesRef.current = 0;
    }
  }, [state.stats.lines, state.phase]);

  // ---- Start game (with countdown) ----
  const startGame = useCallback(() => {
    audio.initOnInteraction();

    const rand = createRandomizer();
    randomizerRef.current = rand;
    gravityAccum.current = 0;
    lastMoveWasRotation.current = false;

    // Prepare game state but don't start the loop yet
    let gs = createInitialState();
    gs.phase = 'playing';
    gs = spawnPiece(gs);
    setState(gs);
    setIsNewHighScore(false);
    setLevelUpCelebration(null);
    setScorePopup({ points: 0, label: '', trigger: 0 });

    // Start countdown sequence: 3 -> 2 -> 1 -> GO! -> play
    setCountdown(3);
    audio.playCountdownTick();

    // Clear any existing countdown timer
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
    }

    const step = (value: number) => {
      if (value > 1) {
        countdownTimerRef.current = window.setTimeout(() => {
          setCountdown(value - 1);
          audio.playCountdownTick();
          step(value - 1);
        }, 800);
      } else if (value === 1) {
        // After "1", show "GO!"
        countdownTimerRef.current = window.setTimeout(() => {
          setCountdown(0); // 0 = GO!
          audio.playCountdownGo();
          // After GO!, start the actual game
          countdownTimerRef.current = window.setTimeout(() => {
            setCountdown(null);
            gameLoop.start();
            audio.startMusic();
            announce('Game started! Use arrow keys to move and rotate pieces.');
            countdownTimerRef.current = null;
          }, 400);
        }, 800);
      }
    };

    step(3);
  }, [spawnPiece, gameLoop, announce, audio]);

  // ---- Handle actions from input ----
  const handleAction = useCallback((action: GameAction) => {
    // Reset inactivity hint timer on any player input
    resetInactivityTimer();

    setState(prev => {
      if (action === 'pause') {
        if (prev.phase === 'playing') {
          gameLoop.stop();
          audio.playPause();
          audio.pauseMusic();
          // Pause countdown if active
          if (countdownTimerRef.current !== null) {
            window.clearTimeout(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return { ...prev, phase: 'paused' as GamePhase };
        }
        if (prev.phase === 'paused') {
          // If countdown was active, restart it from current value
          if (countdown !== null) {
            const resumeCountdown = (value: number) => {
              if (value > 1) {
                countdownTimerRef.current = window.setTimeout(() => {
                  setCountdown(value - 1);
                  audio.playCountdownTick();
                  resumeCountdown(value - 1);
                }, 800);
              } else if (value === 1) {
                countdownTimerRef.current = window.setTimeout(() => {
                  setCountdown(0);
                  audio.playCountdownGo();
                  countdownTimerRef.current = window.setTimeout(() => {
                    setCountdown(null);
                    gameLoop.start();
                    audio.startMusic();
                    countdownTimerRef.current = null;
                  }, 400);
                }, 800);
              } else {
                // Was on GO!, just finish
                countdownTimerRef.current = window.setTimeout(() => {
                  setCountdown(null);
                  gameLoop.start();
                  audio.startMusic();
                  countdownTimerRef.current = null;
                }, 400);
              }
            };
            resumeCountdown(countdown);
          } else {
            gameLoop.start();
            audio.resumeMusic();
          }
          audio.playResume();
          return { ...prev, phase: 'playing' as GamePhase };
        }
        return prev;
      }

      if (prev.phase !== 'playing' || !prev.activePiece) return prev;
      if (prev.clearAnimTimer > 0) return prev;

      const piece = prev.activePiece;
      let gs = { ...prev };

      switch (action) {
        case 'moveLeft': {
          const newPos = { x: piece.position.x - 1, y: piece.position.y };
          if (!checkCollision(piece.type, piece.rotation, newPos, gs.grid)) {
            gs.activePiece = { ...piece, position: newPos };
            gs.ghostY = getGhostY(gs.activePiece, gs.grid);
            lastMoveWasRotation.current = false;
            audio.playMove();
            // Reset lock delay on movement
            if (gs.lockTimer !== null) gs.lockTimer = LOCK_DELAY_MS;
          }
          break;
        }
        case 'moveRight': {
          const newPos = { x: piece.position.x + 1, y: piece.position.y };
          if (!checkCollision(piece.type, piece.rotation, newPos, gs.grid)) {
            gs.activePiece = { ...piece, position: newPos };
            gs.ghostY = getGhostY(gs.activePiece, gs.grid);
            lastMoveWasRotation.current = false;
            if (gs.lockTimer !== null) gs.lockTimer = LOCK_DELAY_MS;
            audio.playMove();
          }
          break;
        }
        case 'softDrop': {
          const newPos = { x: piece.position.x, y: piece.position.y + 1 };
          if (!checkCollision(piece.type, piece.rotation, newPos, gs.grid)) {
            gs.activePiece = { ...piece, position: newPos };
            gs.ghostY = getGhostY(gs.activePiece, gs.grid);
            gs.stats = { ...gs.stats, score: gs.stats.score + softDropPoints(1) };
            lastMoveWasRotation.current = false;
          }
          break;
        }
        case 'hardDrop': {
          const ghostY = getGhostY(piece, gs.grid);
          const dropDist = ghostY - piece.position.y;
          // Hard drop trail visual removed (was causing blue column artifacts)
          gs.activePiece = { ...piece, position: { x: piece.position.x, y: ghostY } };
          gs.stats = { ...gs.stats, score: gs.stats.score + hardDropPoints(dropDist) };
          lastMoveWasRotation.current = false;
          audio.playHardDrop();
          gs = lockPiece(gs);
          break;
        }
        case 'rotateCW': {
          const rotated = rotateCW(piece, gs.grid);
          if (rotated) {
            gs.activePiece = rotated;
            gs.ghostY = getGhostY(rotated, gs.grid);
            lastMoveWasRotation.current = true;
            if (gs.lockTimer !== null) gs.lockTimer = LOCK_DELAY_MS;
            audio.playRotate();
          }
          break;
        }
        case 'rotateCCW': {
          const rotated = rotateCCW(piece, gs.grid);
          if (rotated) {
            gs.activePiece = rotated;
            gs.ghostY = getGhostY(rotated, gs.grid);
            lastMoveWasRotation.current = true;
            if (gs.lockTimer !== null) gs.lockTimer = LOCK_DELAY_MS;
            audio.playRotate();
          }
          break;
        }
        case 'hold': {
          if (gs.holdUsed) break;
          const currentType = piece.type;
          audio.playHold();

          if (gs.holdPiece) {
            // Swap with hold
            const spawnPos = getSpawnPosition(gs.holdPiece);
            if (!checkCollision(gs.holdPiece, 0, spawnPos, gs.grid)) {
              gs.activePiece = { type: gs.holdPiece, position: spawnPos, rotation: 0 };
              gs.holdPiece = currentType;
              gs.holdUsed = true;
              gs.ghostY = getGhostY(gs.activePiece, gs.grid);
              gs.lockTimer = null;
              lastMoveWasRotation.current = false;
            }
          } else {
            // First hold
            gs.holdPiece = currentType;
            gs.holdUsed = true;
            gs = spawnPiece({ ...gs, activePiece: null });
          }
          break;
        }
      }

      // Check for game over after lock
      if (gs.phase === 'gameOver') {
        gameLoop.stop();
        audio.stopMusic();
        audio.playGameOver();
        announce(`Game over! Score: ${gs.stats.score}`);

        // Check high score
        const isHigh = scores.length < 10 || gs.stats.score > (scores[scores.length - 1]?.score ?? 0);
        setIsNewHighScore(isHigh);
        if (isHigh) {
          audio.playHighScore();
          addScore({
            score: gs.stats.score,
            lines: gs.stats.lines,
            level: gs.stats.level,
            date: new Date().toISOString(),
          });
        }
      }

      return gs;
    });
  }, [gameLoop, audio, announce, lockPiece, spawnPiece, scores, addScore, resetInactivityTimer]);

  // ---- Input hook (disabled during countdown) ----
  useInput(
    { onAction: handleAction },
    (state.phase === 'playing' || state.phase === 'paused') && countdown === null,
  );

  // ---- Pause/Resume ----
  const handleResume = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'playing' as GamePhase }));
    audio.playResume();

    // If countdown was paused, resume it instead of game loop
    if (countdown !== null) {
      const resumeCountdown = (value: number) => {
        if (value > 1) {
          countdownTimerRef.current = window.setTimeout(() => {
            setCountdown(value - 1);
            audio.playCountdownTick();
            resumeCountdown(value - 1);
          }, 800);
        } else if (value === 1) {
          countdownTimerRef.current = window.setTimeout(() => {
            setCountdown(0);
            audio.playCountdownGo();
            countdownTimerRef.current = window.setTimeout(() => {
              setCountdown(null);
              gameLoop.start();
              audio.startMusic();
              countdownTimerRef.current = null;
            }, 400);
          }, 800);
        } else {
          countdownTimerRef.current = window.setTimeout(() => {
            setCountdown(null);
            gameLoop.start();
            audio.startMusic();
            countdownTimerRef.current = null;
          }, 400);
        }
      };
      resumeCountdown(countdown);
    } else {
      gameLoop.start();
      audio.resumeMusic();
    }
  }, [gameLoop, audio, countdown]);

  const handleQuit = useCallback(() => {
    gameLoop.stop();
    audio.stopMusic();
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    navigate('/');
  }, [gameLoop, audio, navigate]);

  const handleRetry = useCallback(() => {
    // Stop everything before restarting
    gameLoop.stop();
    audio.stopMusic();
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    startGame();
  }, [startGame, gameLoop, audio]);

  const handleMenu = useCallback(() => {
    gameLoop.stop();
    navigate('/');
  }, [gameLoop, navigate]);

  // ---- Render ----
  const clearProgress = state.clearAnimTimer > 0
    ? 1 - state.clearAnimTimer / CLEAR_ANIM_MS
    : 0;

  return (
    <div className="tc-container" data-high-contrast={settings.highContrast || undefined} data-theme={settings.theme || 'dark'}>
      <BackgroundParticles />
      {state.phase === 'idle' && (
        <div className="tc-start-screen">
          <h1 className="tc-title">Classic Tetris</h1>
          <p className="tc-subtitle">Stack blocks, clear lines, have fun!</p>
          <button
            className="tc-btn tc-btn-primary tc-btn-large tc-btn-play"
            onClick={startGame}
            type="button"
            autoFocus
          >
            Play!
          </button>
          <div className="tc-controls-help">
            <h3>Controls</h3>
            <ul>
              <li><kbd>&larr;</kbd> <kbd>&rarr;</kbd> Move</li>
              <li><kbd>&uarr;</kbd> Rotate</li>
              <li><kbd>&darr;</kbd> Soft Drop</li>
              <li><kbd>Space</kbd> Hard Drop</li>
              <li><kbd>C</kbd> Hold</li>
              <li><kbd>P</kbd> / <kbd>Esc</kbd> Pause</li>
            </ul>
          </div>
        </div>
      )}

      {(state.phase === 'playing' || state.phase === 'paused') && (
        <div className="tc-game-layout">
          <div className="tc-left-panel">
            <HoldPiece piece={state.holdPiece} used={state.holdUsed} themeColors={themeColors} />
            <ScorePanel stats={state.stats} highScore={highScore} />
          </div>

          <div className="tc-center-panel">
            <div className="tc-game-toolbar">
              <button
                className="tc-btn tc-btn-toolbar"
                onClick={() => handleAction('pause')}
                type="button"
                aria-label="Pause game"
              >
                &#x23F8; Pause
              </button>
            </div>
            <div className="tc-board-container">
              <GameBoard
                grid={state.grid}
                activePiece={state.activePiece}
                clearingLines={state.clearingLines}
                clearAnimProgress={clearProgress}
                showGhost={settings.ghostPiece}
                highContrast={settings.highContrast}
                hardDropTrail={hardDropTrail}
                isPaused={state.phase === 'paused'}
                themeColors={themeColors}
              />
              <ComboIndicator label={comboLabel} trigger={comboTrigger} />
              <ScorePopup points={scorePopup.points} label={scorePopup.label} trigger={scorePopup.trigger} />
              {countdown !== null && (
                <div className="tc-countdown-overlay" aria-live="assertive">
                  {countdown > 0 ? (
                    <span className="tc-countdown-number" key={countdown}>{countdown}</span>
                  ) : (
                    <span className="tc-countdown-go" key="go">GO!</span>
                  )}
                </div>
              )}
              {levelUpCelebration !== null && (
                <div className="tc-levelup-overlay" key={`levelup-${levelUpCelebration}`}>
                  <span className="tc-levelup-text">LEVEL {levelUpCelebration}!</span>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i / 12) * Math.PI * 2;
                    const dist = 80 + Math.random() * 60;
                    const x = Math.cos(angle) * dist;
                    const y = Math.sin(angle) * dist;
                    const colors = ['#ffd700', '#ff6b6b', '#4dff4d', '#00d4ff', '#b44dff', '#ff9f43'];
                    return (
                      <div
                        key={i}
                        className="tc-levelup-confetti"
                        style={{
                          top: '50%',
                          left: '50%',
                          backgroundColor: colors[i % colors.length],
                          animationDelay: `${i * 0.05}s`,
                          ['--confetti-x' as string]: `${x}px`,
                          ['--confetti-y' as string]: `${y}px`,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            <TouchControls onAction={handleAction} />
          </div>

          {inactivityHint && (
            <div
              className="tc-inactivity-hint"
              role="status"
              aria-live="polite"
            >
              <p className="tc-inactivity-hint-text">{inactivityHint}</p>
            </div>
          )}

          <div className="tc-right-panel">
            <PiecePreview pieces={state.nextPieces} themeColors={themeColors} />
          </div>
        </div>
      )}

      {state.phase === 'paused' && (
        <PauseOverlay
          onResume={handleResume}
          onRestart={handleRetry}
          onQuit={handleQuit}
          settings={settings}
          onUpdateSetting={updateSetting}
        />
      )}

      {state.phase === 'gameOver' && (
        <GameOverScreen
          stats={state.stats}
          onRetry={handleRetry}
          onMenu={handleMenu}
          isNewHighScore={isNewHighScore}
        />
      )}

      <TutorialOverlay />
    </div>
  );
}
