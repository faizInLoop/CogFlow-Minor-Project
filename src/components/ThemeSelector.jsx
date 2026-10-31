import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Cloud,
  Coffee,
  Leaf,
  Moon,
  Sparkles,
  Sun,
  Palette,
  Check,
  Flame,
  Umbrella,
  BookOpen
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export const MOOD_THEMES = [
  // ── 🌙 SOOTHING DARK THEMES (Low Glare & Eye-Strain Free) ──
  {
    id: 'dark',
    mode: 'dark',
    label: 'Deep Obsidian',
    shortLabel: 'Obsidian',
    color: '#818cf8',
    description: 'Grounding neutral dark with soft indigo focus.',
    icon: Moon,
    tag: 'Focus'
  },
  {
    id: 'calm',
    mode: 'dark',
    label: 'Calm Ocean',
    shortLabel: 'Calm',
    color: '#38bdf8',
    description: 'Deep pacific oceanic navy easing mental noise.',
    icon: Cloud,
    tag: 'Peace'
  },
  {
    id: 'nature',
    mode: 'dark',
    label: 'Peaceful Sage',
    shortLabel: 'Peaceful',
    color: '#34d399',
    description: 'Restful dark pine & sage. Eye-soothing, not harsh.',
    icon: Leaf,
    tag: 'Harmony'
  },
  {
    id: 'relaxing',
    mode: 'dark',
    label: 'Relaxing Dusk',
    shortLabel: 'Relax',
    color: '#c084fc',
    description: 'Soft twilight dusk ambience for unwinding mental fatigue.',
    icon: Coffee,
    tag: 'Serenity'
  },
  {
    id: 'solar',
    mode: 'dark',
    label: 'Solar Hearth',
    shortLabel: 'Energy',
    color: '#fbbf24',
    description: 'Warm golden amber for cognitive spark & focus.',
    icon: Sun,
    tag: 'Alertness'
  },
  {
    id: 'overwhelmed',
    mode: 'dark',
    label: 'Low Sensory',
    shortLabel: 'Low Glare',
    color: '#94a3b8',
    description: 'Ultra-muted gentle slate to eliminate visual overload.',
    icon: Umbrella,
    tag: 'Reset'
  },

  // ── ☀️ GENTLE BRIGHT THEMES (Eye-Comfort Daylight Study) ──
  {
    id: 'light-zen',
    mode: 'light',
    label: 'Daylight Zen',
    shortLabel: 'Daylight',
    color: '#6366f1',
    description: 'Crisp clean paper white for sharp daytime clarity.',
    icon: Sun,
    tag: 'Daylight'
  },
  {
    id: 'light-sepia',
    mode: 'light',
    label: 'Warm Parchment',
    shortLabel: 'Sepia',
    color: '#d97706',
    description: 'Kindle-style warm sepia paper. Zero blue-light eye strain.',
    icon: BookOpen,
    tag: 'Eye Comfort'
  },
  {
    id: 'light-sage',
    mode: 'light',
    label: 'Morning Mint',
    shortLabel: 'Mint Light',
    color: '#059669',
    description: 'Restful natural celadon daylight. Soothing for retinas.',
    icon: Leaf,
    tag: 'Natural'
  }
];

export default function ThemeSelector({ currentTheme, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'dark', 'light'
  const containerRef = useRef(null);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const activeTheme = MOOD_THEMES.find((t) => t.id === currentTheme) || MOOD_THEMES[0];
  const ActiveIcon = activeTheme.icon;

  const handleSelect = (themeId) => {
    sounds.playClick();
    onChange(themeId);
    setIsOpen(false);
  };

  const visibleThemes = viewMode === 'all' 
    ? MOOD_THEMES 
    : MOOD_THEMES.filter(t => t.mode === viewMode);

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* Minimal Trigger Pill */}
      <button
        type="button"
        onClick={() => { sounds.playClick(); setIsOpen((prev) => !prev); }}
        style={{
          all: 'unset',
          cursor: 'pointer',
          height: 32,
          padding: '0 10px 0 7px',
          borderRadius: 9999,
          border: `1px solid ${isOpen ? activeTheme.color : 'var(--border)'}`,
          background: 'var(--bg-glass)',
          boxShadow: isOpen ? `0 0 12px ${activeTheme.color}30` : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          whiteSpace: 'nowrap'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          color: activeTheme.color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${activeTheme.color}20`,
          flexShrink: 0
        }}>
          <ActiveIcon size={11} />
        </span>

        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {activeTheme.shortLabel}
        </span>

        <ChevronDown
          size={12}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            marginLeft: 1
          }}
        />
      </button>

      {/* Floating Theme Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            maxHeight: 'min(80vh, 480px)',
            overflowY: 'auto',
            padding: '10px',
            borderRadius: 16,
            border: '1px solid var(--border-hover)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.8), 0 0 25px var(--shadow-glow)',
            zIndex: 1000,
            animation: 'fadeInUp 0.16s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header & Mode Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 4px 10px',
            borderBottom: '1px solid var(--border)',
            marginBottom: 8
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Color Therapy
            </span>

            {/* Mode Filter Pills: All / Dark / Bright */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 8 }}>
              {['all', 'dark', 'light'].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: viewMode === m ? 'var(--theme-accent-bg)' : 'transparent',
                    color: viewMode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                    textTransform: 'capitalize'
                  }}
                >
                  {m === 'all' ? 'All' : m === 'dark' ? '🌙 Dark' : '☀️ Bright'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Swatch Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            marginBottom: 8
          }}>
            <Palette size={14} style={{ color: 'var(--text-muted)' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {MOOD_THEMES.map((theme) => {
                const isSelected = theme.id === currentTheme;
                return (
                  <button
                    key={theme.id}
                    title={theme.label}
                    onClick={() => handleSelect(theme.id)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: theme.color,
                      border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: isSelected ? `0 0 10px ${theme.color}` : 'none',
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Theme List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {visibleThemes.map((theme) => {
              const ThemeIcon = theme.icon;
              const isSelected = theme.id === currentTheme;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme.id)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                    borderRadius: 10,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: isSelected ? 'var(--theme-accent-bg)' : 'transparent',
                    border: isSelected ? `1px solid ${theme.color}45` : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <span style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: `${theme.color}22`,
                    border: `1px solid ${theme.color}44`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.color,
                    flexShrink: 0
                  }}>
                    <ThemeIcon size={14} />
                  </span>

                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {theme.label}
                      </span>
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: theme.color,
                        background: `${theme.color}18`,
                        border: `1px solid ${theme.color}35`,
                        padding: '1px 5px',
                        borderRadius: 4
                      }}>
                        {theme.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {theme.description}
                    </div>
                  </div>

                  {isSelected && (
                    <span style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: theme.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
