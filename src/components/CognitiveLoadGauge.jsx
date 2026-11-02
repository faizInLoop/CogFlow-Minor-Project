import { useMemo } from 'react';
import { Activity, Sparkles, AlertTriangle, FastForward } from 'lucide-react';

const STATE_CONFIG = {
  flow: {
    label: 'Flow',
    sublabel: 'Focus & retention synchronized',
    color: '#10b981',
    accentColor: '#34d399',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    bgBadge: 'rgba(16, 185, 129, 0.12)',
    borderBadge: 'rgba(16, 185, 129, 0.28)',
    icon: Sparkles
  },
  overload: {
    label: 'Overload',
    sublabel: 'Simplification recommended',
    color: '#f43f5e',
    accentColor: '#fb7185',
    glowColor: 'rgba(244, 63, 94, 0.25)',
    bgBadge: 'rgba(244, 63, 94, 0.12)',
    borderBadge: 'rgba(244, 63, 94, 0.28)',
    icon: AlertTriangle
  },
  boredom: {
    label: 'Boredom',
    sublabel: 'Challenge tier recommended',
    color: '#f59e0b',
    accentColor: '#fbbf24',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    bgBadge: 'rgba(245, 158, 11, 0.12)',
    borderBadge: 'rgba(245, 158, 11, 0.28)',
    icon: FastForward
  },
  unknown: {
    label: 'Unknown',
    sublabel: 'No reliable state signal yet',
    color: '#94a3b8',
    accentColor: '#cbd5e1',
    glowColor: 'rgba(148, 163, 184, 0.18)',
    bgBadge: 'rgba(148, 163, 184, 0.10)',
    borderBadge: 'rgba(148, 163, 184, 0.24)',
    icon: Activity
  },
};

export default function CognitiveLoadGauge({ state = 'unknown', load = 50, source = 'camera' }) {
  const config = STATE_CONFIG[state] || STATE_CONFIG.unknown;
  const StateIcon = config.icon;

  // Arc calculation (180 degree semi-circle)
  const radius = 68;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = useMemo(() => {
    const clampedLoad = Math.min(100, Math.max(0, load));
    return circumference - (clampedLoad / 100) * circumference;
  }, [load, circumference]);

  return (
    <div style={{
      background: 'var(--gradient-card)',
      border: `1px solid ${config.borderBadge}`,
      borderRadius: 'var(--radius-xl)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 30px ${config.glowColor}`,
      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Activity size={14} style={{ color: config.color }} />
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>
            Class score
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: config.bgBadge,
          border: `1px solid ${config.borderBadge}`,
          fontSize: 11,
          fontWeight: 700,
          color: config.accentColor
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
          LIVE
        </div>
      </div>

      {/* Modern SVG Arc Gauge */}
      <div style={{ position: 'relative', width: '100%', height: 110, display: 'flex', justifyContent: 'center' }}>
        <svg width="200" height="110" viewBox="0 0 200 110" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Filled Arc */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            filter="url(#gaugeGlow)"
          />
        </svg>

        {/* Center Readout */}
        <div style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 34,
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            color: '#ffffff',
            lineHeight: 1,
            letterSpacing: '-0.03em'
          }}>
            {source === 'camera' ? (
              <>
                {load}
                <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>%</span>
              </>
            ) : '—'}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
            {source === 'camera' ? 'Model score' : 'Behaviour only, low confidence'}
          </div>
        </div>
      </div>

      {/* State Badge Card */}
      <div style={{
        marginTop: 14,
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: config.bgBadge,
          border: `1px solid ${config.borderBadge}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: config.color,
          flexShrink: 0
        }}>
          <StateIcon size={16} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: config.accentColor, lineHeight: 1.2 }}>
            {config.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {config.sublabel}
          </div>
        </div>
      </div>
    </div>
  );
}
