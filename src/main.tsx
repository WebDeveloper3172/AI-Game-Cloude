// StrictMode intentionally not used — see comment below
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Note: StrictMode is intentionally disabled for this game project.
// StrictMode double-invokes setState updaters in development, which conflicts
// with the game loop's side effects (randomizer, audio, timers).
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
