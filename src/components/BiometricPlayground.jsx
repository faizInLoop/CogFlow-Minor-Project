import { useState, useMemo } from 'react';
import { Sliders, Brain, Activity, Sparkles, Check, ArrowRight, Eye, MousePointer } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const PREVIEW_CONTENT = {
  tier1: {
    tier: 'Tier 1 · Simplified',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    title: 'Core Intuition (Bullet Points & Visual Analogies)',
    body: [
      '• Think of a neural network like a team of specialized detectives.',
      '• Each layer looks for simple clues (edges, corners, textures).',
      '• Higher layers combine clues to recognize complex concepts like a face or a sentence.',
      '• Key Takeaway: Break big problems into simpler sequential decisions.'
    ]
  },
  tier3: {
    tier: 'Tier 3 · Standard',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.12)',
    title: 'Formal Architectural Analysis',
    body: [
      'Recurrent neural architectures process sequential input tokens by preserving a hidden state vector h_t across time steps.',
      'Through backpropagation through time (BPTT), gradients update weight matrices W_xh and W_hh to model short-term contextual dependencies.',
      'Standard formulation: h_t = tanh(W_xh * x_t + W_hh * h_{t-1} + b_h).'
    ]
  },
  tier5: {
    tier: 'Tier 5 · Expert Depth',
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Mathematical Rigor & Asymptotics',
    body: [
      'Vanishing and exploding gradients occur when the spectral radius of W_hh exceeds or falls strictly below unity.',
      'BiLSTM mitigates this using constant error carousels (CEC) governed by affine gates: f_t = σ(W_f [h_{t-1}, x_t] + b_f).',
      'The forward-backward hidden passes yield an aggregate feature space dim(H) = 2 × d_h with temporal attention alignment.'
    ]
  }
};

