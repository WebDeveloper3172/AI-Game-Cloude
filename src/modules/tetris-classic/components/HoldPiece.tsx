/**
 * Hold piece display component.
 */
import { useRef, useEffect } from 'react';
import type { PieceType } from '../engine/types';
import { PIECE_DEFINITIONS } from '../engine/pieces';
import type { ThemeColors } from '../engine/themes';

interface HoldPieceProps {
  piece: PieceType | null;
  used: boolean;
  themeColors?: ThemeColors;
}

const HOLD_CELL = 22;

export function HoldPiece({ piece, used, themeColors }: HoldPieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 5 * HOLD_CELL;
    const h = 4 * HOLD_CELL;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    if (!piece) return;

    const def = PIECE_DEFINITIONS[piece];
    const pieceColor = themeColors?.pieces[piece] ?? def.color;
    const shape = def.rotations[0];
    const shapeW = shape[0].length * HOLD_CELL;
    const shapeH = shape.length * HOLD_CELL;
    const offX = (w - shapeW) / 2;
    const offY = (h - shapeH) / 2;

    const baseAlpha = used ? 0.4 : 1.0;
    ctx.globalAlpha = baseAlpha;

    // Scale shadow dimensions proportionally to cell size
    const topH = Math.round(HOLD_CELL * 4 / 30);
    const leftW = Math.round(HOLD_CELL * 3 / 30);
    const bottomH = Math.round(HOLD_CELL * 4 / 30);
    const rightW = Math.round(HOLD_CELL * 3 / 30);
    const catchSize = Math.max(1, Math.round(HOLD_CELL * 2 / 30));

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const x = offX + c * HOLD_CELL;
          const y = offY + r * HOLD_CELL;

          // 1. Base fill
          ctx.fillStyle = pieceColor;
          ctx.fillRect(x + 1, y + 1, HOLD_CELL - 2, HOLD_CELL - 2);

          // Skip 3D layers when dimmed (used state)
          if (!used) {
            // 2. Inner gradient — top half lighter
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(x + 1, y + 1, HOLD_CELL - 2, (HOLD_CELL - 2) / 2);

            // 3. Left highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(x + 1, y + 1, leftW, HOLD_CELL - 2);

            // 4. Top highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(x + 1, y + 1, HOLD_CELL - 2, topH);

            // 5. Right shadow
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(x + HOLD_CELL - 1 - rightW, y + 1, rightW, HOLD_CELL - 2);

            // 6. Bottom shadow
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(x + 1, y + HOLD_CELL - 1 - bottomH, HOLD_CELL - 2, bottomH);

            // 7. Inner catch-light
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(x + 3, y + 3, catchSize, catchSize);

            // 8. Cell border
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + 0.5, y + 0.5, HOLD_CELL - 1, HOLD_CELL - 1);
          }
        }
      }
    }
    ctx.globalAlpha = 1.0;
  }, [piece, used, themeColors]);

  return (
    <div className="tc-hold-piece" aria-label={`Hold piece: ${piece ?? 'empty'}`}>
      <h3 className="tc-panel-title">Hold</h3>
      <canvas ref={canvasRef} className="tc-hold-canvas" aria-hidden="true" />
      {used && <span className="tc-hold-used-label">Used</span>}
    </div>
  );
}
