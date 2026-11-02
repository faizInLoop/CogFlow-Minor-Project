import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './atlas.css'
import App from './App.jsx'
import { normalizeTheme } from './theme.js'

try {
  const savedTheme = normalizeTheme(localStorage.getItem('cogflow_mood_theme'));
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-therapy-theme', savedTheme);
  document.body.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-therapy-theme', savedTheme);
  localStorage.setItem('cogflow_mood_theme', savedTheme);
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
