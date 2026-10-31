import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import NeuralWaveform from '../components/NeuralWaveform';
import BiometricPlayground from '../components/BiometricPlayground';
import ArchitectureVisualizer from '../components/ArchitectureVisualizer';
import { sounds } from '../utils/soundEffects';
import {
  Brain, ScanFace, Cpu, Layers, Zap, BarChart3, ArrowRight,
  Sparkles, CheckCircle2, Sliders, ShieldCheck, Terminal,
  Activity, ChevronRight, Eye, RefreshCw, Compass, Code, Network, Award
} from 'lucide-react';

const FEATURES = [
  {
    icon: ScanFace,
    title: 'MediaPipe FACS Telemetry',
    tag: 'Edge Vision',
    desc: 'Extracts 52 facial blendshapes including AU4 brow furrow and AU7 squint directly in-memory at 60 FPS without retaining video frames.'
  },
  {
    icon: Brain,
    title: 'DAiSEE BiLSTM ONNX Engine',
    tag: 'Temporal AI',
    desc: 'Bidirectional sequence network trained on empirical student cognitive datasets, running lightweight sub-millisecond inference.'
  },
  {
    icon: Sparkles,
    title: 'Local Qwen 2.5 Synthesizer',
    tag: 'Zero-Slop AI',
    desc: 'No static textbook text. Pure dynamic on-the-fly curriculum and quiz synthesis tailored to your exact cognitive mastery tier.'
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
    subtitle: 'Intuitive mental models, ASCII memory layouts, and clean zero-jargon analogies.',
    title: 'Raft Consensus: The Leader & Log Notebook Analogy',
    body: `Think of a distributed cluster as a classroom of students trying to keep an identical notebook:

1. One student is elected the "Note-Taker" (Leader).
2. Whenever the teacher says something new (Client Write Request), only the Note-Taker writes it down in pencil first.
3. The Note-Taker sends copies of the sentence to the other students (Followers).
4. As soon as more than half the classroom confirms they received it (Quorum), the Note-Taker pens it down in ink (Committed).
5. If the Note-Taker steps out, the students immediately hold a quick vote to elect a new one!`,
    diagram: `[Client] ──Write──> [Leader]
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   [Follower A]                  [Follower B]`
  },
  tier3: {
    badge: 'A-Tier Core Engineering',
    subtitle: 'Production architectural blueprints, RPC mechanics, and state machine invariants.',
    title: 'Raft Protocol: Term Invariants & AppendEntries RPC',
    body: `Raft decomposes consensus into three independent sub-problems:

• Leader Election: Randomized election timeouts (150ms-300ms) prevent split-vote deadlocks. Candidates increment 'currentTerm' and broadcast RequestVote RPCs.
• Log Replication: The Leader accepts entries from clients, assigns monotonic indices, and issues AppendEntries RPCs. Entries are committed once stored on a majority (N/2 + 1) nodes.
• Log Matching Property: If two logs contain an entry with the same index and term, they are identical up to that index. The leader never overwrites its own log entries.`,
    diagram: `State Machine:
[Follower] ──(Timeout)──> [Candidate] ──(Majority Votes)──> [Leader]
    ▲                           │                              │
    └──────(Discovers Higher Term / Valid Leader)──────────────┘`
  },
  tier5: {
    badge: 'S-Tier Staff & Research',
    subtitle: 'Formal safety proofs, network partition split-brain analysis, and fsync disk bottlenecks.',
    title: 'Formal Safety Invariants & Asymmetric Partition Recovery',
    body: `At the storage engine and formal verification boundary:

• State Machine Safety: If a server applies log entry at index i to its state machine, no other server will ever apply a different entry for index i. Raft guarantees this through the Election Restriction: a voter rejects a candidate whose log is less up-to-date than its own ((lastLogTerm, lastLogIndex) lexicographical check).
• Commit Rule Invariant: A leader CANNOT commit a log entry from a previous term by simply counting replicas; it must commit at least one entry from its current term by majority replication.
• Production Fsync Bottleneck: Group commit batching and write-ahead log (WAL) preallocation are mandatory to mitigate NVMe sync latency under high write concurrency.`,
    diagram: `Split-Brain Partition Invariant:
Cluster {N=5}: Partition [A, B] (Quorum=2 < 3) vs [C, D, E] (Quorum=3 >= 3)
=> Minority partition cannot commit client writes; uncommitted entries rolled back on reconciliation.`
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
                    How Local Qwen Synthesizes Curriculum On-The-Fly
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
                    Synthesized by Qwen 2.5 Coder
                  </span>
                </div>

                <h4 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginBottom: 14 }}>
                  {preview.title}
                </h4>

                <p style={{
                  fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 18
                }}>
                  {preview.body}
                </p>

                {preview.diagram && (
                  <pre style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(129,140,248,0.2)',
                    borderRadius: 10,
                    padding: '14px 18px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#c7d2fe',
                    overflowX: 'auto',
                    lineHeight: 1.5
                  }}>
                    {preview.diagram}
                  </pre>
                )}
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

      {/* ── SYSTEM ARCHITECTURE TOPOLOGY ── */}
      <section style={{
        padding: '30px 0 70px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div className="container" style={{ maxWidth: 1080 }}>
          <ArchitectureVisualizer />
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
