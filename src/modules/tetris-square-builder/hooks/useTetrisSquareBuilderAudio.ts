/**
 * Audio hook for Square Builder. Reuses the singleton AudioEngine from
 * tetris-classic and remaps relevant SFX to Square Builder events. No new
 * Web Audio code is duplicated.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getAudioEngine } from '../../tetris-classic/audio/AudioEngine.ts';
import type { GameSettings } from '../../tetris-classic/engine/types.ts';
import { NARRATION, type NarrationKey } from '../audio/tetrisSquareBuilderSentences.ts';

export interface SquareBuilderAudio {
  playPiecePick: () => void;
  playPiecePlace: () => void;
  playIllegal: () => void;
  playRotate: () => void;
  playUndo: () => void;
  playHint: () => void;
  playTimeLow: () => void;
  playTimeUp: () => void;
  playLevelComplete: (stars: number) => void;
  startMusic: () => void;
  stopMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  initOnInteraction: () => void;
  /** Returns the narration text for an ARIA live region. */
  getCaption: (key: NarrationKey) => string;
  /** Speak narration via Web Speech API (no asset pipeline). */
  speak: (key: NarrationKey) => void;
}

let speechUnlocked = false;
function unlockSpeech(): void {
  if (speechUnlocked) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Some browsers require an empty utterance after a user gesture before they
  // accept further calls; this primes the queue.
  try {
    const u = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(u);
    speechUnlocked = true;
  } catch {
    /* ignore */
  }
}

function speakText(text: string, volume: number): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.volume = Math.max(0, Math.min(1, volume));
    u.rate = 1.0;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function useTetrisSquareBuilderAudio(settings: GameSettings): SquareBuilderAudio {
  const engine = useMemo(() => getAudioEngine(), []);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    engine.setMasterVolume(settings.volume);
    engine.setSfxVolume(settings.sfxEnabled ? settings.sfxVolume : 0);
    engine.setMusicVolume(settings.musicEnabled ? settings.volume : 0);
  }, [engine, settings.volume, settings.sfxVolume, settings.musicEnabled, settings.sfxEnabled]);

  const initOnInteraction = useCallback(() => {
    engine.init();
    engine.resume();
    engine.setMasterVolume(settingsRef.current.volume);
    engine.setSfxVolume(settingsRef.current.sfxEnabled ? settingsRef.current.sfxVolume : 0);
    engine.setMusicVolume(settingsRef.current.musicEnabled ? settingsRef.current.volume : 0);
    unlockSpeech();
  }, [engine]);

  const speak = useCallback((key: NarrationKey) => {
    if (!settingsRef.current.sfxEnabled) return;
    speakText(NARRATION[key], settingsRef.current.volume);
  }, []);

  const sfx = useCallback((fn: () => void) => () => {
    if (!settingsRef.current.sfxEnabled) return;
    fn();
  }, []);

  const getCaption = useCallback((key: NarrationKey): string => {
    return NARRATION[key];
  }, []);

  return useMemo<SquareBuilderAudio>(() => ({
    playPiecePick: sfx(() => engine.playMove()),
    playPiecePlace: sfx(() => engine.playLock()),
    playIllegal: sfx(() => engine.playGameOver()),
    playRotate: sfx(() => engine.playRotate()),
    playUndo: sfx(() => engine.playHold()),
    playHint: sfx(() => engine.playLevelUp()),
    playTimeLow: sfx(() => engine.playCountdownTick()),
    playTimeUp: sfx(() => engine.playGameOver()),
    playLevelComplete: sfx(() => {
      engine.playLineClear();
      engine.playCombo();
    }) as unknown as (stars: number) => void,
    startMusic: () => {
      if (settingsRef.current.musicEnabled) engine.startMusic();
    },
    stopMusic: () => engine.stopMusic(true),
    pauseMusic: () => engine.pauseMusic(),
    resumeMusic: () => {
      if (settingsRef.current.musicEnabled) engine.resumeMusic();
    },
    initOnInteraction,
    getCaption,
    speak,
  }), [engine, sfx, initOnInteraction, getCaption, speak]);
}
