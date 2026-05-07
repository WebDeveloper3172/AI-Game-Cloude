/**
 * Procedural audio engine for Tetris Classic.
 * Generates all SFX and music using the Web Audio API — zero external files needed.
 */

// ---- Note frequency helpers ----
const NOTE_FREQ: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
};

function freq(note: string): number {
  return NOTE_FREQ[note] ?? 440;
}

export class TetrisAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Music state
  private musicPlaying = false;
  private musicPaused = false;
  private musicTimers: number[] = [];
  private musicOscillators: OscillatorNode[] = []; // Track active oscillators to stop them
  private currentTrack = 0;
  private loopsOnCurrentTrack = 0;
  private readonly LOOPS_BEFORE_SWITCH = 3; // Switch track every 3 loops

  // Volume state (0-1)
  private masterVol = 0.7;
  private sfxVol = 0.8;
  private musicVol = 0.7;

  // Throttling to prevent audio spam
  private lastPlayTime: Map<string, number> = new Map();
  private readonly MIN_INTERVAL = 50;

  // ---- Initialization ----

  init(): void {
    if (this.ctx) {
      // Already initialized — just make sure it's running
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVol;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.masterGain);

    // Immediately resume if created in suspended state (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /** Ensure AudioContext is running (call after user gesture). */
  resume(): void {
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  // ---- Throttle helper ----

  private canPlay(id: string, bypassThrottle = false): boolean {
    if (bypassThrottle) return true;
    const now = performance.now();
    const last = this.lastPlayTime.get(id) ?? 0;
    if (now - last < this.MIN_INTERVAL) return false;
    this.lastPlayTime.set(id, now);
    return true;
  }

  // ---- Low-level helpers ----

  private now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /** Create an oscillator connected to sfxGain, auto-stop after `dur` seconds. */
  private osc(
    type: OscillatorType,
    frequency: number,
    startTime: number,
    dur: number,
    gainVal = 0.3,
  ): { osc: OscillatorNode; gain: GainNode } | null {
    if (!this.ctx || !this.sfxGain) return null;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.value = gainVal;
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(startTime);
    o.stop(startTime + dur);
    return { osc: o, gain: g };
  }

  /** Create a short noise burst connected to sfxGain. */
  private noiseBurst(startTime: number, dur: number, gainVal = 0.15): GainNode | null {
    if (!this.ctx || !this.sfxGain) return null;
    const bufSize = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = gainVal;
    src.connect(g);
    g.connect(this.sfxGain);
    src.start(startTime);
    src.stop(startTime + dur);
    return g;
  }

  // ---- SFX ----

  playMove(): void {
    if (!this.canPlay('move')) return;
    const t = this.now();
    const n = this.osc('sine', 500, t, 0.03, 0.2);
    if (n) {
      n.gain.gain.setValueAtTime(0.2, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    }
  }

  playRotate(): void {
    if (!this.canPlay('rotate')) return;
    const t = this.now();
    const n = this.osc('sine', 800, t, 0.06, 0.2);
    if (n) {
      n.osc.frequency.exponentialRampToValueAtTime(1200, t + 0.06);
      n.gain.gain.setValueAtTime(0.2, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    }
    this.noiseBurst(t, 0.04, 0.05);
  }

  playSoftDrop(): void {
    if (!this.canPlay('softDrop')) return;
    const t = this.now();
    const n = this.osc('sine', 300, t, 0.02, 0.1);
    if (n) {
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    }
  }

  playHardDrop(): void {
    if (!this.canPlay('hardDrop', true)) return;
    const t = this.now();
    // Low thud
    const n = this.osc('sine', 150, t, 0.1, 0.35);
    if (n) {
      n.osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      n.gain.gain.setValueAtTime(0.35, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    }
    // Noise impact
    const ng = this.noiseBurst(t, 0.08, 0.15);
    if (ng) {
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    }
  }

  playLock(): void {
    if (!this.canPlay('lock')) return;
    const t = this.now();
    const n = this.osc('sine', 500, t, 0.05, 0.2);
    if (n) {
      n.osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
      n.gain.gain.setValueAtTime(0.2, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    }
  }

  playLineClear(): void {
    if (!this.canPlay('lineClear')) return;
    const t = this.now();
    // Ascending chime: C5 -> E5 -> G5
    const notes = [freq('C5'), freq('E5'), freq('G5')];
    const step = 0.07;
    for (let i = 0; i < notes.length; i++) {
      const n = this.osc('sine', notes[i], t + i * step, 0.12, 0.2);
      if (n) {
        n.gain.gain.setValueAtTime(0.2, t + i * step);
        n.gain.gain.exponentialRampToValueAtTime(0.001, t + i * step + 0.12);
      }
    }
  }

  playTetris(): void {
    if (!this.canPlay('tetris')) return;
    const t = this.now();
    // Epic chord: C4 + E4 + G4 + C5
    const chord = [freq('C4'), freq('E4'), freq('G4'), freq('C5')];
    for (const f of chord) {
      const n = this.osc('square', f, t, 0.4, 0.1);
      if (n) {
        n.gain.gain.setValueAtTime(0.1, t);
        n.gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
        n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      }
      // Slight detune for chorus
      const n2 = this.osc('square', f * 1.005, t, 0.4, 0.06);
      if (n2) {
        n2.gain.gain.setValueAtTime(0.06, t);
        n2.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      }
    }
  }

  playCombo(): void {
    if (!this.canPlay('combo')) return;
    const t = this.now();
    // Escalating ping
    const n = this.osc('sine', 700, t, 0.1, 0.25);
    if (n) {
      n.osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
      n.gain.gain.setValueAtTime(0.25, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    }
  }

  playTSpin(): void {
    if (!this.canPlay('tSpin')) return;
    const t = this.now();
    // Spinning noise sweep
    this.noiseBurst(t, 0.12, 0.12);
    // High ding
    const n = this.osc('sine', 880, t + 0.06, 0.15, 0.25);
    if (n) {
      n.gain.gain.setValueAtTime(0.25, t + 0.06);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.21);
    }
  }

  playLevelUp(): void {
    if (!this.canPlay('levelUp')) return;
    const t = this.now();
    // Quick ascending arpeggio: C5 E5 G5 C6
    const notes = [freq('C5'), freq('E5'), freq('G5'), freq('C6')];
    const step = 0.1;
    for (let i = 0; i < notes.length; i++) {
      const n = this.osc('square', notes[i], t + i * step, 0.15, 0.12);
      if (n) {
        n.gain.gain.setValueAtTime(0.12, t + i * step);
        n.gain.gain.exponentialRampToValueAtTime(0.001, t + i * step + 0.15);
      }
    }
  }

  playHold(): void {
    if (!this.canPlay('hold')) return;
    const t = this.now();
    // Two quick alternating tones
    const n1 = this.osc('sine', 600, t, 0.04, 0.2);
    if (n1) {
      n1.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    }
    const n2 = this.osc('sine', 800, t + 0.04, 0.04, 0.2);
    if (n2) {
      n2.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    }
  }

  playGameOver(): void {
    if (!this.canPlay('gameOver', true)) return;
    const t = this.now();
    // Descending sad tone
    const n = this.osc('sine', 800, t, 0.8, 0.25);
    if (n) {
      n.osc.frequency.exponentialRampToValueAtTime(200, t + 0.8);
      n.gain.gain.setValueAtTime(0.25, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    }
    // Second voice for sadness
    const n2 = this.osc('triangle', 600, t + 0.1, 0.7, 0.1);
    if (n2) {
      n2.osc.frequency.exponentialRampToValueAtTime(150, t + 0.8);
      n2.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    }
  }

  playPause(): void {
    if (!this.canPlay('pause')) return;
    const t = this.now();
    const n = this.osc('sine', 600, t, 0.1, 0.15);
    if (n) {
      n.gain.gain.setValueAtTime(0.15, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    }
  }

  playResume(): void {
    if (!this.canPlay('resume')) return;
    const t = this.now();
    const n = this.osc('sine', 600, t, 0.1, 0.15);
    if (n) {
      n.osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
      n.gain.gain.setValueAtTime(0.15, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    }
  }

  playCountdownTick(): void {
    if (!this.canPlay('countdownTick', true)) return;
    const t = this.now();
    const n = this.osc('sine', freq('A4'), t, 0.12, 0.25);
    if (n) {
      n.gain.gain.setValueAtTime(0.25, t);
      n.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    }
  }

  playCountdownGo(): void {
    if (!this.canPlay('countdownGo', true)) return;
    const t = this.now();
    // Higher pitched two-tone "go" sound
    const n1 = this.osc('sine', freq('E5'), t, 0.08, 0.25);
    if (n1) {
      n1.gain.gain.setValueAtTime(0.25, t);
      n1.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    }
    const n2 = this.osc('sine', freq('G5'), t + 0.08, 0.15, 0.3);
    if (n2) {
      n2.gain.gain.setValueAtTime(0.3, t + 0.08);
      n2.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.23);
    }
  }

  playHighScore(): void {
    if (!this.canPlay('highScore', true)) return;
    const t = this.now();
    // Celebration: rapid ascending sparkle
    const notes = [freq('C5'), freq('E5'), freq('G5'), freq('C6'), freq('E5'), freq('G5'), freq('C6')];
    const step = 0.08;
    for (let i = 0; i < notes.length; i++) {
      const n = this.osc('sine', notes[i], t + i * step, 0.12, 0.18);
      if (n) {
        n.gain.gain.setValueAtTime(0.18, t + i * step);
        n.gain.gain.exponentialRampToValueAtTime(0.001, t + i * step + 0.12);
      }
    }
    // Sparkle noise
    for (let i = 0; i < 4; i++) {
      const ng = this.noiseBurst(t + i * 0.15, 0.05, 0.04);
      if (ng) {
        ng.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.05);
      }
    }
  }

  // ---- Background Music ----

  /**
   * Simple two-voice chiptune loop.
   * Bass (square wave) + Melody (square wave), ~140 BPM.
   */
  startMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    // If already playing, don't start again (prevents doubling)
    if (this.musicPlaying && !this.musicPaused) return;
    // If was paused, resume instead
    if (this.musicPlaying && this.musicPaused) {
      this.resumeMusic();
      return;
    }
    this.musicPlaying = true;
    this.musicPaused = false;
    this.currentTrack = Math.floor(Math.random() * this.getTracks().length);
    this.loopsOnCurrentTrack = 0;
    this.scheduleMusic(this.ctx.currentTime);
  }

  /** Check if music is currently playing. */
  isMusicPlaying(): boolean {
    return this.musicPlaying && !this.musicPaused;
  }

  /** Music tracks — each has its own bass + melody patterns and BPM. */
  private getTracks(): Array<{ bpm: number; bass: string[]; melody: string[]; bassType: OscillatorType; melodyType: OscillatorType; bassVol: number; melodyVol: number }> {
    return [
      {
        // Track 1: Upbeat classic — C major, energetic
        bpm: 140,
        bassType: 'square', melodyType: 'square',
        bassVol: 0.08, melodyVol: 0.06,
        bass: [
          'C3','C3','G3','G3', 'C3','C3','E3','E3',
          'A3','A3','E3','E3', 'F3','F3','G3','G3',
          'C3','C3','G3','G3', 'E3','E3','G3','G3',
          'A3','A3','F3','F3', 'G3','G3','C3','C3',
        ],
        melody: [
          'E5','D5','C5','D5', 'E5','E5','D5','C5',
          'A4','C5','E5','C5', 'D5','C5','B4','G4',
          'E5','D5','C5','D5', 'E5','G5','E5','D5',
          'A4','C5','D5','E5', 'D5','C5','C5','C5',
        ],
      },
      {
        // Track 2: Funky groove — A minor, syncopated feel
        bpm: 130,
        bassType: 'sawtooth', melodyType: 'square',
        bassVol: 0.06, melodyVol: 0.06,
        bass: [
          'A3','A3','E3','A3', 'C3','E3','A3','E3',
          'D3','D3','A3','D3', 'F3','A3','D3','A3',
          'G3','G3','D3','G3', 'E3','G3','B3','G3',
          'A3','E3','C3','E3', 'A3','G3','E3','A3',
        ],
        melody: [
          'A4','C5','E5','A5', 'G5','E5','C5','D5',
          'D5','F5','A5','F5', 'E5','D5','C5','A4',
          'G4','B4','D5','G5', 'E5','D5','B4','G4',
          'A4','C5','E5','G5', 'A5','E5','C5','A4',
        ],
      },
      {
        // Track 3: Dreamy — G major, slower, triangle-like feel
        bpm: 120,
        bassType: 'triangle', melodyType: 'sine',
        bassVol: 0.10, melodyVol: 0.08,
        bass: [
          'G3','G3','D3','G3', 'B3','D3','G3','D3',
          'E3','E3','B3','E3', 'C3','E3','G3','C3',
          'A3','A3','E3','A3', 'D3','A3','F3','D3',
          'G3','D3','B3','G3', 'C3','D3','G3','G3',
        ],
        melody: [
          'B4','D5','G5','D5', 'B4','G4','A4','B4',
          'E5','G5','B5','G5', 'E5','D5','C5','B4',
          'A4','C5','E5','A5', 'G5','E5','D5','C5',
          'B4','D5','G5','B5', 'A5','G5','D5','G4',
        ],
      },
      {
        // Track 4: Intense — D minor, faster, driving
        bpm: 155,
        bassType: 'square', melodyType: 'sawtooth',
        bassVol: 0.07, melodyVol: 0.05,
        bass: [
          'D3','D3','A3','D3', 'F3','D3','A3','F3',
          'G3','G3','D3','G3', 'B3','G3','D3','B3',
          'C3','C3','G3','C3', 'E3','C3','G3','E3',
          'D3','A3','F3','D3', 'A3','D3','F3','A3',
        ],
        melody: [
          'D5','F5','A5','D5', 'C5','A4','F4','A4',
          'G4','B4','D5','G5', 'F5','D5','B4','G4',
          'C5','E5','G5','C6', 'B5','G5','E5','C5',
          'D5','A5','F5','D5', 'E5','F5','A5','D5',
        ],
      },
    ];
  }

  private scheduleMusic(startAt: number): void {
    if (!this.ctx || !this.musicGain) return;

    // Clear any existing timers
    for (const id of this.musicTimers) {
      clearTimeout(id);
    }
    this.musicTimers = [];

    const tracks = this.getTracks();
    const track = tracks[this.currentTrack % tracks.length];
    const beatDur = 60 / track.bpm;
    const barDur = beatDur * 4;
    const loopDur = barDur * 8;

    // Schedule bass
    for (let i = 0; i < track.bass.length; i++) {
      const noteStart = startAt + i * beatDur;
      const noteDur = beatDur * 0.8;
      this.scheduleMusicNote(track.bassType, freq(track.bass[i]), noteStart, noteDur, track.bassVol);
    }

    // Schedule melody
    for (let i = 0; i < track.melody.length; i++) {
      const noteStart = startAt + i * beatDur;
      const noteDur = beatDur * 0.7;
      this.scheduleMusicNote(track.melodyType, freq(track.melody[i]), noteStart, noteDur, track.melodyVol);
    }

    // Schedule next loop — switch track after N loops
    const msUntilNext = (loopDur - 0.1) * 1000;
    const timerId = window.setTimeout(() => {
      if (this.musicPlaying && !this.musicPaused) {
        this.loopsOnCurrentTrack++;
        if (this.loopsOnCurrentTrack >= this.LOOPS_BEFORE_SWITCH) {
          this.loopsOnCurrentTrack = 0;
          // Pick a random different track
          let next = Math.floor(Math.random() * tracks.length);
          while (next === this.currentTrack && tracks.length > 1) {
            next = Math.floor(Math.random() * tracks.length);
          }
          this.currentTrack = next;
        }
        this.scheduleMusic(startAt + loopDur);
      }
    }, msUntilNext);
    this.musicTimers.push(timerId);
  }

  private scheduleMusicNote(
    type: OscillatorType,
    frequency: number,
    start: number,
    dur: number,
    volume: number,
  ): void {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = frequency;

    // Envelope: quick attack, sustain, quick release
    g.gain.setValueAtTime(0.001, start);
    g.gain.linearRampToValueAtTime(volume, start + 0.01);
    g.gain.setValueAtTime(volume, start + dur - 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);

    o.connect(g);
    g.connect(this.musicGain);
    o.start(start);
    o.stop(start + dur);

    // Track oscillator so we can kill it on pause/stop
    this.musicOscillators.push(o);
    o.onended = () => {
      const idx = this.musicOscillators.indexOf(o);
      if (idx >= 0) this.musicOscillators.splice(idx, 1);
    };
  }

  /** Immediately stop all active music oscillators. */
  private killMusicOscillators(): void {
    const now = this.now();
    for (const o of this.musicOscillators) {
      try { o.stop(now); } catch { /* already stopped */ }
    }
    this.musicOscillators = [];
  }

  stopMusic(_fade = false): void {
    this.musicPlaying = false;
    this.musicPaused = false;
    this.loopsOnCurrentTrack = 0;

    // Clear scheduled timers
    for (const id of this.musicTimers) {
      clearTimeout(id);
    }
    this.musicTimers = [];

    // Kill all active oscillators
    this.killMusicOscillators();

    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(0);
      this.musicGain.gain.value = this.musicVol;
    }
  }

  pauseMusic(): void {
    if (!this.musicPlaying || this.musicPaused) return;
    this.musicPaused = true;

    // Clear scheduled timers
    for (const id of this.musicTimers) {
      clearTimeout(id);
    }
    this.musicTimers = [];

    // Stop all active music oscillators immediately
    this.killMusicOscillators();

    // Reset gain for next resume
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(0);
      this.musicGain.gain.value = 0;
    }
  }

  resumeMusic(): void {
    if (!this.musicPlaying || !this.musicPaused) return;
    this.musicPaused = false;

    // Restore volume immediately before scheduling new notes
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(0);
      this.musicGain.gain.value = this.musicVol;
    }

    // Schedule fresh music (old oscillators were killed on pause)
    this.scheduleMusic(this.now());
  }

  // ---- Volume controls ----

  setMasterVolume(v: number): void {
    this.masterVol = v;
    if (this.masterGain) {
      this.masterGain.gain.value = v;
    }
  }

  setSfxVolume(v: number): void {
    this.sfxVol = v;
    if (this.sfxGain) {
      this.sfxGain.gain.value = v;
    }
  }

  setMusicVolume(v: number): void {
    this.musicVol = v;
    if (this.musicGain) {
      this.musicGain.gain.value = v;
    }
  }

  // ---- Cleanup ----

  dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
  }
}

/** Singleton engine instance shared across the app. */
let _instance: TetrisAudioEngine | null = null;

export function getAudioEngine(): TetrisAudioEngine {
  if (!_instance) {
    _instance = new TetrisAudioEngine();
  }
  return _instance;
}
