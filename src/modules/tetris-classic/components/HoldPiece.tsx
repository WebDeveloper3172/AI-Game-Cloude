/**
 * Hold piece display component.
 */
import { useRef, useEffect } from 'react';
import type { PieceType } from '../engine/types';
import { PIECE_DEFINITIONS } from '../engine/pieces';

interface HoldPieceProps {
  piece: PieceType | null;
  used: boolean;
}

const HOLD_CELL = 22;

export function HoldPiece({ piece, used }: HoldPieceProps) {
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
    const shape = def.rotations[0];
    const shapeW = shape[0].length * HOLD_CELL;
    const shapeH = shape.length * HOLD_CELL;
    const offX = (w - shapeW) / 2;
    const offY = (h - shapeH) / 2;

    ctx.globalAlpha = used ? 0.4 : 1.0;
    ctx.fillStyle = def.color;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const x = offX + c * HOLD_CELL;
          const y = offY + r * HOLD_CELL;
          ctx.fillRect(x + 1, y + 1, HOLD_CELL - 2, HOLD_CELL - 2);
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(x + 1, y + 1, HOLD_CELL - 2, 3);
          ctx.fillStyle = def.color;
        }
      }
    }
    ctx.globalAlpha = 1.0;
  }, [piece, used]);

  return (
    <div className="tc-hold-piece" aria-label={`Hold piece: ${piece ?? 'empty'}`}>
      <h3 className="tc-panel-title">Hold</h3>
      <canvas ref={canvasRef} className="tc-hold-canvas" aria-hidden="true" />
      {used && <span className="tc-hold-used-label">Used</span>}
    </div>
  );
}
