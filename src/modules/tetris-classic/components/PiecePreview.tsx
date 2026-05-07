/**
 * Next pieces preview display. Shows the next 3 pieces.
 */
import { useRef, useEffect } from 'react';
import type { PieceType } from '../engine/types';
import { PIECE_DEFINITIONS } from '../engine/pieces';
import type { ThemeColors } from '../engine/themes';

interface PiecePreviewProps {
  pieces: PieceType[];
  themeColors?: ThemeColors;
}

const PREVIEW_CELL = 20;
const PREVIEW_PAD = 8;

function drawPreviewCell(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cellSize: number,
  color: string,
) {
  // 1. Base fill
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

  // Scale shadow dimensions proportionally to cell size
  const topH = Math.round(cellSize * 4 / 30);
  const leftW = Math.round(cellSize * 3 / 30);
  const bottomH = Math.round(cellSize * 4 / 30);
  const rightW = Math.round(cellSize * 3 / 30);
  const catchSize = Math.max(1, Math.round(cellSize * 2 / 30));

  // 2. Inner gradient — top half lighter
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(px + 1, py + 1, cellSize - 2, (cellSize - 2) / 2);

  // 3. Left highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(px + 1, py + 1, leftW, cellSize - 2);

  // 4. Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(px + 1, py + 1, cellSize - 2, topH);

  // 5. Right shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(px + cellSize - 1 - rightW, py + 1, rightW, cellSize - 2);

  // 6. Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(px + 1, py + cellSize - 1 - bottomH, cellSize - 2, bottomH);

  // 7. Inner catch-light
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(px + 3, py + 3, catchSize, catchSize);

  // 8. Cell border
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
}

function drawPieceOnCanvas(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  offsetX: number,
  offsetY: number,
  cellSize: number,
  themeColors?: ThemeColors,
) {
  const def = PIECE_DEFINITIONS[type];
  const shape = def.rotations[0];
  const color = themeColors?.pieces[type] ?? def.color;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        drawPreviewCell(ctx, x, y, cellSize, color);
      }
    }
  }
}

export function PiecePreview({ pieces, themeColors }: PiecePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 5 * PREVIEW_CELL;
    const height = pieces.length * (4 * PREVIEW_CELL + PREVIEW_PAD);
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    pieces.forEach((type, i) => {
      const shape = PIECE_DEFINITIONS[type].rotations[0];
      const shapeW = shape[0].length * PREVIEW_CELL;
      const offsetX = (width - shapeW) / 2;
      const offsetY = i * (4 * PREVIEW_CELL + PREVIEW_PAD);
      drawPieceOnCanvas(ctx, type, offsetX, offsetY, PREVIEW_CELL, themeColors);
    });
  }, [pieces, themeColors]);

  return (
    <div className="tc-piece-preview" aria-label="Next pieces">
      <h3 className="tc-panel-title">Next</h3>
      <canvas
        ref={canvasRef}
        className="tc-preview-canvas"
        aria-hidden="true"
      />
      <div className="sr-only">
        Next pieces: {pieces.map((p, i) => `${i + 1}. ${p}`).join(', ')}
      </div>
    </div>
  );
}
