/**
 * Audio hook for all Tetris Classic sound effects using Howler.js.
 * Returns play functions for each sound event.
 * Sound files are stubs -- architecture is in place for when assets arrive.
 */
import { useRef, useCallback, useMemo } from 'react';
import { Howl } from 'howler';
import type { GameSettings } from '../engine/types';

interface SoundDef {
  src: string[];
  volume: number;
}

const SOUND_DEFS: Record<string, SoundDef> = {
  move: { src: ['/audio/tetris/move.mp3'], volume: 0.3 },
  rotate: { src: ['/audio/tetris/rotate.mp3'], volume: 0.4 },
  softDrop: { src: ['/audio/tetris/soft-drop.mp3'], volume: 0.3 },
  hardDrop: { src: ['/audio/tetris/hard-drop.mp3'], volume: 0.6 },
  lock: { src: ['/audio/tetris/lock.mp3'], volume: 0.5 },
  lineClear: { src: ['/audio/tetris/line-clear.mp3'], volume: 0.7 },
  tetris: { src: ['/audio/tetris/tetris.mp3'], volume: 0.8 },
  combo: { src: ['/audio/tetris/combo.mp3'], volume: 0.6 },
  tSpin: { src: ['/audio/tetris/tspin.mp3'], volume: 0.7 },
  levelUp: { src: ['/audio/tetris/level-up.mp3'], volume: 0.7 },
  hold: { src: ['/audio/tetris/hold.mp3'], volume: 0.4 },
  gameOver: { src: ['/audio/tetris/game-over.mp3'], volume: 0.8 },
  pause: { src: ['/audio/tetris/pause.mp3'], volume: 0.4 },
};

export interface TetrisAudio {
  playMove: () => void;
  playRotate: () => void;
  playSoftDrop: () => void;
  playHardDrop: () => void;
  playLock: () => void;
  playLineClear: () => void;
  playTetris: () => void;
  playCombo: () => void;
  playTSpin: () => void;
  playLevelUp: () => void;
  playHold: () => void;
  playGameOver: () => void;
  playPause: () => void;
}

/**
 * Creates a safe play function that silently catches errors
 * (e.g., when audio files don't exist yet).
 */
function safePlay(howl: Howl | null): () => void {
  return () => {
    try {
      howl?.play();
    } catch {
      // Audio file not available yet -- silently skip
    }
  };
}

export function useTetrisClassicAudio(settings: GameSettings): TetrisAudio {
  const howlsRef = useRef<Map<string, Howl>>(new Map());

  // Lazily create Howl instances
  const getHowl = useCallback(
    (name: string): Howl | null => {
      if (howlsRef.current.has(name)) {
        const h = howlsRef.current.get(name)!;
        h.volume(SOUND_DEFS[name].volume * settings.sfxVolume);
        return h;
      }

      try {
        const def = SOUND_DEFS[name];
        if (!def) return null;
        const howl = new Howl({
          src: def.src,
          volume: def.volume * settings.sfxVolume,
          preload: false, // Don't preload since files may not exist
        });
        howlsRef.current.set(name, howl);
        return howl;
      } catch {
        return null;
      }
    },
    [settings.sfxVolume],
  );

  return useMemo(
    () => ({
      playMove: safePlay(getHowl('move')),
      playRotate: safePlay(getHowl('rotate')),
      playSoftDrop: safePlay(getHowl('softDrop')),
      playHardDrop: safePlay(getHowl('hardDrop')),
      playLock: safePlay(getHowl('lock')),
      playLineClear: safePlay(getHowl('lineClear')),
      playTetris: safePlay(getHowl('tetris')),
      playCombo: safePlay(getHowl('combo')),
      playTSpin: safePlay(getHowl('tSpin')),
      playLevelUp: safePlay(getHowl('levelUp')),
      playHold: safePlay(getHowl('hold')),
      playGameOver: safePlay(getHowl('gameOver')),
      playPause: safePlay(getHowl('pause')),
    }),
    [getHowl],
  );
}
