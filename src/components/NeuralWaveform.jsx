import { useState, useEffect, useRef } from 'react';
import { Activity, Zap, Cpu, Sparkles } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const BANDS = {
  alpha: {
    name: 'Alpha Band',
    hz: '8 - 12 Hz',
    state: 'Optimal Flow State',
    desc: 'Synaptic balance, continuous reading retention, high comprehension.',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    freqMult: 1.0,
    noiseAmp: 6,
    baseAmp: 24,
  },
  beta: {
    name: 'Beta Band',
    hz: '13 - 30 Hz',
    state: 'Active Synthesis',
    desc: 'Active analytical thought, parsing complex syntactic structures.',
    color: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.4)',
    freqMult: 2.2,
    noiseAmp: 10,
    baseAmp: 20,
  },
  gamma: {
    name: 'Gamma Band',
    hz: '30 - 80 Hz',
    state: 'Cognitive Overload',
    desc: 'Intense neural binding, working memory saturation, elevated AU4 furrow.',
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    freqMult: 4.5,
    noiseAmp: 16,
    baseAmp: 28,
  },
  theta: {
    name: 'Theta Band',
    hz: '4 - 8 Hz',
    state: 'Drift & Boredom',
    desc: 'Sub-optimal cognitive engagement, rapid cursor velocity, low retention.',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    freqMult: 0.5,
    noiseAmp: 4,
    baseAmp: 16,
  },
};

export default function NeuralWaveform({ defaultBand = 'alpha' }) {
  const [activeBand, setActiveBand] = useState(defaultBand);
  const [fps, setFps] = useState(60);
  const [amplitude, setAmplitude] = useState(72.4);
  const canvasRef = useRef(null);
  const bandRef = useRef(BANDS[defaultBand]);

  useEffect(() => {
    bandRef.current = BANDS[activeBand];
  }, [activeBand]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;
    let lastTime = performance.now();
    let frameCount = 0;

    const render = (now) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      const W = (canvas.width = canvas.offsetWidth);
      const H = (canvas.height = canvas.offsetHeight);
      ctx.clearRect(0, 0, W, H);

      const band = bandRef.current;
      const centerY = H / 2;

      // Draw faint oscilloscope grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = 15; y < H; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let x = 0; x < W; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Draw Wave Path
      ctx.beginPath();
      ctx.strokeStyle = band.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = band.glow;
      ctx.shadowBlur = 12;

      for (let x = 0; x < W; x++) {
        const normX = x / W;
        // Window envelope to taper edges smoothly
        const envelope = Math.sin(normX * Math.PI);
        // Primary frequency + harmonic + noise jitter
        const freq1 = Math.sin((x * 0.03 * band.freqMult) + t * 4);
        const freq2 = Math.cos((x * 0.06 * band.freqMult) - t * 2.5) * 0.5;
        const noise = (Math.sin(x * 0.2 + t * 8) * band.noiseAmp * 0.2);

        const y = centerY + (freq1 * band.baseAmp + freq2 * (band.baseAmp * 0.5) + noise) * envelope;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Subtle fill gradient under wave
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      const grad = ctx.createLinearGradient(0, centerY, 0, H);
      grad.addColorStop(0, `${band.color}18`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      t += 0.03;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const selectBand = (key) => {
    sounds.playClick();
    setActiveBand(key);
    setAmplitude(Number((Math.random() * 20 + 60).toFixed(1)));
  };

  const curr = BANDS[activeBand];

  return (
    <div style={{
      background: 'rgba(10, 14, 26, 0.75)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Telemetry Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: `${curr.color}18`,
            border: `1px solid ${curr.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity size={16} color={curr.color} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Neural Telemetry Stream</span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: `${curr.color}20`, color: curr.color, border: `1px solid ${curr.color}40` }}>
                {curr.state}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              BiLSTM Real-Time Hidden State Dynamics
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Oscillation</div>
            <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: curr.color }}>{curr.hz}</div>
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Latency</div>
            <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#c7d2fe' }}>24.2 ms</div>
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Inference</div>
            <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34d399' }}>{fps} FPS</div>
          </div>
        </div>
      </div>

      {/* Canvas Oscilloscope Display */}
      <div style={{
        position: 'relative',
        height: 140,
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        marginBottom: 16,
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Floating watermark badge */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em'
        }}>
          MEDIA-PIPE · 478 LANDMARKS
        </div>
      </div>

      {/* Band Selector Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {Object.entries(BANDS).map(([key, b]) => {
          const isSelected = activeBand === key;
          return (
            <button
              key={key}
              onClick={() => selectBand(key)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 8,
                background: isSelected ? `${b.color}18` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? `${b.color}60` : 'var(--border)'}`,
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: isSelected ? b.color : 'var(--text-secondary)' }}>
                  {b.name}
                </span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.color, opacity: isSelected ? 1 : 0.4 }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {b.hz} · {b.state}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

