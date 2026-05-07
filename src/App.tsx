import { Routes, Route } from 'react-router-dom'
import { MainMenu } from './components/MainMenu'
import { SettingsPanel } from './components/SettingsPanel'
import { lazy, Suspense } from 'react'

const TetrisClassic = lazy(() => import('./modules/tetris-classic/TetrisClassic'))
const Leaderboard = lazy(() => import('./components/LeaderboardPage'))

function App() {
  return (
    <div className="app-root">
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/tetris-classic" element={<TetrisClassic />} />
          <Route path="/settings" element={<SettingsPanel />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
