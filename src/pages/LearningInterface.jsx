import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CognitiveLoadGauge from '../components/CognitiveLoadGauge';
import SessionTimeline from '../components/SessionTimeline';
import ContentRenderer from '../components/ContentRenderer';
import WebcamMonitor from '../components/WebcamMonitor';
import { saveSession } from '../services/api';
import { useUser } from '../context/UserContext';
import {
  Brain, ArrowLeft, ArrowRight, CheckCircle2, Sliders, Activity,
  MousePointer, Scroll, Keyboard, Sparkles, AlertCircle, Clock,
  Maximize2, Minimize2, Eye, ShieldCheck, ChevronRight, Zap, Check, X
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Tier ordering: 1 = Simplified, 3 = Standard, 5 = Expert
// ─────────────────────────────────────────────────────────────
const TIERS = ['tier1', 'tier3', 'tier5'];
const TIER_META = {
  tier1: { key: '1', label: 'Simplified', short: 'Simplified', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', badge: 'badge-emerald' },
  tier3: { key: '2', label: 'Standard',   short: 'Standard',   color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', badge: 'badge-indigo'  },
  tier5: { key: '3', label: 'Expert',     short: 'Expert',     color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', badge: 'badge-amber'   },
};

// ─────────────────────────────────────────────────────────────
// Real-time interaction telemetry monitor
// ─────────────────────────────────────────────────────────────
function useSignalMonitor(isActive, currentTier) {
  const [signals, setSignals]         = useState({ mouseVelocity: 0, scrollRate: 0, typingPace: 0 });
  const [cogLoad, setCogLoad]         = useState(50);    // 0-100, for the gauge
  const [suggestion, setSuggestion]   = useState(null);  // 'simpler' | 'harder' | null
  const [dismissed, setDismissed]     = useState(false); // user dismissed current suggestion
  const mouseHistory   = useRef([]);
  const lastScrollY    = useRef(0);
  const keystrokeTs    = useRef([]);
  const signalBuffer   = useRef([]);   // rolling window for telemetry classification
  const observeSince   = useRef(null); // timestamp when current-tier observation started
  const currentTierRef = useRef(currentTier);

  useEffect(() => {
    currentTierRef.current = currentTier;
    observeSince.current = Date.now();
    setSuggestion(null);
    setDismissed(false);
  }, [currentTier]);

  useEffect(() => {
    if (!isActive) return;

    observeSince.current = Date.now();

    const onMouseMove = (e) => {
      mouseHistory.current.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (mouseHistory.current.length > 12) mouseHistory.current.shift();
    };

    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY.current);
      lastScrollY.current = window.scrollY;
      setSignals(prev => ({ ...prev, scrollRate: Math.min(100, Math.round(dy * 2.5)) }));
    };

    const onKeyDown = () => {
      const now = Date.now();
      keystrokeTs.current.push(now);
      if (keystrokeTs.current.length > 6) keystrokeTs.current.shift();
      if (keystrokeTs.current.length > 1) {
        const gaps = keystrokeTs.current.slice(1).map((t, i) => t - keystrokeTs.current[i]);
        const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        setSignals(prev => ({ ...prev, typingPace: Math.round(Math.max(0, 100 - avg / 5)) }));
      }
    };

    const velTick = setInterval(() => {
      if (mouseHistory.current.length >= 2) {
        const a = mouseHistory.current[0];
        const b = mouseHistory.current[mouseHistory.current.length - 1];
        const dt = (b.t - a.t) / 1000;
        const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
        const vel = dt > 0 ? Math.min(100, dist / dt / 3) : 0;
        setSignals(prev => ({ ...prev, mouseVelocity: Math.round(vel) }));
        signalBuffer.current.push(vel);
        if (signalBuffer.current.length > 60) signalBuffer.current.shift();
      }
    }, 1000);

    const classifyTick = setInterval(() => {
      const elapsedSinceChange = (Date.now() - (observeSince.current || Date.now())) / 1000;
      if (elapsedSinceChange < 45) return;
      if (dismissed) return;

      const buf = signalBuffer.current;
      if (buf.length === 0) return;
      const avgVel = buf.reduce((a, b) => a + b, 0) / buf.length;

      let load = 50;
      if (avgVel > 55) load = Math.max(10, 50 - (avgVel - 55) * 0.8);
      else if (avgVel < 15) load = Math.min(90, 50 + (15 - avgVel) * 2);
      load = Math.round(load);
      setCogLoad(load);

      const tier = currentTierRef.current;
      const tierIdx = TIERS.indexOf(tier);

      if (load < 30 && tierIdx < TIERS.length - 1) {
        setSuggestion('harder');
      } else if (load > 72 && tierIdx > 0) {
        setSuggestion('simpler');
      }
    }, 30000);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
      clearInterval(velTick);
      clearInterval(classifyTick);
    };
  }, [isActive, dismissed]);

  const dismissSuggestion = useCallback(() => {
    setSuggestion(null);
    setDismissed(true);
    setTimeout(() => setDismissed(false), 60000);
  }, []);

  return { signals, cogLoad, setCogLoad, suggestion, setSuggestion, dismissSuggestion };
}

// ─────────────────────────────────────────────────────────────
export default function LearningInterface() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subject, topicNames = [], selectedTopics = [], topicVersions = {} } = location.state || {};

  // Navigation guard
  useEffect(() => {
    if (!subject || topicNames.length === 0) navigate('/');
  }, [subject, topicNames, navigate]);

  const [isActive,           setIsActive]           = useState(false);
  const [sessionStarted,     setSessionStarted]     = useState(false);
  const [currentTopicIndex,  setCurrentTopicIndex]  = useState(0);
  const [currentTier,        setCurrentTier]        = useState('tier3'); // Start at Standard
  const [elapsedSeconds,     setElapsedSeconds]     = useState(0);
  const [adaptationLog,      setAdaptationLog]      = useState([]);
  const [contentFading,      setContentFading]      = useState(false);
  const [loadHistory,        setLoadHistory]        = useState([]);
  const [distractionFree,    setDistractionFree]    = useState(false);
  const [activeOverrideText, setActiveOverrideText] = useState(null);
  const [contentSource,      setContentSource]      = useState(null);

  const contentTopRef = useRef(null);
  const elapsedRef    = useRef(0);

  const { signals, cogLoad, setCogLoad, suggestion, setSuggestion, dismissSuggestion } = useSignalMonitor(isActive, currentTier);

  const currentTierMeta = TIER_META[currentTier];
  const currentTopic    = topicNames[currentTopicIndex] || 'Introduction';

  // ── Timer ──
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => {
      setElapsedSeconds(s => { elapsedRef.current = s + 1; return s + 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [isActive]);

  // ── Track load history for results chart ──
  useEffect(() => {
    if (!isActive) return;
    setLoadHistory(prev => [...prev.slice(-120), { t: elapsedRef.current, load: cogLoad }]);
  }, [cogLoad, isActive]);

  // ── Reset override text on topic navigation ──
  useEffect(() => {
    setActiveOverrideText(null);
    setContentSource(null);
  }, [currentTopicIndex]);

  // ── Change tier with a smooth fade + real-time adaptation ──
  const changeTier = useCallback((newTier, reason = 'manual') => {
    if (newTier === currentTier) return;
    setContentFading(true);
    setTimeout(() => {
      const prevTier = currentTier;
      setCurrentTier(newTier);
      setActiveOverrideText(null); // Reset override to display target tier base
      setAdaptationLog(prev => [...prev, {
        time: elapsedRef.current,
        from: prevTier,
        to: newTier,
        fromLabel: TIER_META[prevTier].label,
        toLabel: TIER_META[newTier].label,
        topic: currentTopic,
        reason,
      }]);
      setContentFading(false);

      // Trigger asynchronous real-time cognitive rewrite via local Ollama Qwen
      if (reason === 'ai-suggested' || reason.startsWith('manual')) {
        const cogState = (newTier === 'tier1') ? 1 : ((newTier === 'tier5') ? 2 : 0);
        if (cogState !== 0) {
          fetch('http://localhost:8000/api/adapt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cognitive_state: cogState,
              current_level: newTier === 'tier1' ? 1 : (newTier === 'tier5' ? 5 : 3),
              topic: currentTopic,
              target_tier: newTier,
              curated_content: (topicVersions[currentTopic] && topicVersions[currentTopic][newTier]) || null
            })
          })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && data.content && data.content_source?.includes('ollama')) {
              setActiveOverrideText(data.content);
              setContentSource(data.content_source);
            }
          })
          .catch(() => {});
        }
      }
    }, 280);
  }, [currentTier, currentTopic, topicVersions]);

  // ── Manual difficulty controls ──
  const goSimpler = useCallback(() => {
    const idx = TIERS.indexOf(currentTier);
    if (idx > 0) changeTier(TIERS[idx - 1], 'manual-simpler');
  }, [currentTier, changeTier]);

  const goHarder = useCallback(() => {
    const idx = TIERS.indexOf(currentTier);
    if (idx < TIERS.length - 1) changeTier(TIERS[idx + 1], 'manual-harder');
  }, [currentTier, changeTier]);

  // ── Accept AI suggestion ──
  const acceptSuggestion = useCallback(() => {
    const idx = TIERS.indexOf(currentTier);
    if (suggestion === 'simpler' && idx > 0) changeTier(TIERS[idx - 1], 'ai-suggested');
    if (suggestion === 'harder'  && idx < TIERS.length - 1) changeTier(TIERS[idx + 1], 'ai-suggested');
    dismissSuggestion();
  }, [currentTier, suggestion, changeTier, dismissSuggestion]);

  // ── Hotkeys: 1/2/3 for tiers, Enter/Esc for suggestion ──
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e) => {
      // Ignore if typing inside input / textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (suggestion) {
        if (e.key === 'Enter') {
          e.preventDefault();
          acceptSuggestion();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          dismissSuggestion();
          return;
        }
      }

      if (e.key === '1') changeTier('tier1', 'shortcut-key');
      if (e.key === '2') changeTier('tier3', 'shortcut-key');
      if (e.key === '3') changeTier('tier5', 'shortcut-key');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, suggestion, acceptSuggestion, dismissSuggestion, changeTier]);

  const { user } = useUser();

  // ── Session start / end ──
  const startSession = () => { setSessionStarted(true); setIsActive(true); };

  const endSession = () => {
    setIsActive(false);
    const avgLoad = loadHistory.length > 0
      ? Math.round(loadHistory.reduce((a, b) => a + b.load, 0) / loadHistory.length)
      : cogLoad;

    saveSession({
      user_id: user?.id || 'usr_default',
      subject: subject || 'General Learning',
      duration_seconds: elapsedRef.current,
      avg_cognitive_load: avgLoad,
      initial_tier: 'tier3',
      final_tier: currentTier,
      topics: topicNames,
      adaptation_log: adaptationLog
    }).catch(err => console.warn('Could not auto-save session:', err));

    navigate('/results', {
      state: {
        subject,
        subjectId: location.state?.subjectId,
        topicNames,
        adaptationLog,
        totalSeconds: elapsedRef.current,
        avgLoad,
        finalTier: currentTier,
      },
    });
  };

  // ── Switch topic ──
  const goToTopic = (idx) => {
    setCurrentTopicIndex(idx);
    setCurrentTier('tier3');
    contentTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById(`topic-tab-${idx}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const tierIdx = TIERS.indexOf(currentTier);

  if (!subject) return null;
  if (!sessionStarted) {
    return <PreSessionScreen subject={subject} topicNames={topicNames} onStart={startSession} onBack={() => navigate('/topics')} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      {/* Top Header */}
      <Navbar currentStep={4} session={{ time: formatTime(elapsedSeconds), state: cogLoad < 35 ? 'bored' : cogLoad > 70 ? 'overload' : 'flow' }} />

      {/* ── AI Suggestion Toast (Glassmorphic Slide-in) ── */}
      {suggestion && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 500,
            background: 'rgba(12, 17, 29, 0.95)',
            border: `1px solid ${suggestion === 'simpler' ? 'rgba(244,63,94,0.45)' : 'rgba(245,158,11,0.45)'}`,
            borderRadius: 'var(--radius-xl)', padding: '20px 22px', maxWidth: 360,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 30px rgba(99,102,241,0.15)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: suggestion === 'simpler' ? '#fda4af' : '#fcd34d'
            }}>
              <Brain size={14} />
              AI Cognitive Adaptation
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
              Active
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            {suggestion === 'simpler'
              ? 'Elevated cognitive load detected. Would you like to transition to key concept summaries and visual bullet points?'
              : 'Consistent flow and high comprehension detected. Ready to step up to expert-depth analysis and technical synthesis?'
            }
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              id="suggestion-accept-btn"
              onClick={acceptSuggestion}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: suggestion === 'simpler' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                boxShadow: suggestion === 'simpler' ? '0 4px 14px rgba(244,63,94,0.35)' : '0 4px 14px rgba(245,158,11,0.35)',
                transition: 'var(--transition)'
              }}
            >
              <Check size={14} />
              {suggestion === 'simpler' ? 'Simplify Tier' : 'Step Up Tier'}
              <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 2, background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: 4 }}>Enter</span>
            </button>
            <button
              id="suggestion-dismiss-btn"
              onClick={dismissSuggestion}
              style={{
                padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'var(--transition)'
              }}
            >
              <X size={14} />
              Stay
              <span style={{ fontSize: 10, opacity: 0.7, background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 4 }}>Esc</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div
        className="content-area"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: distractionFree ? '1fr' : 'minmax(0, 1fr) 350px',
          gap: 24,
          maxWidth: distractionFree ? 960 : 1380,
          margin: '0 auto',
          width: '100%',
          padding: '24px 24px 48px',
          transition: 'all 0.3s ease',
        }}
      >
        {/* ─── LEFT: Content area ─── */}
        <div ref={contentTopRef} style={{ minWidth: 0 }}>

          {/* Breadcrumb + Mode Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subject}</span>
              <span style={{ color: 'var(--border)', fontSize: 12 }}>›</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--indigo-light)' }}>{currentTopic}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Direct Tier Selector Pills */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.03)', padding: '3px 4px', borderRadius: 10,
                border: '1px solid var(--border)'
              }}>
                {TIERS.map((tierKey) => {
                  const meta = TIER_META[tierKey];
                  const isSelected = currentTier === tierKey;
                  return (
                    <button
                      key={tierKey}
                      onClick={() => changeTier(tierKey, 'manual-pill')}
                      title={`Press [${meta.key}] to switch`}
                      style={{
                        all: 'unset', cursor: 'pointer',
                        padding: '4px 10px', borderRadius: 7,
                        fontSize: 11, fontWeight: 700,
                        background: isSelected ? meta.bg : 'transparent',
                        color: isSelected ? meta.color : 'var(--text-muted)',
                        border: isSelected ? `1px solid ${meta.border}` : '1px solid transparent',
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: isSelected ? meta.color : 'var(--text-muted)'
                      }} />
                      {meta.short}
                      <span style={{
                        fontSize: 9, opacity: 0.6,
                        background: 'rgba(255,255,255,0.08)',
                        padding: '1px 4px', borderRadius: 3
                      }}>{meta.key}</span>
                    </button>
                  );
                })}
              </div>

              {/* Distraction free toggle */}
              <button
                onClick={() => setDistractionFree(!distractionFree)}
                title={distractionFree ? 'Show telemetry sidebar' : 'Distraction-free mode'}
                style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 8,
                  background: distractionFree ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: distractionFree ? 'var(--indigo-light)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600
                }}
              >
                {distractionFree ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span className="hide-mobile">{distractionFree ? 'Normal' : 'Focus'}</span>
              </button>
            </div>
          </div>

          {/* Topic tabs */}
          <div
            id="topic-tabs-row"
            style={{
              display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 4px 12px 2px', marginBottom: 16,
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}
          >
            {topicNames.map((topic, i) => {
              const isSelected = i === currentTopicIndex;
              const isDone = i < currentTopicIndex;
              return (
                <button
                  key={i}
                  id={`topic-tab-${i}`}
                  onClick={() => goToTopic(i)}
                  style={{
                    all: 'unset', cursor: 'pointer', padding: '6px 14px',
                    borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                    background: isSelected ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#c7d2fe' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                    border: `1px solid ${isSelected ? 'rgba(129,140,248,0.5)' : 'var(--border)'}`,
                    boxShadow: isSelected ? '0 0 12px rgba(99,102,241,0.25)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'var(--transition)',
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={12} color="#10b981" />
                  ) : (
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{i + 1}.</span>
                  )}
                  {topic}
                </button>
              );
            })}
          </div>

          {/* Content card */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'var(--shadow-card)',
          }}>
            {/* Reading Content Pane */}
            <div
              style={{
                padding: '28px 32px 24px',
                opacity: contentFading ? 0 : 1,
                transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                minHeight: 400,
              }}
            >
              <ContentRenderer
                tier={currentTier}
                topic={currentTopic}
                customVersions={topicVersions[currentTopic]}
                activeOverrideText={activeOverrideText}
                contentSource={contentSource}
              />
            </div>

            {/* ── Dynamic Tier Control Bar at Bottom of Content ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 24px',
              borderTop: '1px solid var(--border)',
              background: 'rgba(16, 21, 36, 0.6)',
              backdropFilter: 'blur(10px)',
              gap: 14,
              flexWrap: 'wrap',
            }}>
              {/* Left: tier visual meter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Tier Depth
                </span>

                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {TIERS.map((t, i) => (
                    <div
                      key={t}
                      style={{
                        width: tierIdx === i ? 26 : 8,
                        height: 7,
                        borderRadius: 99,
                        background: tierIdx === i ? currentTierMeta.color : 'rgba(255,255,255,0.1)',
                        boxShadow: tierIdx === i ? `0 0 10px ${currentTierMeta.color}80` : 'none',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  ))}
                </div>

                <span style={{ fontSize: 12, fontWeight: 800, color: currentTierMeta.color }}>
                  {currentTierMeta.label}
                </span>
              </div>

              {/* Right: Simpler / Harder action buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quick Shift:</span>
                <button
                  id="btn-simpler"
                  onClick={goSimpler}
                  disabled={tierIdx === 0}
                  style={{
                    all: 'unset', cursor: tierIdx === 0 ? 'not-allowed' : 'pointer',
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: tierIdx === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(52,211,153,0.12)',
                    color: tierIdx === 0 ? 'var(--text-muted)' : '#6ee7b7',
                    border: `1px solid ${tierIdx === 0 ? 'var(--border)' : 'rgba(52,211,153,0.3)'}`,
                    transition: 'var(--transition)',
                    opacity: tierIdx === 0 ? 0.35 : 1,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span style={{ fontSize: 11 }}>↓</span> Simpler
                </button>
                <button
                  id="btn-harder"
                  onClick={goHarder}
                  disabled={tierIdx === TIERS.length - 1}
                  style={{
                    all: 'unset', cursor: tierIdx === TIERS.length - 1 ? 'not-allowed' : 'pointer',
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: tierIdx === TIERS.length - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(245,158,11,0.12)',
                    color: tierIdx === TIERS.length - 1 ? 'var(--text-muted)' : '#fcd34d',
                    border: `1px solid ${tierIdx === TIERS.length - 1 ? 'var(--border)' : 'rgba(245,158,11,0.3)'}`,
                    transition: 'var(--transition)',
                    opacity: tierIdx === TIERS.length - 1 ? 0.35 : 1,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span style={{ fontSize: 11 }}>↑</span> Harder
                </button>
              </div>
            </div>
          </div>

          {/* Prev / Next navigation footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary" id="prev-topic-btn"
              onClick={() => goToTopic(Math.max(0, currentTopicIndex - 1))}
              disabled={currentTopicIndex === 0}
              style={{ opacity: currentTopicIndex === 0 ? 0.35 : 1 }}
            >
              <ArrowLeft size={14} />
              Previous Topic
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary" id="end-session-btn" onClick={endSession}
                style={{ color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)' }}
              >
                End Session
              </button>
              {currentTopicIndex < topicNames.length - 1 ? (
                <button className="btn btn-primary" id="next-topic-btn" onClick={() => goToTopic(currentTopicIndex + 1)}>
                  Next Topic
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button className="btn btn-primary" id="finish-btn" onClick={endSession}>
                  <Sparkles size={14} />
                  Complete & View Analytics
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Cockpit Sidebar ─── */}
        {!distractionFree && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 16,
            position: 'sticky', top: 84, alignSelf: 'start',
            maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent',
            paddingRight: 4,
          }}>

            {/* Cognitive Load Gauge */}
            <div style={{ flexShrink: 0 }}>
              <CognitiveLoadGauge
                state={cogLoad < 35 ? 'bored' : cogLoad > 70 ? 'overload' : 'flow'}
                load={cogLoad}
              />
            </div>

            {/* Embedded Real-Time Webcam Facial Monitor */}
            <div style={{ flexShrink: 0 }}>
              <WebcamMonitor
                onCognitiveLoadUpdate={setCogLoad}
                onTriggerSuggestion={setSuggestion}
              />
            </div>

            {/* Live Interaction Telemetry */}
            <div style={{
              flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '16px', boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={12} style={{ color: 'var(--indigo-light)' }} />
                  Telemetry Signals
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#34d399', fontWeight: 700 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                  Streaming
                </span>
              </div>

              {[
                { label: 'Mouse Dynamics', value: Math.round(signals.mouseVelocity), icon: <MousePointer size={12} color="var(--indigo-light)" /> },
                { label: 'Reading Velocity', value: Math.round(signals.scrollRate), icon: <Scroll size={12} color="var(--violet-light)" /> },
                { label: 'Input Cadence', value: Math.round(signals.typingPace), icon: <Keyboard size={12} color="var(--emerald)" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {icon} {label}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{value}%</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                    <div className="progress-bar-fill" style={{ width: `${value}%`, background: 'var(--gradient-brand)', height: '100%', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck size={12} style={{ color: 'var(--indigo-light)', flexShrink: 0 }} />
                <span>Minimum 45s baseline required before suggestions</span>
              </div>
            </div>

            {/* Session Stats */}
            <div style={{
              flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '16px', boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                Cockpit Telemetry
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Time Elapsed', value: formatTime(elapsedSeconds) },
                  { label: 'Adaptations',  value: adaptationLog.length },
                  { label: 'Topic Queue',  value: `${currentTopicIndex + 1}/${topicNames.length}` },
                  { label: 'Active Depth', value: currentTierMeta.short },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>{value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ flexShrink: 0 }}>
              <SessionTimeline adaptationLog={adaptationLog} totalSeconds={elapsedSeconds} />
            </div>

            {/* End session button */}
            <button
              className="btn btn-secondary btn-sm" id="sidebar-end-btn" onClick={endSession}
              style={{ width: '100%', justifyContent: 'center', color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)', flexShrink: 0 }}
            >
              End Session & Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pre-session Screen ──
function PreSessionScreen({ subject, topicNames, onStart, onBack }) {
  return (
    <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Navbar currentStep={4} />

      <div className="content-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ maxWidth: 540, width: '100%' }}>
          <div className="animate-fadeInUp" style={{
            background: 'var(--gradient-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '40px 36px',
            boxShadow: 'var(--shadow-glow)', position: 'relative', overflow: 'hidden'
          }}>
            {/* Top ambient badge */}
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
              border: '1px solid rgba(129,140,248,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 24px rgba(99,102,241,0.3)',
            }}>
              <Brain size={30} style={{ color: '#c7d2fe' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Initialize Study Cockpit
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
                CogFlow continuously monitors reading telemetry and facial cues to maintain optimal flow state. Adaptations remain purely under your command.
              </p>
            </div>

            {/* How adaptation works card */}
            <div style={{
              background: 'rgba(99,102,241,0.04)', borderRadius: 12, padding: '16px 18px',
              marginBottom: 20, border: '1px solid rgba(99,102,241,0.12)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--indigo-light)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Intelligent Feedback Loop
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: <Activity size={14} color="var(--indigo-light)" />, title: 'Real-time Signal Analysis', desc: 'Monitors reading cadence and facial tension non-intrusively.' },
                  { icon: <Sparkles size={14} color="var(--emerald)" />, title: 'Cognitive Suggestions', desc: 'Prompts tier adjustments after 30-45 seconds of sustained load.' },
                  { icon: <ShieldCheck size={14} color="var(--amber)" />, title: 'Complete User Autonomy', desc: 'Accept suggestions or manually change depth anytime (keys 1-3).' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ padding: 4, borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginTop: 2 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic queue */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '16px', marginBottom: 24, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span>Curriculum Queue</span>
                <span style={{ color: 'var(--indigo-light)' }}>{topicNames.length} Topics</span>
              </div>
              <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topicNames.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
                    borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--indigo-light)', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" id="back-from-prescreen" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>
                Back
              </button>
              <button className="btn btn-primary" id="start-session-btn" onClick={onStart} style={{ flex: 2, justifyContent: 'center', gap: 8 }}>
                Initialize Session
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
