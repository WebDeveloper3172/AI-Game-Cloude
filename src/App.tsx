import { Routes, Route } from 'react-router-dom'
import { MainMenu } from './components/MainMenu'
import { SettingsPanel } from './components/SettingsPanel'
import { lazy, Suspense, useEffect } from 'react'
import { useSettings } from './modules/tetris-classic/hooks/useLocalStorage'

const TetrisClassic = lazy(() => import('./modules/tetris-classic/TetrisClassic'))
const TetrisSquareBuilder = lazy(() => import('./modules/tetris-square-builder/TetrisSquareBuilder'))
const Leaderboard = lazy(() => import('./components/LeaderboardPage'))

function App() {
  const { settings } = useSettings();
  const theme = settings.theme || 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-root" data-theme={theme}>
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/tetris-classic" element={<TetrisClassic />} />
          <Route path="/tetris-square-builder" element={<TetrisSquareBuilder />} />
          <Route path="/settings" element={<SettingsPanel />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
