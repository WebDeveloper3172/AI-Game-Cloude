/**
 * Renders the target square grid. Shows placed pieces, obstacles, and a hover
 * preview when a tray piece is selected. Tap-to-place input model: user picks
 * a piece in the tray (sets selected), then taps a cell on the grid.
 */
import { useCallback, useMemo, useState } from 'react';
import { PIECE_DEFINITIONS, getPieceCells } from '../../tetris-classic/engine/pieces.ts';
import { isLegalPlacement } from '../engine/squarePacker.ts';
import type { PackingGrid, Position, TrayPiece } from '../engine/types.ts';

interface Props {
  grid: PackingGrid;
  selectedPiece: TrayPiece | null;
  placedPieceTypes: Record<number, string>;
  onPlace: (pos: Position) => void;
}

export function TargetSquare({ grid, selectedPiece, placedPieceTypes, onPlace }: Props) {
  const size = grid.length;
  const [hover, setHover] = useState<Position | null>(null);

  const previewCells = useMemo(() => {
    if (!selectedPiece || !hover) return null;
    const def = PIECE_DEFINITIONS[selectedPiece.type];
    const shape = def.rotations[selectedPiece.rotation & 3];
    // Center the shape's bounding-box on the hover cell.
    const minR = (() => {
      for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) if (shape[r][c]) return r;
      return 0;
    })();
    const minC = (() => {
      for (let c = 0; c < (shape[0]?.length ?? 0); c++) for (let r = 0; r < shape.length; r++) if (shape[r][c]) return c;
      return 0;
    })();
    const pos: Position = { x: hover.x - minC, y: hover.y - minR };
    const cells = getPieceCells(selectedPiece.type, selectedPiece.rotation, pos);
    const legal = isLegalPlacement(grid, selectedPiece, selectedPiece.rotation, pos);
    return { cells, pos, legal };
  }, [selectedPiece, hover, grid]);

  const onCellClick = useCallback(() => {
    if (!selectedPiece || !previewCells) return;
    if (!previewCells.legal) return;
    onPlace(previewCells.pos);
    setHover(null);
  }, [selectedPiece, previewCells, onPlace]);

  return (
    <div
      className="sb-target"
      style={{ '--sb-grid-size': size } as React.CSSProperties}
      role="grid"
      aria-label={`Target square, ${size} by ${size} cells`}
    >
      {grid.map((row, y) => (
        <div key={y} className="sb-target-row" role="row">
          {row.map((cell, x) => {
            const isPreview = previewCells?.cells.some(c => c.x === x && c.y === y) ?? false;
            const isObstacle = cell === -1;
            const placedSeq = typeof cell === 'number' && cell > 0 ? cell : null;
            const placedType = placedSeq != null ? placedPieceTypes[placedSeq] : undefined;
            const className = [
              'sb-cell',
              cell !== null && !isObstacle ? 'sb-cell-filled' : '',
              isObstacle ? 'sb-cell-obstacle' : '',
              isPreview ? (previewCells?.legal ? 'sb-cell-preview-good' : 'sb-cell-preview-bad') : '',
            ].filter(Boolean).join(' ');
            const style: React.CSSProperties = placedType
              ? { backgroundColor: PIECE_DEFINITIONS[placedType as keyof typeof PIECE_DEFINITIONS].color }
              : isPreview && selectedPiece && previewCells?.legal
                ? { backgroundColor: PIECE_DEFINITIONS[selectedPiece.type].color, opacity: 0.55 }
                : {};
            return (
              <button
                key={x}
                type="button"
                className={className}
                style={style}
                role="gridcell"
                aria-label={`Cell ${x + 1}, ${y + 1}${cell !== null ? ', filled' : ', empty'}`}
                onMouseEnter={() => setHover({ x, y })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ x, y })}
                onBlur={() => setHover(null)}
                onClick={onCellClick}
                onTouchStart={() => setHover({ x, y })}
                disabled={!selectedPiece || isObstacle || (cell !== null && !isPreview)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
