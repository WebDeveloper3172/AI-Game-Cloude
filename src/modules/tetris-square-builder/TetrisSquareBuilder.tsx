/**
 * Square Builder module entry. Manages internal screens (world select →
 * level select → play → result) without changing the app router.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../tetris-classic/hooks/useLocalStorage';
import { LevelSelect } from './components/LevelSelect';
import { PauseOverlay } from './components/PauseOverlay';
import { PieceTray } from './components/PieceTray';
import { ResultScreen } from './components/ResultScreen';
import { TargetSquare } from './components/TargetSquare';
import { TopBar } from './components/TopBar';
import { TutorialOverlay } from './components/TutorialOverlay';
import { WorldSelect } from './components/WorldSelect';
import { getLevelById, getLevelsByWorld, WORLDS } from './engine/levels';
import type { LevelProgress } from './engine/types';
import { usePlayController } from './hooks/usePlayController';
import { useSquareBuilderSave } from './hooks/useSquareBuilderSave';
import { useTetrisSquareBuilderAudio } from './hooks/useTetrisSquareBuilderAudio';
import './styles/TetrisSquareBuilder.css';

type Screen = 'world-select' | 'level-select' | 'play';

export default function TetrisSquareBuilder() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const audio = useTetrisSquareBuilderAudio(settings);
  const { save, recordLevelResult, markTutorialShown, isWorldUnlocked, unlockWorld } = useSquareBuilderSave();

  const [screen, setScreen] = useState<Screen>('world-select');
  const [activeWorldId, setActiveWorldId] = useState<number>(1);
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [resultOutcome, setResultOutcome] = useState<'complete' | 'timeup' | null>(null);
  const [resultStars, setResultStars] = useState(0);
  const [caption, setCaption] = useState<string>('');
  const [urgentCaption, setUrgentCaption] = useState<string>('');

  const fallbackLevel = useMemo(() => getLevelById(1)!, []);
  const activeLevel = useMemo(
    () => (activeLevelId != null ? getLevelById(activeLevelId) ?? fallbackLevel : fallbackLevel),
    [activeLevelId, fallbackLevel],
  );

  const onComplete = useCallback((result: LevelProgress) => {
    audio.playLevelComplete(result.stars);
    const captionKey = result.stars >= 3 ? 'completePerfect' : result.stars === 2 ? 'completeGreat' : 'completeGood';
    setUrgentCaption(audio.getCaption(captionKey));
    audio.speak(captionKey);
    recordLevelResult(result);
    const world1Levels = getLevelsByWorld(1);
    const earned = world1Levels.reduce((sum, l) => sum + (save.progress[l.id]?.stars ?? 0), 0)
      + result.stars - (save.progress[result.levelId]?.stars ?? 0);
    const w2 = WORLDS.find(w => w.id === 2);
    if (w2 && earned >= w2.unlockRequirement.minStars && !isWorldUnlocked(2)) {
      unlockWorld(2);
    }
    setResultOutcome('complete');
    setResultStars(result.stars);
  }, [audio, recordLevelResult, save.progress, isWorldUnlocked, unlockWorld]);

  const onTimeUp = useCallback(() => {
    audio.playTimeUp();
    setUrgentCaption(audio.getCaption('timeUp'));
    audio.speak('timeUp');
    setResultOutcome('timeup');
    setResultStars(0);
  }, [audio]);

  const onInactivityHint = useCallback(() => {
    setCaption(audio.getCaption('hintInactivity'));
    audio.speak('hintInactivity');
  }, [audio]);

  const controller = usePlayController({
    level: activeLevelId != null ? activeLevel : fallbackLevel,
    paused: paused || screen !== 'play' || resultOutcome !== null,
    onComplete,
    onTimeUp,
    onInactivityHint,
  });

  // Audio bootstrap: try on mount (works if user already interacted in MainMenu),
  // and re-arm on first click in this module to satisfy strict autoplay policies.
  useEffect(() => {
    audio.initOnInteraction();
    audio.startMusic();
    let armed = false;
    const onFirstClick = () => {
      if (armed) return;
      armed = true;
      audio.initOnInteraction();
      audio.startMusic();
      window.removeEventListener('pointerdown', onFirstClick);
    };
    window.addEventListener('pointerdown', onFirstClick);
    return () => window.removeEventListener('pointerdown', onFirstClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Time-low warning
  const lowWarnedRef = useRef(false);
  useEffect(() => {
    if (paused) return;
    const t = controller.state.timeRemainingMs;
    if (t > 0 && t <= 15000 && !lowWarnedRef.current) {
      lowWarnedRef.current = true;
      audio.playTimeLow();
      setCaption(audio.getCaption('timeLow'));
    }
    if (t > 15000 && lowWarnedRef.current) {
      lowWarnedRef.current = false;
    }
  }, [controller.state.timeRemainingMs, paused, audio]);

  // Tutorial gating
  useEffect(() => {
    if (screen === 'play' && !save.tutorialShown) {
      setShowTutorial(true);
    }
  }, [screen, save.tutorialShown]);

  const handlePickWorld = (worldId: number) => {
    setActiveWorldId(worldId);
    setScreen('level-select');
  };

  const handlePickLevel = (levelId: number) => {
    setActiveLevelId(levelId);
    setResultOutcome(null);
    setResultStars(0);
    setPaused(false);
    setScreen('play');
    audio.speak(save.tutorialShown ? 'welcomeReturning' : 'welcomeFirstTime');
  };

  const handleNext = () => {
    if (activeLevelId == null) return;
    const levelsInWorld = getLevelsByWorld(activeLevel.worldId);
    const idx = levelsInWorld.findIndex(l => l.id === activeLevel.id);
    const next = levelsInWorld[idx + 1];
    if (next) {
      handlePickLevel(next.id);
    } else {
      setScreen('level-select');
      setResultOutcome(null);
    }
  };

  const handleRetry = () => {
    setResultOutcome(null);
    setResultStars(0);
    controller.reset();
  };

  const handleBackToLevels = () => {
    setScreen('level-select');
    setResultOutcome(null);
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    markTutorialShown();
  };

  // Auto-clear ARIA captions
  useEffect(() => {
    if (!caption) return;
    const id = window.setTimeout(() => setCaption(''), 3000);
    return () => window.clearTimeout(id);
  }, [caption]);

  useEffect(() => {
    if (!urgentCaption) return;
    const id = window.setTimeout(() => setUrgentCaption(''), 4000);
    return () => window.clearTimeout(id);
  }, [urgentCaption]);

  const placedPieceTypes = useMemo(() => {
    const m: Record<number, string> = {};
    for (const p of controller.state.placed) m[p.sequence] = p.type;
    return m;
  }, [controller.state.placed]);

  const selectedPiece = controller.state.selectedTrayPieceId
    ? controller.state.tray.find(p => p.id === controller.state.selectedTrayPieceId) ?? null
    : null;

  if (screen === 'world-select') {
    return (
      <div className="sb-root">
        <WorldSelect
          unlockedIds={save.unlockedWorlds}
          totalStars={save.totalStars}
          onPick={handlePickWorld}
          onBack={() => navigate('/')}
        />
      </div>
    );
  }

  if (screen === 'level-select') {
    return (
      <div className="sb-root">
        <LevelSelect
          worldId={activeWorldId}
          progress={save.progress}
          onPick={handlePickLevel}
          onBack={() => setScreen('world-select')}
        />
      </div>
    );
  }

  if (activeLevelId == null) return null;
  const levelsInWorld = getLevelsByWorld(activeLevel.worldId);
  const idx = levelsInWorld.findIndex(l => l.id === activeLevel.id);
  const hasNext = idx >= 0 && idx < levelsInWorld.length - 1;

  return (
    <div className="sb-root sb-play-root">
      <div aria-live="polite" aria-atomic="true" className="sb-aria-live">
        {caption}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sb-aria-live">
        {urgentCaption}
      </div>

      <TopBar
        levelName={activeLevel.name}
        timeRemainingMs={controller.state.timeRemainingMs}
        totalTimeMs={activeLevel.timerSeconds * 1000}
        undosUsed={controller.state.undosUsed}
        canUndo={controller.state.placed.length > 0}
        onUndo={() => controller.undo()}
        onHint={() => controller.requestHint()}
        onPause={() => setPaused(true)}
      />

      <div className="sb-play-area">
        <TargetSquare
          grid={controller.state.grid}
          selectedPiece={selectedPiece}
          placedPieceTypes={placedPieceTypes}
          onPlace={pos => controller.place(pos)}
        />
      </div>

      <PieceTray
        tray={controller.state.tray}
        selectedId={controller.state.selectedTrayPieceId}
        onSelect={id => controller.selectTrayPiece(id)}
        onRotate={() => controller.rotateSelectedPiece()}
      />

      {paused && (
        <PauseOverlay
          onResume={() => setPaused(false)}
          onRestart={() => {
            setPaused(false);
            controller.reset();
          }}
          onMenu={() => {
            setPaused(false);
            setScreen('level-select');
          }}
        />
      )}

      {resultOutcome && (
        <ResultScreen
          outcome={resultOutcome}
          stars={resultStars}
          levelName={activeLevel.name}
          hasNext={hasNext && resultOutcome === 'complete'}
          onRetry={handleRetry}
          onNext={handleNext}
          onMenu={handleBackToLevels}
        />
      )}

      {showTutorial && <TutorialOverlay onClose={handleCloseTutorial} />}
    </div>
  );
}
