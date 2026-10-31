import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { 
  Brain, Cpu, User, ArrowRight, Volume2, VolumeX, Activity, 
  Sparkles, BookOpen, Layers, Compass, Zap
} from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { sounds } from '../utils/soundEffects';

export default function Navbar({ currentStep = 0, session = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [muted, setMuted] = useState(sounds.isMuted());
  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      return localStorage.getItem('cogflow_mood_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.setAttribute('data-therapy-theme', activeTheme);
    document.body.setAttribute('data-theme', activeTheme);
    document.body.setAttribute('data-therapy-theme', activeTheme);
    try {
      localStorage.setItem('cogflow_mood_theme', activeTheme);
    } catch {}
    window.dispatchEvent(new CustomEvent('cogflow-theme-change', { detail: { theme: activeTheme } }));
  }, [activeTheme]);

  const handleSelectTheme = (themeId) => {
    setActiveTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.setAttribute('data-therapy-theme', themeId);
    document.body.setAttribute('data-theme', themeId);
    document.body.setAttribute('data-therapy-theme', themeId);
    try {
      localStorage.setItem('cogflow_mood_theme', themeId);
    } catch {}
    window.dispatchEvent(new CustomEvent('cogflow-theme-change', { detail: { theme: themeId } }));
  };

  const handleToggleSound = () => {
    const isNowMuted = sounds.toggleMute();
    setMuted(isNowMuted);
  };

  const navItemClick = () => {
    sounds.playClick();
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CF';

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      transition: 'background-color 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease'
    }}>
      <div style={{
        maxWidth: 1360, margin: '0 auto', padding: '0 20px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
      }}>
        {/* Left: Refined Minimal Brand */}
        <Link
          to="/"
          onClick={navItemClick}
          style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
            transition: 'opacity 0.2s ease', flexShrink: 0
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'var(--theme-accent-bg)',
            border: '1px solid var(--theme-accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px var(--theme-accent-bg)',
            flexShrink: 0,
            transition: 'all 0.35s ease'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M2 12h3l2.5-6 3.5 12 3-8 2 5 2-3h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-accent, #818cf8)' }} />
            </svg>
          </div>

          <span style={{
            fontSize: 18, fontWeight: 900, fontFamily: 'Space Grotesk, -apple-system, sans-serif',
            letterSpacing: '-0.03em', color: 'var(--text-primary)', whiteSpace: 'nowrap'
          }}>
            CogFlow
          </span>
        </Link>

        {/* Center: Sleek Single-Line Navigation or Live Session HUD */}
        {session ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--bg-glass)', border: '1px solid var(--border-hover)',
            borderRadius: 99, padding: '4px 14px',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            transition: 'all 0.35s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: session.state === 'flow' ? '#10b981' : session.state === 'overload' ? '#f43f5e' : '#f59e0b',
                boxShadow: `0 0 8px ${session.state === 'flow' ? '#10b981' : session.state === 'overload' ? '#f43f5e' : '#f59e0b'}`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
                {session.state}
              </span>
            </div>
            <span style={{ width: 1, height: 12, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--theme-accent, #818cf8)' }}>
              {session.time}
            </span>
          </div>
        ) : (
          <nav className="hide-mobile" style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
            padding: '3px 5px', borderRadius: 99,
            transition: 'all 0.35s ease'
          }}>
            <Link
              to="/"
              onClick={navItemClick}
              style={{
                textDecoration: 'none', fontSize: 12.5, fontWeight: 600,
                color: isActive('/') ? '#ffffff' : 'var(--text-secondary)',
                background: isActive('/') ? 'var(--theme-accent-bg)' : 'transparent',
                border: isActive('/') ? '1px solid var(--theme-accent-border)' : '1px solid transparent',
                padding: '5px 14px', borderRadius: 99,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              Overview
            </Link>

            <Link
              to="/subjects"
              onClick={navItemClick}
              style={{
                textDecoration: 'none', fontSize: 12.5, fontWeight: 600,
                color: isActive('/subjects') || isActive('/choose-path') ? '#ffffff' : 'var(--text-secondary)',
                background: isActive('/subjects') || isActive('/choose-path') ? 'var(--theme-accent-bg)' : 'transparent',
                border: isActive('/subjects') || isActive('/choose-path') ? '1px solid var(--theme-accent-border)' : '1px solid transparent',
                padding: '5px 14px', borderRadius: 99,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              Curriculum
            </Link>

            <Link
              to="/learn"
              onClick={navItemClick}
              style={{
                textDecoration: 'none', fontSize: 12.5, fontWeight: 600,
                color: isActive('/learn') ? '#ffffff' : 'var(--text-secondary)',
                background: isActive('/learn') ? 'var(--theme-accent-bg)' : 'transparent',
                border: isActive('/learn') ? '1px solid var(--theme-accent-border)' : '1px solid transparent',
                padding: '5px 14px', borderRadius: 99,
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 5,
                whiteSpace: 'nowrap'
              }}
            >
              <Zap size={12} style={{ color: 'var(--theme-accent, #818cf8)' }} />
              Adaptive Cockpit
            </Link>
          </nav>
        )}

        {/* Right: Consolidated Controls (Theme + Status + Sound + Profile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

          {/* Theme Dropdown */}
          <ThemeSelector currentTheme={activeTheme} onChange={handleSelectTheme} />

          {/* Qwen AI Micro Status Pill */}
          <div className="hide-mobile" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.22)',
            padding: '4px 9px', borderRadius: 99,
            fontSize: 11, fontWeight: 700, color: '#34d399',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: '#34d399',
              boxShadow: '0 0 6px #34d399', animation: 'pulseGlow 2s infinite ease-in-out'
            }} />
            Qwen 2.5
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            title={muted ? 'Enable UI Audio Feedback' : 'Mute UI Audio'}
            style={{
              all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 8,
              background: 'var(--bg-glass)', border: '1px solid var(--border)',
              color: muted ? 'var(--text-muted)' : 'var(--theme-accent, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Compact User Profile Button */}
          <Link
            to="/profile"
            onClick={navItemClick}
            title="Learner Profile"
            style={{
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--bg-glass)', border: '1px solid var(--border)',
              padding: '3px 9px 3px 4px', borderRadius: 20,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--theme-accent-border)';
              e.currentTarget.style.background = 'var(--bg-card-hover)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--bg-glass)';
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--gradient-brand)',
              border: '1px solid var(--theme-accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 900, color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif'
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0] || 'Learner'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
