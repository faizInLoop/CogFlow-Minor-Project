import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import NeuralWaveform from '../components/NeuralWaveform';
import BiometricPlayground from '../components/BiometricPlayground';
import { sounds } from '../utils/soundEffects';
import {
  Brain, ScanFace, Cpu, Layers, Zap, BarChart3, ArrowRight,
  Sparkles, CheckCircle2, Sliders, ShieldCheck, Terminal,
  Activity, ChevronRight, Eye, RefreshCw, Compass, Code, Network, Award
} from 'lucide-react';

const FEATURES = [
  {
    icon: ScanFace,
    title: 'On-device expression window',
    tag: 'Private vision',
    desc: 'Reads facial expressions in the browser and keeps the video on this device. Frames are not uploaded.'
  },
  {
    icon: Brain,
    title: 'DAiSEE TensorFlow.js model',
    tag: 'Cognitive states',
    desc: 'A small network trained on DAiSEE expression windows. It classifies flow, overload, and boredom from an 11-frame summary.'
  },
  {
    icon: Sparkles,
    title: 'Instant tiered lessons',
    tag: 'Curriculum',
    desc: 'Each topic is served at simplified, standard, and expert depth as soon as you open it, without waiting on a separate model server.'
  },
  {
    icon: Activity,
    title: 'Silent Behavioral Fusion',
    tag: 'Multimodal',
    desc: 'Fuses micro-interaction metrics like scroll cadence, pointer turbulence, and typing pauses alongside facial telemetry.'
  },
  {
    icon: Award,
    title: 'Active Recall Typing Challenge',
    tag: 'Dynamic Grading',
    desc: 'Tests deep conceptual comprehension through dynamic free-form synthesis questions evaluated instantly by Qwen with real-time scoring.'
  },
  {
    icon: ShieldCheck,
    title: 'Zero-Knowledge Privacy',
    tag: 'Client Isolated',
    desc: 'Zero video stream upload or cloud camera storage. Facial landmark vectors are calculated in browser memory and cleared immediately.'
  }
];

const DOMAIN_CHIPS = [
  'LKG/UKG Phonics & Basic Numbers',
  'Class 1-5 Math & Science Wonders',
  'Secondary School (Class 6-12)',
  'Systems & OS Architecture',
  'Modern AI & LLM Foundations',
  'Applied Cryptography & Security',
  'Finance, Investing & Economics',
  'Any Custom Grade or Subject'
];

