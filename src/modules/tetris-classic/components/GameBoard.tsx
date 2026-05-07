/**
 * 10x20 game board renderer using HTML Canvas for performance.
 * Draws grid lines, placed blocks, active piece, ghost piece.
 * Includes line clear animation with particle effects and ARIA mirror div.
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import type { Grid, ActivePiece, Cell } from '../engine/types';
import { GRID_COLS, GRID_ROWS } from '../engine/types';
import { PIECE_DEFINITIONS, getPieceCells } from '../engine/pieces';
import { getGhostCells } from './GhostPiece';

interface GameBoardProps {
  grid: Grid;
  activePiece: ActivePiece | null;

  clearingLines: number[];
  clearAnimProgress: number; // 0..1
  showGhost: boolean;
  highContrast: boolean;
}

const CELL_SIZE = 30;
const BOARD_WIDTH = GRID_COLS * CELL_SIZE;
const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;
const MAX_PARTICLES = 50;

// ---- Particle system ----
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number; // 0..1, starts at 1, fades to 0
  size: number;
}

function spawnParticles(
  clearingLines: number[],
  grid: Grid,
): Particle[] {
  const particles: Particle[] = [];
  const count = clearingLines.length;
  // Fewer particles for single, more for Tetris
  const particlesPerLine = count >= 4 ? 12 : count >= 2 ? 6 : 4;
  const totalBudget = Math.min(MAX_PARTICLES, count * particlesPerLine);

  for (const row of clearingLines) {
    const perThisLine = Math.floor(totalBudget / count);
    for (let i = 0; i < perThisLine; i++) {
      // Pick a random column that has a block
      const col = Math.floor(Math.random() * GRID_COLS);
      const cell: Cell = grid[row]?.[col] ?? null;
      const color = cell ? PIECE_DEFINITIONS[cell].color : '#ffffff';

      const cx = col * CELL_SIZE + CELL_SIZE / 2;
      const cy = row * CELL_SIZE + CELL_SIZE / 2;

      // Velocity: outward burst, stronger for Tetris
      const speed = count >= 4 ? 4 + Math.random() * 4 : 2 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;

      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // slight upward bias
        color,
        life: 1,
        size: 2 + Math.random() * 3,
      });
    }
  }

  return particles;
}

function updateParticles(particles: Particle[], dt: number): Particle[] {
  const decay = dt * 1.5; // fade over ~0.67s
  const result: Particle[] = [];
  for (const p of particles) {
    const life = p.life - decay;
    if (life <= 0) continue;
    result.push({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15, // gravity
      life,
    });
  }
  return result;
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

/** Pattern overlays for colorblind accessibility */
function drawPattern(
  ctx: CanvasRenderingContext2D,
  pattern: string,
  x: number,
  y: number,
  size: number,
) {
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;

  switch (pattern) {
    case 'stripe':
      for (let i = 0; i < size; i += 6) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i, y + size);
        ctx.stroke();
      }
      break;
    case 'dot':
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'cross':
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + 4);
      ctx.lineTo(x + size / 2, y + size - 4);
      ctx.moveTo(x + 4, y + size / 2);
      ctx.lineTo(x + size - 4, y + size / 2);
      ctx.stroke();
      break;
    case 'zigzag':
      ctx.beginPath();
      ctx.moveTo(x + 3, y + size / 2);
      ctx.lineTo(x + size / 3, y + 4);
      ctx.lineTo(x + (2 * size) / 3, y + size - 4);
      ctx.lineTo(x + size - 3, y + size / 2);
      ctx.stroke();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + 4);
      ctx.lineTo(x + size - 4, y + size / 2);
      ctx.lineTo(x + size / 2, y + size - 4);
      ctx.lineTo(x + 4, y + size / 2);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'square':
      ctx.strokeRect(x + 5, y + 5, size - 10, size - 10);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + 4);
      ctx.lineTo(x + size - 4, y + size - 4);
      ctx.lineTo(x + 4, y + size - 4);
      ctx.closePath();
      ctx.stroke();
      break;
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  pattern: string,
  highContrast: boolean,
  alpha: number = 1,
  isFlash: boolean = false,
) {
  const px = x * CELL_SIZE;
  const py = y * CELL_SIZE;

  ctx.globalAlpha = alpha;

  // 1. Base fill
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

  // Skip all 3D shadow/highlight layers for ghost cells (alpha < 1) and flash frames
  if (alpha >= 1 && !isFlash) {
    const hcMul = highContrast ? 1.5 : 1;

    // 2. Inner gradient — top half lighter for subtle convexity
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.08 * hcMul)})`;
    ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, (CELL_SIZE - 2) / 2);

    // 3. Left highlight
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.3 * hcMul)})`;
    ctx.fillRect(px + 1, py + 1, 3, CELL_SIZE - 2);

    // 4. Top highlight
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.3 * hcMul)})`;
    ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, 4);

    // 5. Right shadow
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, 0.35 * hcMul)})`;
    ctx.fillRect(px + CELL_SIZE - 4, py + 1, 3, CELL_SIZE - 2);

    // 6. Bottom shadow
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, 0.35 * hcMul)})`;
    ctx.fillRect(px + 1, py + CELL_SIZE - 5, CELL_SIZE - 2, 4);

    // 7. Inner catch-light — 2x2 bright spot at top-left
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.4 * hcMul)})`;
    ctx.fillRect(px + 3, py + 3, 2, 2);

    // 8. Cell border — thin outline for edge definition
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(1, 0.15 * hcMul)})`;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px + 0.5, py + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
  }

  // 9. Pattern overlay for colorblind support
  if (highContrast) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    drawPattern(ctx, pattern, px, py, CELL_SIZE);
  }

  ctx.globalAlpha = 1;
}

export function GameBoard({
  grid,
  activePiece,
  clearingLines,
  clearAnimProgress,
  showGhost,
  highContrast,
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevClearingRef = useRef<number[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [shaking, setShaking] = useState(false);

  // Spawn particles when new clearing lines appear
  useEffect(() => {
    if (
      clearingLines.length > 0 &&
      (prevClearingRef.current.length === 0 ||
        clearingLines[0] !== prevClearingRef.current[0])
    ) {
      particlesRef.current = spawnParticles(clearingLines, grid);

      // Trigger screen shake for Tetris (4-line clear)
      if (clearingLines.length >= 4) {
        setShaking(true);
        const timer = setTimeout(() => setShaking(false), 200);
        return () => clearTimeout(timer);
      }
    }
    prevClearingRef.current = clearingLines;
  }, [clearingLines, grid]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= GRID_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH, r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, BOARD_HEIGHT);
      ctx.stroke();
    }

    // Draw placed blocks
    const clearingSet = new Set(clearingLines);
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell: Cell = grid[r]?.[c] ?? null;
        if (cell !== null) {
          const def = PIECE_DEFINITIONS[cell];
          if (clearingSet.has(r)) {
            // Flash animation for clearing lines
            const flash = Math.sin(clearAnimProgress * Math.PI * 3) > 0;
            drawCell(ctx, c, r, flash ? '#ffffff' : def.color, def.pattern, highContrast, 1 - clearAnimProgress * 0.5, flash);
          } else {
            drawCell(ctx, c, r, def.color, def.pattern, highContrast);
          }
        }
      }
    }

    // Draw ghost piece
    if (activePiece && showGhost) {
      const ghostCells = getGhostCells(activePiece, grid);
      const def = PIECE_DEFINITIONS[activePiece.type];
      for (const cell of ghostCells) {
        if (cell.y >= 0 && cell.y < GRID_ROWS) {
          const px = cell.x * CELL_SIZE;
          const py = cell.y * CELL_SIZE;
          ctx.strokeStyle = def.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.4;
          ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Draw active piece
    if (activePiece) {
      const cells = getPieceCells(activePiece.type, activePiece.rotation, activePiece.position);
      const def = PIECE_DEFINITIONS[activePiece.type];
      for (const cell of cells) {
        if (cell.y >= 0 && cell.y < GRID_ROWS) {
          drawCell(ctx, cell.x, cell.y, def.color, def.pattern, highContrast);
        }
      }
    }

    // Draw particles
    if (particlesRef.current.length > 0) {
      drawParticles(ctx, particlesRef.current);
    }
  // Note: ghostY is intentionally excluded — ghost rendering uses getGhostCells() directly
  }, [grid, activePiece, clearingLines, clearAnimProgress, showGhost, highContrast]);

  // Particle animation loop
  useEffect(() => {
    let running = true;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); // cap at 50ms
      lastTimeRef.current = now;

      if (particlesRef.current.length > 0) {
        particlesRef.current = updateParticles(particlesRef.current, dt);
        // Redraw when particles are updating
        draw();
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  // Primary draw on state change
  useEffect(() => {
    draw();
  }, [draw]);

  // Build ARIA grid description
  const ariaDescription = buildAriaGrid(grid, activePiece);

  return (
    <div
      className={`tc-game-board-wrapper${shaking ? ' tc-screen-shake' : ''}`}
    >
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH}
        height={BOARD_HEIGHT}
        className="tc-game-canvas"
        aria-hidden="true"
      />
      {/* Hidden ARIA mirror for screen readers */}
      <div className="sr-only" role="status" aria-label="Tetris game board">
        {ariaDescription}
      </div>
    </div>
  );
}

function buildAriaGrid(grid: Grid, _activePiece: ActivePiece | null): string {
  // Simplified text description for screen readers
  const filledRows = grid.filter(row => row.some(c => c !== null)).length;
  const emptyRows = GRID_ROWS - filledRows;
  return `Board: ${emptyRows} empty rows, ${filledRows} rows with blocks`;
}
