import { Brain, User, TrendingDown, TrendingUp, Clock } from 'lucide-react';

const TIER_COLORS = {
  tier1: '#34d399', // emerald — simplified
  tier3: '#818cf8', // indigo  — standard
  tier5: '#fbbf24', // amber   — expert
};

const TIER_LABELS = {
  tier1: 'Simplified',
  tier3: 'Standard',
  tier5: 'Expert',
};

export default function SessionTimeline({ adaptationLog = [], totalSeconds = 0 }) {
  if (totalSeconds < 5) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '16px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} style={{ color: 'var(--indigo-light)' }} />
          Cognitive Adaptation Timeline
        </div>
        <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          Timeline synthesizes as you read…
        </div>
      </div>
    );
  }

  // Build segments: each segment represents a period at a given tier
  const segments = [];
  let prevTier = 'tier3'; // start at Standard
  let prevTime = 0;

  adaptationLog.forEach((entry) => {
    segments.push({ tier: prevTier, from: prevTime, to: entry.time });
    prevTier = entry.to;
    prevTime = entry.time;
  });
  // Final segment (current tier to now)
  segments.push({ tier: prevTier, from: prevTime, to: totalSeconds });

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', padding: '16px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} style={{ color: 'var(--indigo-light)' }} />
          Adaptation Timeline
        </span>
        <span style={{ fontSize: 10, color: 'var(--indigo-light)', fontWeight: 700 }}>
          {adaptationLog.length} {adaptationLog.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Bar */}
      <div style={{
        height: 12, background: 'rgba(255,255,255,0.04)',
        borderRadius: 99, overflow: 'hidden',
        display: 'flex', marginBottom: 10,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
      }}>
        {segments.map((seg, i) => {
          const width = Math.max(3, ((seg.to - seg.from) / totalSeconds) * 100);
          const color = TIER_COLORS[seg.tier] || '#818cf8';
          return (
            <div
              key={i}
              title={`${TIER_LABELS[seg.tier] || seg.tier} (${Math.floor(seg.from / 60)}:${(seg.from % 60).toString().padStart(2, '0')})`}
              style={{
                width: `${width}%`,
                background: color,
                borderRight: i < segments.length - 1 ? '1px solid rgba(0,0,0,0.5)' : 'none',
                transition: 'width 0.4s ease',
                boxShadow: `0 0 8px ${color}40`,
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}80` }} />
            {TIER_LABELS[tier]}
          </div>
        ))}
      </div>

      {/* Change log */}
      {adaptationLog.length > 0 ? (
        <div style={{ maxHeight: 110, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.2) transparent', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {adaptationLog.slice().reverse().map((entry, i) => {
            const isSimpler = entry.reason?.includes('simpler');
            const isHarder = entry.reason?.includes('harder');
            const isAi = entry.reason?.includes('ai');
            const toColor = TIER_COLORS[entry.to] || '#818cf8';

            return (
              <div key={i} style={{
                fontSize: 11, color: 'var(--text-muted)', padding: '4px 6px',
                borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, '0')}
                </span>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
                  fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                  background: isAi ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                  color: isAi ? 'var(--indigo-light)' : 'var(--text-secondary)'
                }}>
                  {isAi ? <Brain size={10} /> : <User size={10} />}
                  {isSimpler ? <TrendingDown size={10} color="#34d399" /> : isHarder ? <TrendingUp size={10} color="#fbbf24" /> : null}
                </span>

                <span style={{ color: toColor, fontWeight: 700, fontSize: 11, marginLeft: 'auto' }}>
                  {entry.toLabel || TIER_LABELS[entry.to] || entry.to}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
          No adaptations triggered yet
        </div>
      )}
    </div>
  );
}
