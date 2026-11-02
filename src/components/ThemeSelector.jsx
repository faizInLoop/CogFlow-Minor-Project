import { Moon, Sun } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const MODES = [
  { id: 'bright', label: 'Bright', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
];

export default function ThemeSelector({ currentTheme, onChange }) {
  const active = currentTheme === 'dark' ? 'dark' : 'bright';

  return (
    <div
      role="group"
      aria-label="Appearance"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      {MODES.map((mode) => {
        const selected = active === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              if (selected) return;
              sounds.playClick();
              onChange(mode.id);
            }}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: selected ? 700 : 500,
              color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
              background: selected ? 'var(--theme-accent-bg)' : 'transparent',
              border: selected ? '1px solid var(--theme-accent-border)' : '1px solid transparent',
            }}
          >
            <Icon size={12} />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
