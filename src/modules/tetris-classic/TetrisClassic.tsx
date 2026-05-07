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
  GRID_COLS,
  GRID_ROWS,
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
import { ComboIndicator } from './components/ComboIndicator';
import { TouchControls } from './components/TouchControls';
import { PauseOverlay } from './components/PauseOverlay';
import { GameOverScreen } from './components/GameOverScreen';

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

  const { settings } = useSettings();
  const { scores, addScore } = useHighScores();
  const announce = useAnnouncer();
  const audio = useTetrisClassicAudio(settings ?? DEFAULT_SETTINGS);

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
  const spawnPiece = useCallback((gs: GameState): GameState => {
    let rand = randomizerRef.current;
    if (!rand) {
      rand = createRandomizer();
      randomizerRef.current = rand;
    }

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

  // ---- Start game ----
  const startGame = useCallback(() => {
    const rand = createRandomizer();
    randomizerRef.current = rand;
    gravityAccum.current = 0;
    lastMoveWasRotation.current = false;

    let gs = createInitialState();
    gs.phase = 'playing';
    gs = spawnPiece(gs);
    setState(gs);
    setIsNewHighScore(false);
    gameLoop.start();
    announce('Game started! Use arrow keys to move and rotate pieces.');
  }, [spawnPiece, gameLoop, announce]);

  // ---- Handle actions from input ----
  const handleAction = useCallback((action: GameAction) => {
    // Reset inactivity hint timer on any player input
    resetInactivityTimer();

    setState(prev => {
      if (action === 'pause') {
        if (prev.phase === 'playing') {
          gameLoop.stop();
          audio.playPause();
          return { ...prev, phase: 'paused' as GamePhase };
        }
        if (prev.phase === 'paused') {
          gameLoop.start();
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
        audio.playGameOver();
        announce(`Game over! Score: ${gs.stats.score}`);

        // Check high score
        const isHigh = scores.length < 10 || gs.stats.score > (scores[scores.length - 1]?.score ?? 0);
        setIsNewHighScore(isHigh);
        if (isHigh) {
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

  // ---- Input hook ----
  useInput(
    { onAction: handleAction },
    state.phase === 'playing' || state.phase === 'paused',
  );

  // ---- Pause/Resume ----
  const handleResume = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'playing' as GamePhase }));
    gameLoop.start();
  }, [gameLoop]);

  const handleQuit = useCallback(() => {
    gameLoop.stop();
    navigate('/');
  }, [gameLoop, navigate]);

  const handleRetry = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleMenu = useCallback(() => {
    gameLoop.stop();
    navigate('/');
  }, [gameLoop, navigate]);

  // ---- Render ----
  const clearProgress = state.clearAnimTimer > 0
    ? 1 - state.clearAnimTimer / CLEAR_ANIM_MS
    : 0;

  return (
    <div className="tc-container" data-high-contrast={settings.highContrast || undefined}>
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
            <HoldPiece piece={state.holdPiece} used={state.holdUsed} />
            <ScorePanel stats={state.stats} />
          </div>

          <div className="tc-center-panel">
            <div className="tc-board-container">
              <GameBoard
                grid={state.grid}
                activePiece={state.activePiece}
                ghostY={state.ghostY}
                clearingLines={state.clearingLines}
                clearAnimProgress={clearProgress}
                showGhost={settings.ghostPiece}
                highContrast={settings.highContrast}
              />
              <ComboIndicator label={comboLabel} trigger={comboTrigger} />
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
            <PiecePreview pieces={state.nextPieces} />
          </div>
        </div>
      )}

      {state.phase === 'paused' && (
        <PauseOverlay onResume={handleResume} onQuit={handleQuit} />
      )}

      {state.phase === 'gameOver' && (
        <GameOverScreen
          stats={state.stats}
          onRetry={handleRetry}
          onMenu={handleMenu}
          isNewHighScore={isNewHighScore}
        />
      )}
    </div>
  );
}