export default function BiometricPlayground() {
  const [browFurrow, setBrowFurrow] = useState(0.15); // 0 to 1
  const [blinkRate, setBlinkRate] = useState(22);     // 10 to 60
  const [eyelidSquint, setEyelidSquint] = useState(0.35); // 0 to 1
  const [mouseVelocity, setMouseVelocity] = useState(35); // 0 to 100

  // Calculate simulated BiLSTM outputs
  const { state, loadScore, probs, tierKey } = useMemo(() => {
    // Overload factors: high brow furrow, high squint, high blink, slow mouse
    const overloadScore = (browFurrow * 45) + (eyelidSquint * 30) + ((blinkRate / 60) * 15) + (mouseVelocity < 20 ? 10 : 0);
    // Boredom factors: fast chaotic mouse, low brow, low squint, very low blink
    const boredomScore = (mouseVelocity > 60 ? (mouseVelocity - 60) * 1.5 : 0) + ((1 - browFurrow) * 20) + ((1 - eyelidSquint) * 15);

    let calculatedState = 'Flow';
    let load = 50;
    let tier = 'tier3';

    if (overloadScore > 50) {
      calculatedState = 'Overload';
      load = Math.min(95, Math.round(50 + (overloadScore - 50) * 0.9));
      tier = 'tier1';
    } else if (boredomScore > 35) {
      calculatedState = 'Boredom';
      load = Math.max(12, Math.round(50 - (boredomScore - 35) * 1.1));
      tier = 'tier5';
    } else {
      calculatedState = 'Flow';
      load = Math.round(42 + (browFurrow * 15));
      tier = 'tier3';
    }

    // Normalized probabilities
    const sum = overloadScore + boredomScore + 40;
    const pOverload = Number((overloadScore / sum).toFixed(2));
    const pBoredom = Number((boredomScore / sum).toFixed(2));
    const pFlow = Number((1 - pOverload - pBoredom).toFixed(2));

    return {
      state: calculatedState,
      loadScore: load,
      probs: { flow: Math.max(0.05, pFlow), overload: Math.max(0.05, pOverload), boredom: Math.max(0.05, pBoredom) },
      tierKey: tier
    };
  }, [browFurrow, blinkRate, eyelidSquint, mouseVelocity]);

  const setPreset = (type) => {
    sounds.playClick();
    if (type === 'flow') {
      setBrowFurrow(0.12);
      setBlinkRate(18);
      setEyelidSquint(0.32);
      setMouseVelocity(32);
    } else if (type === 'overload') {
      setBrowFurrow(0.85);
      setBlinkRate(48);
      setEyelidSquint(0.78);
      setMouseVelocity(12);
    } else if (type === 'boredom') {
      setBrowFurrow(0.02);
      setBlinkRate(12);
      setEyelidSquint(0.10);
      setMouseVelocity(88);
    }
  };

  const preview = PREVIEW_CONTENT[tierKey];

  return (
    <div style={{
      background: 'rgba(10, 14, 26, 0.75)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '32px',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--indigo-light)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={13} />
            Interactive Neural Telemetry Engine
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
            Live DAiSEE expression model
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 540 }}>
            Drag the facial tension and interaction telemetry sliders below to watch the inference model recalculate cognitive load and rewrite curriculum depth.
          </p>
        </div>

        {/* Quick Demo Emulation Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPreset('flow')}
            style={{
              all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 8,
              fontSize: 11, fontWeight: 700,
              background: state === 'Flow' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.03)',
              color: state === 'Flow' ? '#34d399' : 'var(--text-muted)',
              border: `1px solid ${state === 'Flow' ? 'rgba(52,211,153,0.4)' : 'var(--border)'}`,
              transition: 'var(--transition)'
            }}
          >
            Flow Preset
          </button>
          <button
            onClick={() => setPreset('overload')}
            style={{
              all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 8,
              fontSize: 11, fontWeight: 700,
              background: state === 'Overload' ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.03)',
              color: state === 'Overload' ? '#fda4af' : 'var(--text-muted)',
              border: `1px solid ${state === 'Overload' ? 'rgba(244,63,94,0.4)' : 'var(--border)'}`,
              transition: 'var(--transition)'
            }}
          >
            Overload Preset
          </button>
          <button
            onClick={() => setPreset('boredom')}
            style={{
              all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 8,
              fontSize: 11, fontWeight: 700,
              background: state === 'Boredom' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.03)',
              color: state === 'Boredom' ? '#fcd34d' : 'var(--text-muted)',
              border: `1px solid ${state === 'Boredom' ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
              transition: 'var(--transition)'
            }}
          >
            Boredom Preset
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Left: Interactive Telemetry Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Slider 1: AU4 Brow Tension */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={13} color="var(--indigo-light)" />
                AU4 Brow Furrow Tension
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--indigo-light)' }}>
                {browFurrow.toFixed(2)}
              </span>
            </div>
            <input
              type="range" min="0" max="1" step="0.01" value={browFurrow}
              onChange={e => setBrowFurrow(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--indigo-light)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Relaxed (0.0)</span>
              <span>Intense Furrow (1.0)</span>
            </div>
          </div>

          {/* Slider 2: Blink Cadence */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={13} color="#34d399" />
                Blink Cadence
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34d399' }}>
                {blinkRate} / min
              </span>
            </div>
            <input
              type="range" min="10" max="60" step="1" value={blinkRate}
              onChange={e => setBlinkRate(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Resting (12)</span>
              <span>Stress Rapid (60)</span>
            </div>
          </div>

          {/* Slider 3: Mouse Dynamics */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MousePointer size={13} color="#fbbf24" />
                Pointer Interaction Speed
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#fbbf24' }}>
                {mouseVelocity} px/s
              </span>
            </div>
            <input
              type="range" min="5" max="100" step="1" value={mouseVelocity}
              onChange={e => setMouseVelocity(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Slow Pausing (5)</span>
              <span>Erratic Skimming (100)</span>
            </div>
          </div>
        </div>

        {/* Right: Neural Inferred Output & Adaptive Rewriting */}
        <div style={{
          background: 'rgba(7,9,14,0.6)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Real-time State & Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                  Inferred Cognitive State
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: preview.color, fontFamily: 'Space Grotesk, sans-serif', marginTop: 2 }}>
                  {state} ({loadScore}%)
                </div>
              </div>

              <div style={{
                padding: '4px 12px', borderRadius: 8,
                background: preview.bg, border: `1px solid ${preview.color}40`,
                fontSize: 11, fontWeight: 800, color: preview.color
              }}>
                Target: {preview.tier}
              </div>
            </div>

            {/* Neural Probability Distribution Bars */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span style={{ color: '#34d399' }}>Flow: {Math.round(probs.flow * 100)}%</span>
                <span style={{ color: '#f43f5e' }}>Overload: {Math.round(probs.overload * 100)}%</span>
                <span style={{ color: '#fbbf24' }}>Boredom: {Math.round(probs.boredom * 100)}%</span>
              </div>
              <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ width: `${probs.flow * 100}%`, background: '#34d399', transition: 'width 0.3s ease' }} />
                <div style={{ width: `${probs.overload * 100}%`, background: '#f43f5e', transition: 'width 0.3s ease' }} />
                <div style={{ width: `${probs.boredom * 100}%`, background: '#fbbf24', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Live Content Rewriter Preview */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${preview.color}35`,
              borderRadius: 8,
              padding: '14px',
              transition: 'border-color 0.3s ease',
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: preview.color, letterSpacing: '0.06em', marginBottom: 6 }}>
                Dynamic RAG Synthesis · {preview.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {preview.body.map((line, idx) => (
                  <p key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} color="var(--indigo-light)" />
            <span>30-second sustained window prevents erratic oscillation between tiers.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

