import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CognitiveLoadGauge from '../components/CognitiveLoadGauge';
import SessionTimeline from '../components/SessionTimeline';
import ContentRenderer from '../components/ContentRenderer';
import WebcamMonitor from '../components/WebcamMonitor';
import { saveSession, adaptContent } from '../services/api';
import { useUser } from '../context/UserContext';
import { getContent } from '../data/subjects';

// ─────────────────────────────────────────────────────────────
// Tier ordering: 1 = Simplified, 3 = Standard, 5 = Expert
// ─────────────────────────────────────────────────────────────
const TIERS = ['tier1', 'tier3', 'tier5'];
const TIER_META = {
  tier1: { label: 'Simplified', short: 'Simplified', color: '#10b981', badge: 'badge-emerald' },
  tier3: { label: 'Standard',   short: 'Standard',   color: '#6366f1', badge: 'badge-indigo'  },
  tier5: { label: 'Expert',     short: 'Expert',      color: '#f59e0b', badge: 'badge-amber'   },
};

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER: AI Signal Monitor
// Silently collects raw interaction signals (mouse speed,
// scroll rate, keystrokes) and, after a minimum observation
// window, produces a SUGGESTION (not an auto-change).
//
// ── Phase 2 Integration ──
// Replace the classifyTick heuristic below with a real API call:
//
//   POST http://localhost:8000/api/adapt
//   Body:    { cognitive_state: 0|1|2, current_level: 1-5 }
//   Response:{ status, action_taken, new_level, content }
//
// Tier mapping (frontend → backend):
//   'tier1' (Simplified) → current_level 1-2, cognitive_state 1 (Overload)
//   'tier3' (Standard)   → current_level 3,   cognitive_state 0 (Flow)
//   'tier5' (Expert)     → current_level 4-5, cognitive_state 2 (Boredom)
//
// The returned `content` field replaces the static getContent() call
// in ContentRenderer.jsx.
// ─────────────────────────────────────────────────────────────
function useSignalMonitor(isActive, currentTier, isWebcamTrackingActive = false) {
  const [signals, setSignals]         = useState({ mouseVelocity: 0, scrollRate: 0, typingPace: 0 });
  const [cogLoad, setCogLoad]         = useState(50);    // 0-100, for the gauge
  const [suggestion, setSuggestion]   = useState(null);  // 'simpler' | 'harder' | null
  const [dismissed, setDismissed]     = useState(false); // user dismissed current suggestion
  const mouseHistory   = useRef([]);
  const lastScrollY    = useRef(0);
  const keystrokeTs    = useRef([]);
  const signalBuffer   = useRef([]);   // rolling window of (velocity, scroll, keys) for classification
  const observeSince   = useRef(null); // timestamp when current-tier observation started
  const currentTierRef = useRef(currentTier);
  const isWebcamRef    = useRef(isWebcamTrackingActive);

  useEffect(() => {
    isWebcamRef.current = isWebcamTrackingActive;
  }, [isWebcamTrackingActive]);

  // Keep tier ref in sync so the interval can read it without stale closure
  useEffect(() => {
    currentTierRef.current = currentTier;
    // Reset observation window whenever tier changes so we don't immediately suggest again
    observeSince.current = Date.now();
    setSuggestion(null);
    setDismissed(false);
  }, [currentTier]);

  useEffect(() => {
    if (!isActive) return;

    observeSince.current = Date.now();

    // ── Raw signal listeners ──
    const onMouseMove = (e) => {
      mouseHistory.current.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (mouseHistory.current.length > 12) mouseHistory.current.shift();
    };

    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY.current);
      lastScrollY.current = window.scrollY;
      setSignals(prev => ({ ...prev, scrollRate: Math.min(100, dy * 2.5) }));
    };

    const onKeyDown = () => {
      const now = Date.now();
      keystrokeTs.current.push(now);
      if (keystrokeTs.current.length > 6) keystrokeTs.current.shift();
      if (keystrokeTs.current.length > 1) {
        const gaps = keystrokeTs.current.slice(1).map((t, i) => t - keystrokeTs.current[i]);
        const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        setSignals(prev => ({ ...prev, typingPace: Math.max(0, 100 - avg / 5) }));
      }
    };

    // ── Every second: compute mouse velocity ──
    const velTick = setInterval(() => {
      if (mouseHistory.current.length >= 2) {
        const a = mouseHistory.current[0];
        const b = mouseHistory.current[mouseHistory.current.length - 1];
        const dt = (b.t - a.t) / 1000;
        const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
        const vel = dt > 0 ? Math.min(100, dist / dt / 3) : 0;
        setSignals(prev => ({ ...prev, mouseVelocity: Math.round(vel) }));
        // Push to buffer for classification
        signalBuffer.current.push(vel);
        if (signalBuffer.current.length > 60) signalBuffer.current.shift();
      }
    }, 1000);

    // ── Every 30 seconds: classify + maybe raise a suggestion ──
    // Minimum 45s of observation before first suggestion so user
    // has actually had time to read the content.
    const classifyTick = setInterval(() => {
      const elapsedSinceChange = (Date.now() - (observeSince.current || Date.now())) / 1000;
      if (elapsedSinceChange < 45) return; // wait at least 45 seconds on a tier
      if (dismissed) return;               // user already dismissed this suggestion

      // If webcam AI is actively monitoring, leave cognitive load & suggestions to the webcam
      if (isWebcamRef.current) return;

      const buf = signalBuffer.current;
      if (buf.length === 0) return;
      const avgVel = buf.reduce((a, b) => a + b, 0) / buf.length;

      // Simulated cognitive load based on interaction signals
      let load = 50;
      if (avgVel > 55) load = Math.max(10, 50 - (avgVel - 55) * 0.8);  // fast mouse → bored
      else if (avgVel < 15) load = Math.min(90, 50 + (15 - avgVel) * 2); // very slow → overloaded
      load = Math.round(load);
      setCogLoad(load);

      const tier = currentTierRef.current;
      const tierIdx = TIERS.indexOf(tier);

      if (load < 30 && tierIdx < TIERS.length - 1) {
        // Bored and not already on hardest tier → suggest harder
        setSuggestion('harder');
      } else if (load > 72 && tierIdx > 0) {
        // Overloaded and not already on simplest tier → suggest simpler
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
    // Allow a new suggestion after 60 more seconds
    setTimeout(() => setDismissed(false), 60000);
  }, []);

  return { signals, cogLoad, setCogLoad, suggestion, setSuggestion, dismissSuggestion };
}

// ─────────────────────────────────────────────────────────────
export default function LearningInterface() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subject, topicNames = [], selectedTopics = [] } = location.state || {};

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
  const [contentFading,      setContentFading]      = useState(false);  // for fade transition
  const [loadHistory,        setLoadHistory]        = useState([]);

  // Adaptation API & Content states
  const [webcamStatus,       setWebcamStatus]       = useState({ active: false, calibrated: false });
  const [customContent,      setCustomContent]      = useState(null);
  const [contentSource,      setContentSource]      = useState('curated_topic_library');
  const [rewrittenByClaude,  setRewrittenByClaude]  = useState(false);

  const contentTopRef = useRef(null);
  const elapsedRef    = useRef(0);

  const { signals, cogLoad, setCogLoad, suggestion, setSuggestion, dismissSuggestion } = useSignalMonitor(
    isActive,
    currentTier,
    webcamStatus.active
  );

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

  // ── Change tier with a smooth fade + log the event ──
  const changeTier = useCallback((newTier, reason = 'manual') => {
    if (newTier === currentTier) return;
    setContentFading(true);
    setCustomContent(null); // Return to standard curated content for this tier
    setContentSource('curated_topic_library');
    setRewrittenByClaude(false);
    setTimeout(() => {
      const prevTier = currentTier;
      setCurrentTier(newTier);
      setAdaptationLog(prev => [...prev, {
        time: elapsedRef.current,
        from: prevTier,
        to: newTier,
        fromLabel: TIER_META[prevTier].label,
        toLabel: TIER_META[newTier].label,
        topic: currentTopic,
        reason,
        source: 'curated_topic_library',
      }]);
      setContentFading(false);
    }, 280); // matches CSS fade duration
  }, [currentTier, currentTopic]);

  // ── Manual difficulty controls ──
  const goSimpler = () => {
    const idx = TIERS.indexOf(currentTier);
    if (idx > 0) changeTier(TIERS[idx - 1], 'manual-simpler');
  };

  const goHarder = () => {
    const idx = TIERS.indexOf(currentTier);
    if (idx < TIERS.length - 1) changeTier(TIERS[idx + 1], 'manual-harder');
  };

  // ── Accept AI suggestion: Dispatches real POST /api/adapt request ──
  const acceptSuggestion = async () => {
    const idx = TIERS.indexOf(currentTier);
    const targetTier = suggestion === 'simpler' && idx > 0
      ? TIERS[idx - 1]
      : (suggestion === 'harder' && idx < TIERS.length - 1 ? TIERS[idx + 1] : null);

    if (!targetTier) {
      dismissSuggestion();
      return;
    }

    const cogStateCode = suggestion === 'simpler' ? 1 : 2;
    const tierToLevel = { tier1: 1, tier3: 3, tier5: 5 };
    const curLevel = tierToLevel[currentTier] || 3;
    const targetCurated = getContent(currentTopic, targetTier);

    setContentFading(true);
    dismissSuggestion();

    try {
      // Real API call to FastAPI backend
      const adaptRes = await adaptContent({
        cognitive_state: cogStateCode,
        current_level: curLevel,
        topic: currentTopic,
        subject: subject,
        current_tier: currentTier,
        target_tier: targetTier,
        curated_content: targetCurated,
      });

      const prevTier = currentTier;
      const finalTier = adaptRes?.new_tier || targetTier;
      setCurrentTier(finalTier);

      if (adaptRes?.content) {
        setCustomContent(adaptRes.content);
        setContentSource(adaptRes.content_source || 'curated_topic_library');
        setRewrittenByClaude(Boolean(adaptRes.rewritten_by_claude));
      } else {
        setCustomContent(null);
        setContentSource('curated_topic_library');
        setRewrittenByClaude(false);
      }

      setAdaptationLog(prev => [...prev, {
        time: elapsedRef.current,
        from: prevTier,
        to: finalTier,
        fromLabel: TIER_META[prevTier].label,
        toLabel: TIER_META[finalTier].label,
        topic: currentTopic,
        reason: 'ai-suggested',
        source: adaptRes?.content_source || 'curated_topic_library',
      }]);
    } catch (err) {
      console.warn('Backend adapt error, using curriculum fallback:', err);
      changeTier(targetTier, 'ai-suggested');
    } finally {
      setTimeout(() => setContentFading(false), 280);
    }
  };

  const { user } = useUser();

  // ── Session start / end ──
  const startSession = () => { setSessionStarted(true); setIsActive(true); };

  const endSession = () => {
    setIsActive(false);
    const avgLoad = loadHistory.length > 0
      ? Math.round(loadHistory.reduce((a, b) => a + b.load, 0) / loadHistory.length)
      : cogLoad;

    // Asynchronously record session and learned topic mastery to SQLite DB
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
    setCurrentTier('tier3'); // Reset to standard on new topic
    setCustomContent(null);
    setContentSource('curated_topic_library');
    setRewrittenByClaude(false);
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Navbar currentStep={4} session={{ time: formatTime(elapsedSeconds), state: cogLoad < 35 ? 'bored' : cogLoad > 70 ? 'overload' : 'flow' }} />

      {/* ── AI Suggestion Toast ── */}
      {suggestion && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'fixed', top: 80, right: 24, zIndex: 300,
            background: 'rgba(15,15,31,0.97)',
            border: `1px solid ${suggestion === 'simpler' ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.4)'}`,
            borderRadius: 'var(--radius-lg)', padding: '16px 18px', maxWidth: 300,
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', color: suggestion === 'simpler' ? '#fda4af' : '#fcd34d' }}>
            🧠 CogFlow Suggestion
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 14 }}>
            {suggestion === 'simpler'
              ? 'You seem stuck or finding this section challenging. Would you like to simplify the language into key bullet points?'
              : 'You seem comfortable and breezing through this. Would you like to increase the depth and challenge?'
            }
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              id="suggestion-accept-btn"
              onClick={acceptSuggestion}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                background: suggestion === 'simpler' ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.25)',
                color: suggestion === 'simpler' ? '#fda4af' : '#fcd34d',
                transition: 'var(--transition)'
              }}
            >
              {suggestion === 'simpler' ? '⬇ Simplify Content' : '⬆ Increase Challenge'}
            </button>
            <button
              id="suggestion-dismiss-btn"
              onClick={dismissSuggestion}
              style={{
                padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                transition: 'var(--transition)'
              }}
            >
              Remain at Current Pace
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
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 24,
          maxWidth: 1360,
          margin: '0 auto',
          width: '100%',
          padding: '24px 24px 40px',
        }}
      >
        {/* ─── LEFT: Content area ─── */}
        <div ref={contentTopRef} style={{ minWidth: 0 }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subject}</span>
            <span style={{ color: 'var(--border)', fontSize: 12 }}>›</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo-light)' }}>{currentTopic}</span>
            <span style={{ marginLeft: 'auto' }}>
              <span className={`badge ${currentTierMeta.badge}`}>{currentTierMeta.label}</span>
            </span>
          </div>

          {/* Topic tabs */}
          <div
            id="topic-tabs-row"
            style={{
              display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 6px 12px 2px', marginBottom: 16,
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}
          >
            {topicNames.map((topic, i) => (
              <button
                key={i}
                id={`topic-tab-${i}`}
                onClick={() => goToTopic(i)}
                style={{
                  all: 'unset', cursor: 'pointer', padding: '6px 16px',
                  borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  background: i === currentTopicIndex ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.04)',
                  color: i === currentTopicIndex ? '#c7d2fe' : 'var(--text-muted)',
                  border: `1px solid ${i === currentTopicIndex ? 'rgba(129,140,248,0.6)' : 'var(--border)'}`,
                  boxShadow: i === currentTopicIndex ? '0 0 14px rgba(99,102,241,0.28)' : 'none',
                  transition: 'var(--transition)',
                }}
              >
                {i < currentTopicIndex ? '✓ ' : ''}{i + 1}. {topic}
              </button>
            ))}
          </div>

          {/* Content card */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Actual content — fades on tier change */}
            <div
              style={{
                padding: '24px 28px 20px',
                opacity: contentFading ? 0 : 1,
                transition: 'opacity 0.28s ease',
                minHeight: 360,
              }}
            >
              <ContentRenderer
                tier={currentTier}
                topic={currentTopic}
                customContent={customContent}
                contentSource={contentSource}
                rewrittenByClaude={rewrittenByClaude}
              />
            </div>

            {/* ── Sticky difficulty bar at bottom of content card ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.02)',
              gap: 12,
              flexWrap: 'wrap',
            }}>
              {/* Left: difficulty label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  DIFFICULTY
                </span>
                {/* Tier dots */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {TIERS.map((t, i) => (
                    <div
                      key={t}
                      style={{
                        width: tierIdx === i ? 22 : 8,
                        height: 8,
                        borderRadius: 99,
                        background: tierIdx === i ? currentTierMeta.color : 'rgba(255,255,255,0.1)',
                        transition: 'width 0.3s ease, background 0.3s ease',
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: currentTierMeta.color }}>
                  {currentTierMeta.label}
                </span>
              </div>

              {/* Right: Simpler / Harder buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Adjust:</span>
                <button
                  id="btn-simpler"
                  onClick={goSimpler}
                  disabled={tierIdx === 0}
                  style={{
                    all: 'unset', cursor: tierIdx === 0 ? 'not-allowed' : 'pointer',
                    padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: tierIdx === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(16,185,129,0.12)',
                    color: tierIdx === 0 ? 'var(--text-muted)' : '#6ee7b7',
                    border: `1px solid ${tierIdx === 0 ? 'var(--border)' : 'rgba(16,185,129,0.3)'}`,
                    transition: 'var(--transition)',
                    opacity: tierIdx === 0 ? 0.4 : 1,
                  }}
                >
                  ⬇ Simpler
                </button>
                <button
                  id="btn-harder"
                  onClick={goHarder}
                  disabled={tierIdx === TIERS.length - 1}
                  style={{
                    all: 'unset', cursor: tierIdx === TIERS.length - 1 ? 'not-allowed' : 'pointer',
                    padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: tierIdx === TIERS.length - 1 ? 'rgba(255,255,255,0.03)' : 'rgba(245,158,11,0.12)',
                    color: tierIdx === TIERS.length - 1 ? 'var(--text-muted)' : '#fcd34d',
                    border: `1px solid ${tierIdx === TIERS.length - 1 ? 'var(--border)' : 'rgba(245,158,11,0.3)'}`,
                    transition: 'var(--transition)',
                    opacity: tierIdx === TIERS.length - 1 ? 0.4 : 1,
                  }}
                >
                  ⬆ Harder
                </button>
              </div>
            </div>
          </div>

          {/* Prev / Next navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary" id="prev-topic-btn"
              onClick={() => goToTopic(Math.max(0, currentTopicIndex - 1))}
              disabled={currentTopicIndex === 0}
              style={{ opacity: currentTopicIndex === 0 ? 0.35 : 1 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Previous
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary" id="end-session-btn" onClick={endSession}
                style={{ color: 'var(--rose)', borderColor: 'rgba(244,63,94,0.25)' }}
              >
                End Session
              </button>
              {currentTopicIndex < topicNames.length - 1 ? (
                <button className="btn btn-primary" id="next-topic-btn" onClick={() => goToTopic(currentTopicIndex + 1)}>
                  Next Topic
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              ) : (
                <button className="btn btn-primary" id="finish-btn" onClick={endSession}>
                  Finish & See Results ✨
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Sidebar ─── */}
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
              onCameraStatusChange={setWebcamStatus}
            />
          </div>

          {/* Signal monitors */}
          <div style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Live Signals <span className="placeholder-tag">⚙ PLACEHOLDER</span>
            </div>
            {[
              { label: 'Mouse Speed', value: Math.round(signals.mouseVelocity), icon: '🖱️' },
              { label: 'Scroll Rate', value: Math.round(signals.scrollRate),    icon: '📜' },
              { label: 'Typing Pace', value: Math.round(signals.typingPace),    icon: '⌨️' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{icon} {label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{value}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              🔍 Monitoring for 45s before any suggestion
            </div>
          </div>

          {/* Session stats */}
          <div style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
              Session Stats
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Time',     value: formatTime(elapsedSeconds) },
                { label: 'Changes',  value: adaptationLog.length },
                { label: 'Topic',    value: `${currentTopicIndex + 1}/${topicNames.length}` },
                { label: 'Level',    value: currentTierMeta.short },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ flexShrink: 0 }}>
            <SessionTimeline adaptationLog={adaptationLog} totalSeconds={elapsedSeconds} />
          </div>

          {/* End session */}
          <button
            className="btn btn-secondary btn-sm" id="sidebar-end-btn" onClick={endSession}
            style={{ width: '100%', justifyContent: 'center', color: 'var(--rose)', borderColor: 'rgba(244,63,94,0.2)', flexShrink: 0 }}
          >
            End Session & See Results
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pre-session screen ──
function PreSessionScreen({ subject, topicNames, onStart, onBack }) {
  return (
    <div className="page">
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Navbar currentStep={4} />
      <div className="content-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <div className="animate-fadeInUp" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '44px 40px',
            boxShadow: 'var(--shadow-glow)', textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, margin: '0 auto 24px',
              boxShadow: '0 8px 30px rgba(99,102,241,0.4)', animation: 'pulse-glow 2s ease infinite',
            }}>🧠</div>

            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Ready to Begin?</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
              CogFlow will silently watch your reading behaviour and <strong style={{ color: 'var(--text-primary)' }}>suggest</strong> difficulty adjustments —
              but content only changes when <strong style={{ color: 'var(--text-primary)' }}>you decide</strong>.
            </p>

            {/* How it works */}
            <div style={{
              background: 'rgba(99,102,241,0.05)', borderRadius: 10, padding: '14px 16px',
              marginBottom: 20, textAlign: 'left', border: '1px solid rgba(99,102,241,0.12)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                How adaptation works
              </div>
              {[
                ['🔍', 'AI monitors your reading signals silently'],
                ['💡', 'After 45s it may suggest a difficulty change'],
                ['✋', 'You choose to Accept or Dismiss the suggestion'],
                ['⬇⬆', 'Or manually adjust anytime with Simpler / Harder'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Topic queue */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                {topicNames.length} Topic{topicNames.length !== 1 ? 's' : ''} in Queue
              </div>
              {topicNames.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                  borderBottom: i < topicNames.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--indigo-light)', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" id="back-from-prescreen" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button className="btn btn-primary btn-lg" id="start-session-btn" onClick={onStart} style={{ flex: 2, justifyContent: 'center' }}>
                Start Session 🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