const TIER_PREVIEWS = {
  tier1: {
    badge: 'B-Tier Foundations',
    subtitle: 'Plain language, same facts.',
    title: 'Consensus and a network split',
    body: `Consensus means several computers agree on one value even if some of them fail. The CAP idea says that during a network split you cannot have perfect consistency and perfect availability at the same time.

If a network break separates a cluster, one side can stop accepting writes so it does not disagree with the other side. That choice favors consistency. The other choice is to keep accepting writes and repair later.`
  },
  tier3: {
    badge: 'A-Tier Core',
    subtitle: 'The standard statement, with one example.',
    title: 'Raft, majority, and CAP',
    body: `A consensus protocol such as Raft elects a leader and replicates a log. An entry is committed when a majority has stored it. A later leader must contain all committed entries, which is how the protocol avoids losing an agreed value.

In a cluster of five, a partition of 3 and 2 lets the group of 3 elect a leader and commit. The group of 2 cannot commit, because it is not a majority.`
  },
  tier5: {
    badge: 'S-Tier Detail',
    subtitle: 'Definitions kept distinct.',
    title: 'Safety, linearizability, and the minority side',
    body: `Raft safety depends on election rules and on the leader log. A candidate can win only if its log is at least as up to date as a majority. That prevents a leader from being elected without committed entries.

Availability in the CAP sense means every request to a non-failed node gets a response. Linearizability means operations appear to happen in one order that matches real time. A partitioned minority that still answers writes cannot promise that order.`
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTierPreview, setActiveTierPreview] = useState('tier3');

  const handleLaunch = () => {
    sounds.playLevelUp();
    navigate('/choose-path');
  };

  const preview = TIER_PREVIEWS[activeTierPreview];

  return (
    <div className="page" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      <Navbar currentStep={0} />

      {/* ── HERO SECTION ── */}
      <section style={{
        paddingTop: 80,
        paddingBottom: 60,
        position: 'relative',
        zIndex: 1,
      }}>
        <div className="container" style={{ textAlign: 'center' }}>

          {/* Top Status Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 26 }} className="animate-fadeInUp">
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              padding: '6px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(129,140,248,0.3)',
              fontSize: 11.5,
              fontWeight: 800,
              color: '#c7d2fe',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: '0 0 20px rgba(99,102,241,0.2)'
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#34d399',
                boxShadow: '0 0 10px #34d399', animation: 'pulseGlow 2s infinite ease-in-out'
              }} />
              Local Qwen 2.5 AI · Zero-Lag Cognitive Adaptation Active
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 74px)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            maxWidth: 1060,
            margin: '0 auto 24px',
            color: '#ffffff'
          }} className="animate-fadeInUp delay-100">
            Real-time cognitive load detection for{' '}
            <span className="shimmer-text">
              effortless technical mastery.
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            lineHeight: 1.68,
            maxWidth: 720,
            margin: '0 auto 38px',
          }} className="animate-fadeInUp delay-200">
            CogFlow silently monitors your focus, reading rhythm, and brow tension — dynamically synthesizing instructional depth on the fly with local Qwen AI to keep you in an optimal flow state.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }} className="animate-fadeInUp delay-300">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleLaunch}
              id="hero-start-learning-btn"
              style={{ gap: 9 }}
            >
              Launch Adaptive Workspace
              <ArrowRight size={17} />
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => {
                sounds.playClick();
                navigate('/subjects');
              }}
              style={{ gap: 9 }}
            >
              <Compass size={17} style={{ color: 'var(--indigo-light)' }} />
              Browse 7 Technical Tracks
            </button>
          </div>

          {/* Domain Chips Marquee */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
            maxWidth: 960,
            margin: '0 auto 64px'
          }} className="animate-fadeInUp delay-400">
            {DOMAIN_CHIPS.map((chip, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '5px 12px',
                  borderRadius: 99
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          {/* ── LIVE TIER COMPARISON STUDIO SHOWCASE ── */}
          <div className="animate-fadeInUp delay-400" style={{ maxWidth: 1040, margin: '0 auto 64px', textAlign: 'left' }}>
            <div style={{
              background: 'linear-gradient(180deg, #0d0d10 0%, #08080a 100%)',
              border: '1px solid rgba(129, 140, 248, 0.25)',
              borderRadius: 24,
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Sparkles size={16} style={{ color: '#818cf8' }} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8' }}>
                      Live Adaptation Engine Preview
                    </span>
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff' }}>
                    A course note, at three depths
                  </h3>
                </div>

                {/* Tier Switcher Tabs */}
                <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { sounds.playClick(); setActiveTierPreview('tier1'); }}
                    className={`category-pill ${activeTierPreview === 'tier1' ? 'tier-pill-b active' : ''}`}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                  >
                    B-Tier (Foundations)
                  </button>
                  <button
                    onClick={() => { sounds.playClick(); setActiveTierPreview('tier3'); }}
                    className={`category-pill ${activeTierPreview === 'tier3' ? 'tier-pill-a active' : ''}`}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                  >
                    A-Tier (Core)
                  </button>
                  <button
                    onClick={() => { sounds.playClick(); setActiveTierPreview('tier5'); }}
                    className={`category-pill ${activeTierPreview === 'tier5' ? 'tier-pill-s active' : ''}`}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                  >
                    S-Tier (Staff)
                  </button>
                </div>
              </div>

              {/* Dynamic Content Preview Body */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                padding: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: activeTierPreview === 'tier5' ? '#fbbf24' : activeTierPreview === 'tier3' ? '#818cf8' : '#34d399'
                  }}>
                    {preview.badge} · {preview.subtitle}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    Course note
                  </span>
                </div>

                <h4 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginBottom: 14 }}>
                  {preview.title}
                </h4>

                <p style={{
                  fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 0
                }}>
                  {preview.body}
                </p>
              </div>
            </div>
          </div>

          {/* ── LIVE NEURAL OSCILLOSCOPE WAVEFORM ── */}
          <div className="animate-fadeInUp delay-400" style={{ maxWidth: 1040, margin: '0 auto 64px' }}>
            <NeuralWaveform defaultBand="alpha" />
          </div>

        </div>
      </section>

      {/* ── BIOMETRIC TELEMETRY PLAYGROUND ── */}
      <section id="playground-section" style={{
        padding: '30px 0 70px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div className="container" style={{ maxWidth: 1080 }}>
          <BiometricPlayground />
        </div>
      </section>

      {/* ── FEATURE MATRIX (SPOTLIGHT CARDS) ── */}
      <section style={{
        padding: '70px 0 90px',
        borderTop: '1px solid var(--border)',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="container" style={{ maxWidth: 1140 }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--indigo-light)', textTransform: 'uppercase' }}>
              Engine Architecture
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginTop: 8, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Engineered for high-friction technical subjects.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 580, margin: '8px auto 0' }}>
              Every component runs client-side with minimal memory footprints, zero video telemetry persistence, and calibrated inference thresholds.
            </p>
          </div>

          <div className="grid-3" style={{ gap: 20 }}>
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <SpotlightCard key={i} style={{ padding: '28px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(99,102,241,0.14)',
                      border: '1px solid rgba(129,140,248,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--indigo-light)',
                    }}>
                      <Icon size={22} />
                    </div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--indigo-light)',
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}>
                      {feat.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {feat.desc}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CALL TO ACTION ── */}
      <section style={{
        padding: '60px 0 80px',
        borderTop: '1px solid var(--border)',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
      }}>
        <div className="container-narrow">
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: '#ffffff', marginBottom: 14 }}>
            Experience true adaptive engineering education.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 540, margin: '0 auto 32px' }}>
            Choose a curated technical track, upload your syllabus, or synthesize any custom engineering concept with local Qwen AI.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleLaunch}
            style={{ gap: 8 }}
          >
            Launch Adaptive Workspace
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </div>
  );
}
