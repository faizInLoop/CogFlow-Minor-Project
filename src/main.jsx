import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Immediately initialize theme on root before first paint
try {
  const savedTheme = localStorage.getItem('cogflow_mood_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-therapy-theme', savedTheme);
  document.body.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-therapy-theme', savedTheme);
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
