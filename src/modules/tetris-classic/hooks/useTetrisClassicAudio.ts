/**
 * Audio hook for Tetris Classic — uses the procedural Web Audio API engine.
 * No external audio files required.
 */
import { useEffect, useCallback, useMemo, useRef } from 'react';
import type { GameSettings } from '../engine/types';
import { getAudioEngine } from '../audio/AudioEngine';

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
  playResume: () => void;
  playHighScore: () => void;
  playCountdownTick: () => void;
  playCountdownGo: () => void;
  startMusic: () => void;
  stopMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  /** Call once after a user gesture to unlock AudioContext. */
  initOnInteraction: () => void;
}

export function useTetrisClassicAudio(settings: GameSettings): TetrisAudio {
  const engine = useMemo(() => getAudioEngine(), []);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Sync volume settings whenever they change
  useEffect(() => {
    engine.setMasterVolume(settings.volume);
    engine.setSfxVolume(settings.sfxEnabled ? settings.sfxVolume : 0);
    engine.setMusicVolume(settings.musicEnabled ? settings.volume : 0);
  }, [engine, settings.volume, settings.sfxVolume, settings.musicEnabled, settings.sfxEnabled]);

  const initOnInteraction = useCallback(() => {
    engine.init();
    engine.resume();
    // Apply current settings immediately after init
    engine.setMasterVolume(settingsRef.current.volume);
    engine.setSfxVolume(settingsRef.current.sfxEnabled ? settingsRef.current.sfxVolume : 0);
    engine.setMusicVolume(settingsRef.current.musicEnabled ? settingsRef.current.volume : 0);
  }, [engine]);

  // Wrap each play function to be a no-op when sfx is disabled
  const sfx = useCallback(
    (fn: () => void) => {
      return () => {
        if (!settingsRef.current.sfxEnabled) return;
        fn();
      };
    },
    [],
  );

  return useMemo(
    () => ({
      playMove: sfx(() => engine.playMove()),
      playRotate: sfx(() => engine.playRotate()),
      playSoftDrop: sfx(() => engine.playSoftDrop()),
      playHardDrop: sfx(() => engine.playHardDrop()),
      playLock: sfx(() => engine.playLock()),
      playLineClear: sfx(() => engine.playLineClear()),
      playTetris: sfx(() => engine.playTetris()),
      playCombo: sfx(() => engine.playCombo()),
      playTSpin: sfx(() => engine.playTSpin()),
      playLevelUp: sfx(() => engine.playLevelUp()),
      playHold: sfx(() => engine.playHold()),
      playGameOver: sfx(() => engine.playGameOver()),
      playPause: sfx(() => engine.playPause()),
      playResume: sfx(() => engine.playResume()),
      playHighScore: sfx(() => engine.playHighScore()),
      playCountdownTick: sfx(() => engine.playCountdownTick()),
      playCountdownGo: sfx(() => engine.playCountdownGo()),
      startMusic: () => {
        if (settingsRef.current.musicEnabled) engine.startMusic();
      },
      stopMusic: () => engine.stopMusic(true),
      pauseMusic: () => engine.pauseMusic(),
      resumeMusic: () => {
        if (settingsRef.current.musicEnabled) engine.resumeMusic();
      },
      initOnInteraction,
    }),
    [engine, sfx, initOnInteraction],
  );
}
