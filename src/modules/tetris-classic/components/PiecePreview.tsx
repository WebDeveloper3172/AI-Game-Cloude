/**
 * Next pieces preview display. Shows the next 3 pieces.
 */
import { useRef, useEffect } from 'react';
import type { PieceType } from '../engine/types';
import { PIECE_DEFINITIONS } from '../engine/pieces';

interface PiecePreviewProps {
  pieces: PieceType[];
}

const PREVIEW_CELL = 20;
const PREVIEW_PAD = 8;

function drawPieceOnCanvas(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  offsetX: number,
  offsetY: number,
  cellSize: number,
) {
  const def = PIECE_DEFINITIONS[type];
  const shape = def.rotations[0];
  ctx.fillStyle = def.color;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        // Add a slight highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 1, y + 1, cellSize - 2, 3);
        ctx.fillStyle = def.color;
      }
    }
  }
}

export function PiecePreview({ pieces }: PiecePreviewProps) {
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
      drawPieceOnCanvas(ctx, type, offsetX, offsetY, PREVIEW_CELL);
    });
  }, [pieces]);

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
