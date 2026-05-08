/**
 * Bottom tray of pieces. Each tile is selectable; tap again to rotate.
 */
import { PIECE_DEFINITIONS } from '../../tetris-classic/engine/pieces.ts';
import type { TrayPiece } from '../engine/types.ts';

interface Props {
  tray: TrayPiece[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRotate: () => void;
}

export function PieceTray({ tray, selectedId, onSelect, onRotate }: Props) {
  return (
    <div className="sb-tray" role="toolbar" aria-label="Piece tray">
      {tray.map(piece => {
        const def = PIECE_DEFINITIONS[piece.type];
        const shape = def.rotations[piece.rotation & 3];
        const isSelected = piece.id === selectedId;
        return (
          <button
            key={piece.id}
            type="button"
            className={[
              'sb-tray-piece',
              piece.used ? 'sb-tray-piece-used' : '',
              isSelected ? 'sb-tray-piece-selected' : '',
            ].filter(Boolean).join(' ')}
            disabled={piece.used}
            aria-label={`${def.type}-piece${piece.used ? ', already used' : isSelected ? ', selected, tap again to rotate' : ''}`}
            aria-pressed={isSelected}
            onClick={() => {
              if (piece.used) return;
              if (isSelected) onRotate();
              else onSelect(piece.id);
            }}
          >
            <div className="sb-tray-piece-shape">
              {shape.map((row, r) => (
                <div key={r} className="sb-tray-piece-row">
                  {row.map((on, c) => (
                    <div
                      key={c}
                      className={`sb-tray-piece-cell ${on ? 'sb-tray-piece-cell-on' : ''}`}
                      style={on ? { backgroundColor: def.color } : undefined}
                    />
                  ))}
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
