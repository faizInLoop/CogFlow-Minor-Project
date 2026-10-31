import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CognitiveLoadGauge from '../components/CognitiveLoadGauge';
import SessionTimeline from '../components/SessionTimeline';
import ContentRenderer, { getEducationalImageUrl, triggerFileDownload } from '../components/ContentRenderer';
import TopicAssessment from '../components/TopicAssessment';
import WebcamMonitor from '../components/WebcamMonitor';
import { SUBJECTS, getContent } from '../data/subjects';
import { saveSession, generateDynamicContent } from '../services/api';
import { useUser } from '../context/UserContext';
import {
  Brain, ArrowLeft, ArrowRight, CheckCircle2, Sliders, Activity,
  MousePointer, Scroll, Keyboard, Sparkles, AlertCircle, Clock,
  Maximize2, Minimize2, Eye, ShieldCheck, ChevronRight, Zap, Check, X, RefreshCw, BookOpen, Download, FileText
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Tier ordering: 1 = Simplified, 3 = Standard, 5 = Expert
// ─────────────────────────────────────────────────────────────
const TIERS = ['tier1', 'tier3', 'tier5'];
const TIER_META = {
  tier1: { key: '1', label: 'Simplified', short: 'B-Tier Foundations', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', badge: 'badge-emerald' },
  tier3: { key: '2', label: 'Standard',   short: 'A-Tier Core',        color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', badge: 'badge-indigo'  },
  tier5: { key: '3', label: 'Expert',     short: 'S-Tier Staff',       color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', badge: 'badge-amber'   },
};

// ─────────────────────────────────────────────────────────────
// Real-time interaction telemetry monitor
// ─────────────────────────────────────────────────────────────
function useSignalMonitor(isActive, currentTier, faceActiveRef) {
  const [signals, setSignals]         = useState({ mouseVelocity: 0, scrollRate: 0, typingPace: 0 });
  const [cogLoad, setCogLoad]         = useState(50);    // 0-100, for the gauge
  const [suggestion, setSuggestion]   = useState(null);  // 'simpler' | 'harder' | null
  const [dismissed, setDismissed]     = useState(false); // user dismissed current suggestion
  const mouseHistory   = useRef([]);
  const lastScrollY    = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const scrollDeltaAcc = useRef(0);
  const keystrokeTs    = useRef([]);
  const signalBuffer   = useRef([]);
  const observeSince   = useRef(Date.now());
  const currentTierRef = useRef(currentTier);
  currentTierRef.current = currentTier;

  useEffect(() => {
    if (!isActive) return;

    const onMouseMove = (e) => {
      const now = Date.now();
      mouseHistory.current.push({ x: e.clientX, y: e.clientY, t: now });
      if (mouseHistory.current.length > 8) mouseHistory.current.shift();
    };

    // Low-overhead accumulator: ZERO React re-renders on scroll
    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY.current);
      lastScrollY.current = window.scrollY;
      scrollDeltaAcc.current += dy;
    };

    // Low-overhead accumulator: ZERO React re-renders on keystroke
    const onKeyDown = () => {
      const now = Date.now();
      keystrokeTs.current.push(now);
      if (keystrokeTs.current.length > 10) keystrokeTs.current.shift();
    };

    // Batched single-tick telemetry update (runs once every 1000ms, eliminates UI stutter)
    const velTick = setInterval(() => {
      let vel = 0;
      if (mouseHistory.current.length >= 2) {
        const a = mouseHistory.current[0];
        const b = mouseHistory.current[mouseHistory.current.length - 1];
        const dt = (b.t - a.t) / 1000;
        const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
        vel = dt > 0 ? Math.min(100, dist / dt / 3) : 0;
      }

      const scrollRate = Math.min(100, Math.round(scrollDeltaAcc.current * 0.15));
      scrollDeltaAcc.current = 0; // reset for next 1s interval

      let typingPace = 0;
      if (keystrokeTs.current.length > 1) {
        const gaps = keystrokeTs.current.slice(1).map((t, i) => t - keystrokeTs.current[i]);
        const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        typingPace = Math.round(Math.max(0, 100 - avg / 5));
      }

      setSignals({
        mouseVelocity: Math.round(vel),
        scrollRate,
        typingPace
      });

      signalBuffer.current.push(vel);
      if (signalBuffer.current.length > 60) signalBuffer.current.shift();
    }, 1000);

    const classifyTick = setInterval(() => {
      const elapsedSinceChange = (Date.now() - (observeSince.current || Date.now())) / 1000;
      if (elapsedSinceChange < 30) return;
      if (dismissed) return;

      const buf = signalBuffer.current;
      if (buf.length === 0) return;
      const avgVel = buf.reduce((a, b) => a + b, 0) / buf.length;

      let load = 50;
      if (avgVel > 55) load = Math.max(10, 50 - (avgVel - 55) * 0.8);
      else if (avgVel < 15) load = Math.min(90, 50 + (15 - avgVel) * 2);
      load = Math.round(load);
      if (faceActiveRef?.current) return;

      setCogLoad(load);

      const tier = currentTierRef.current;
      const tierIdx = TIERS.indexOf(tier);

      if (load < 32 && tierIdx < TIERS.length - 1) {
        setSuggestion('harder');
      } else if (load > 70 && tierIdx > 0) {
        setSuggestion('simpler');
      }
    }, 25000);

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
    setTimeout(() => setDismissed(false), 45000);
  }, []);

  return { signals, cogLoad, setCogLoad, suggestion, setSuggestion, dismissSuggestion };
}

// ─────────────────────────────────────────────────────────────
// Main Interactive Learning Cockpit Component
// ─────────────────────────────────────────────────────────────
export default function LearningInterface() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};

  // Retrieve cached session or initialize safe fallback
  const getStoredSession = () => {
    try {
      const data = sessionStorage.getItem('cogflow_active_session');
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  };
  const stored = getStoredSession();

  // Active Subject resolution (NEVER null)
  const defaultSubject = SUBJECTS[0];
  const subject = navState.subject || stored?.subject || defaultSubject.name;
  
  // Active Topics resolution (NEVER empty)
  const defaultTopicNames = defaultSubject.topics.slice(0, 5).map(t => t.name);
  const topicNames = (navState.topicNames && navState.topicNames.length > 0)
    ? navState.topicNames
    : (stored?.topicNames && stored.topicNames.length > 0)
    ? stored.topicNames
    : defaultTopicNames;

  const topicVersions = navState.topicVersions || stored?.topicVersions || {};

  // Persist session to survive browser reloads
  useEffect(() => {
    try {
      sessionStorage.setItem('cogflow_active_session', JSON.stringify({
        subject,
        topicNames,
        topicVersions
      }));
    } catch {}
  }, [subject, topicNames, topicVersions]);

  // States
  const [isActive,           setIsActive]           = useState(true); // Active immediately!
  const [currentTopicIndex,  setCurrentTopicIndex]  = useState(0);
  const [currentTier,        setCurrentTier]        = useState('tier3'); // Start at Standard
  const [elapsedSeconds,     setElapsedSeconds]     = useState(0);
  const [adaptationLog,      setAdaptationLog]      = useState([]);
  const [contentFading,      setContentFading]      = useState(false);
  const [loadHistory,        setLoadHistory]        = useState([]);
  const [distractionFree,    setDistractionFree]    = useState(false);
  const [activeOverrideText, setActiveOverrideText] = useState(null);
  const [contentSource,      setContentSource]      = useState(null);
  const [topicAssessments,   setTopicAssessments]   = useState({});
  const [isSynthesizing,     setIsSynthesizing]     = useState(false);
  const [dynamicContent,     setDynamicContent]     = useState(null);
  const [dynamicImageUrl,    setDynamicImageUrl]    = useState(null);
  const [selectedAngle,      setSelectedAngle]      = useState('default');
  const [reGenTrigger,       setReGenTrigger]       = useState(0);
  const contentCacheRef                             = useRef({});

  const contentTopRef = useRef(null);
  const elapsedRef    = useRef(0);

  const faceActiveRef = useRef(false);
  const { signals, cogLoad, setCogLoad, suggestion, setSuggestion, dismissSuggestion } = useSignalMonitor(isActive, currentTier, faceActiveRef);

  const currentTierMeta = TIER_META[currentTier];
  const currentTopic    = topicNames[currentTopicIndex] || topicNames[0] || 'Core Principles';

  const loadingDescription = useMemo(() => {
    const t = (currentTopic || '').toLowerCase();
    if (t.includes('phonics') || t.includes('alphabet') || t.includes('number') || t.includes('lkg') || t.includes('ukg') || t.includes('rhyme') || t.includes('letter')) {
      return `Synthesizing playful phonics adventures, sound friends, and discovery maps for ${currentTopic}.`;
    }
    if (t.includes('plant') || t.includes('solar') || t.includes('water') || t.includes('nature') || t.includes('earth') || t.includes('science')) {
      return `Exploring natural world wonders, illustrated science cycles, and core insights for ${currentTopic}.`;
    }
    if (t.includes('newton') || t.includes('physics') || t.includes('motion') || t.includes('gravity') || t.includes('chemistry')) {
      return `Synthesizing empirical scientific laws, dynamic free-body schematics, and models for ${currentTopic}.`;
    }
    return `Building architectural blueprints, code patterns, and invariant analysis tailored to ${currentTopic}.`;
  }, [currentTopic]);

  // Track completion of topic mastery assessment
  const handleAssessmentComplete = useCallback((assessmentData) => {
    setTopicAssessments(prev => ({
      ...prev,
      [assessmentData.topic]: assessmentData
    }));
  }, []);

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => {
      setElapsedSeconds(s => { elapsedRef.current = s + 1; return s + 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [isActive]);

  // Track load history for results chart
  useEffect(() => {
    if (!isActive) return;
    setLoadHistory(prev => [...prev.slice(-120), { t: elapsedRef.current, load: cogLoad }]);
  }, [cogLoad, isActive]);

  // Reset override text on topic navigation
  useEffect(() => {
    setActiveOverrideText(null);
    setContentSource(null);
  }, [currentTopicIndex]);

  // Instantaneous curriculum presentation + background dynamic refinement
  useEffect(() => {
    let isCancelled = false;
    const cacheKey = `${currentTopic}:${currentTier}:${selectedAngle}:${reGenTrigger}`;
    const fallbackImageUrl = getEducationalImageUrl(currentTopic);

    // 1. Instant Cache hit (0ms)
    if (contentCacheRef.current[cacheKey]) {
      setDynamicContent(contentCacheRef.current[cacheKey].content);
      setContentSource(contentCacheRef.current[cacheKey].source);
      if (contentCacheRef.current[cacheKey].imageUrl) {
        setDynamicImageUrl(contentCacheRef.current[cacheKey].imageUrl);
      }
      setIsSynthesizing(false);
      return;
    }

    // 2. Uploaded syllabus version (0ms)
    if (topicVersions[currentTopic]?.[currentTier]) {
      setDynamicContent(topicVersions[currentTopic][currentTier]);
      setContentSource('uploaded_syllabus');
      setIsSynthesizing(false);
      return;
    }

    // 3. Immediately show verified curriculum lesson (0ms delay! NEVER block user with a spinner)
    const baseContent = getContent(currentTopic, currentTier);
    setDynamicContent(baseContent);
    setContentSource('adaptive_core_curriculum');
    setDynamicImageUrl(fallbackImageUrl);

    // 4. Background asynchronous refinement
    setIsSynthesizing(true);
    async function backgroundRefine() {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('timeout'), 1800));
        const fetchPromise = generateDynamicContent({
          subject,
          topic: currentTopic,
          tier: currentTier,
          cognitive_state: cogLoad < 35 ? 2 : cogLoad > 70 ? 1 : 0,
          angle: selectedAngle,
        });

        const data = await Promise.race([fetchPromise, timeoutPromise]);
        if (!isCancelled && data && data.content) {
          contentCacheRef.current[cacheKey] = {
            content: data.content,
            source: data.content_source || 'qwen_dynamic',
            imageUrl: data.image_url || fallbackImageUrl,
          };
          setDynamicContent(data.content);
          setContentSource(data.content_source || 'qwen_dynamic');
          if (data.image_url) setDynamicImageUrl(data.image_url);
        }
      } catch (err) {
        // Quietly maintain verified base content
      } finally {
        if (!isCancelled) setIsSynthesizing(false);
      }
    }

    backgroundRefine();
    return () => { isCancelled = true; };
  }, [currentTopic, currentTier, selectedAngle, reGenTrigger, topicVersions, subject]);

  // Change tier with a smooth fade + real-time adaptation
  const changeTier = useCallback((newTier, reason = 'manual') => {
    if (newTier === currentTier) return;
    setContentFading(true);
    setTimeout(() => {
      const prevTier = currentTier;
      setCurrentTier(newTier);
      setActiveOverrideText(null);
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
    }, 240);
  }, [currentTier, currentTopic]);

  // Manual difficulty controls
  const goSimpler = useCallback(() => {
    const idx = TIERS.indexOf(currentTier);
    if (idx > 0) changeTier(TIERS[idx - 1], 'manual-simpler');
  }, [currentTier, changeTier]);

  const goHarder = useCallback(() => {
    const idx = TIERS.indexOf(currentTier);
    if (idx < TIERS.length - 1) changeTier(TIERS[idx + 1], 'manual-harder');
  }, [currentTier, changeTier]);

  // Accept AI suggestion
  const acceptSuggestion = useCallback(() => {
    const idx = TIERS.indexOf(currentTier);
    if (suggestion === 'simpler' && idx > 0) changeTier(TIERS[idx - 1], 'ai-suggested');
    if (suggestion === 'harder'  && idx < TIERS.length - 1) changeTier(TIERS[idx + 1], 'ai-suggested');
    dismissSuggestion();
  }, [currentTier, suggestion, changeTier, dismissSuggestion]);

  // Hotkeys: 1/2/3 for tiers, Enter/Esc for suggestion
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [suggestion, acceptSuggestion, dismissSuggestion, changeTier]);

  const { user } = useUser();

  const endSession = () => {
    setIsActive(false);
    const avgLoad = loadHistory.length > 0
      ? Math.round(loadHistory.reduce((a, b) => a + b.load, 0) / loadHistory.length)
      : cogLoad;

    const assessmentsList = Object.values(topicAssessments);
    const avgQuizScore = assessmentsList.length > 0
      ? Math.round(assessmentsList.reduce((acc, a) => acc + (a.totalScore || 75), 0) / assessmentsList.length)
      : null;

    saveSession({
      user_id: user?.id || 'usr_default',
      subject: subject || 'General Learning',
      duration_seconds: elapsedRef.current,
      avg_cognitive_load: avgLoad,
      initial_tier: 'tier3',
      final_tier: currentTier,
      topics: topicNames,
      adaptation_log: adaptationLog,
      assessment_results: assessmentsList,
      quiz_score: avgQuizScore || 0,
    }).catch(err => console.warn('Could not auto-save session:', err));

    const resultsPayload = {
      subject,
      subjectId: location.state?.subjectId,
      topicNames,
      adaptationLog,
      totalSeconds: elapsedRef.current,
      avgLoad,
      finalTier: currentTier,
      topicAssessments,
      avgQuizScore,
    };
    try {
      sessionStorage.setItem('cogflow_last_results', JSON.stringify(resultsPayload));
    } catch {}

    navigate('/results', { state: resultsPayload });
  };

  const goToTopic = (idx) => {
    setCurrentTopicIndex(idx);
    setCurrentTier('tier3');
    contentTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById(`topic-tab-${idx}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const tierIdx = TIERS.indexOf(currentTier);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      {/* Top Cyber Header */}
      <Navbar currentStep={4} session={{ time: formatTime(elapsedSeconds), state: cogLoad < 35 ? 'bored' : cogLoad > 70 ? 'overload' : 'flow' }} />

      {/* ── AI Suggestion Toast (Glassmorphic Slide-in) ── */}
      {suggestion && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 500,
            background: 'var(--bg-card)',
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
              ? 'Elevated cognitive load detected. Transitioning to visual analogies and intuitive models?'
              : 'High comprehension pace detected. Ready to step up to staff-level engineering and invariants?'
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

      {/* ── Main Layout Canvas ── */}
      <div
        className="content-area"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: distractionFree ? '1fr' : 'minmax(0, 1fr) 350px',
          gap: 24,
          maxWidth: distractionFree ? 980 : 1380,
          margin: '0 auto',
          width: '100%',
          padding: '24px 24px 48px',
          transition: 'all 0.3s ease',
        }}
      >
        {/* ─── LEFT: Interactive Study Workspace ─── */}
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
                title={distractionFree ? 'Show telemetry sidebar' : 'Distraction-free focus mode'}
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
                <span className="hide-mobile">{distractionFree ? 'Cockpit' : 'Focus'}</span>
              </button>
            </div>
          </div>

          {/* Topic Navigation Tabs */}
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

          {/* ── High-Craft Dynamic Content Card ── */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'var(--shadow-card)',
          }}>
            {/* Dynamic Perspective & Angle Selector Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px', background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <Sparkles size={13} style={{ color: '#818cf8' }} />
                <span>Angle:</span>
                {[
                  { id: 'default', label: 'Balanced Core' },
                  { id: 'visual_metaphor', label: '🎨 Visual Metaphor' },
                  { id: 'production_failure', label: '💥 Incident Post-Mortem' },
                  { id: 'code_deepdive', label: '💻 Code Implementation' }
                ].map(a => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAngle(a.id)}
                    style={{
                      all: 'unset', cursor: 'pointer',
                      padding: '3px 9px', borderRadius: 6,
                      fontSize: 11, fontWeight: selectedAngle === a.id ? 700 : 500,
                      background: selectedAngle === a.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                      color: selectedAngle === a.id ? '#c7d2fe' : 'var(--text-muted)',
                      border: `1px solid ${selectedAngle === a.id ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {a.label}
                  </button>
                ))}

                {isSynthesizing && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, color: 'var(--theme-accent, #818cf8)',
                    background: 'var(--theme-accent-bg, rgba(99,102,241,0.12))',
                    border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.3))',
                    padding: '2px 8px', borderRadius: 6
                  }}>
                    <RefreshCw size={10} style={{ animation: 'spin 1.2s linear infinite' }} />
                    <span>AI Refining...</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    const filename = `${currentTopic.replace(/[^a-zA-Z0-9_-]/g, '_')}-StudyNotes.md`;
                    const notesContent = `# ${currentTopic} — Study Guide\nTier: ${currentTierMeta.label} (${currentTierMeta.short})\nSubject: ${subject}\n\n---\n\n${dynamicContent || activeOverrideText || getContent(currentTopic, currentTier)}`;
                    triggerFileDownload(filename, notesContent, 'text/markdown;charset=utf-8');
                  }}
                  title="Download complete study notes as Markdown"
                  style={{
                    all: 'unset', cursor: 'pointer',
                    padding: '4px 10px', borderRadius: 6,
                    fontSize: 11, fontWeight: 700,
                    background: 'rgba(56,189,248,0.1)', color: '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.25)',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Download size={11} />
                  Download Notes
                </button>

                <button
                  onClick={() => setReGenTrigger(c => c + 1)}
                  title="Re-synthesize this lesson with Qwen"
                  style={{
                    all: 'unset', cursor: 'pointer',
                    padding: '4px 10px', borderRadius: 6,
                    fontSize: 11, fontWeight: 700,
                    background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.25)',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <RefreshCw size={11} />
                  Re-Synthesize
                </button>
              </div>
            </div>

            {/* Reading Content Pane (Instantly visible & interactive in 0ms) */}
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
                activeOverrideText={dynamicContent || activeOverrideText}
                contentSource={contentSource}
                imageUrl={dynamicImageUrl}
              />
            </div>

            {/* Dynamic Tier Control Bar at Bottom of Content */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-card)',
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

          {/* ── Active Recall & Topic Mastery Assessment (MCQs + Qwen AI Typing Evaluation) ── */}
          <TopicAssessment
            topicName={currentTopic}
            tier={currentTier}
            cognitiveLoad={cogLoad}
            onAssessmentComplete={handleAssessmentComplete}
            initialResults={topicAssessments[currentTopic]}
          />

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
                onFaceActive={(active) => { faceActiveRef.current = active; }}
              />
            </div>

            {/* Live Interaction Signals */}
            <div className="card" style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={12} color="var(--indigo-light)" />
                Telemetry Fusion
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Pointer Velocity', val: `${signals.mouseVelocity} px/s`, icon: <MousePointer size={11} />, pct: signals.mouseVelocity },
                  { label: 'Reading Cadence',  val: `${signals.scrollRate}%`,       icon: <Scroll size={11} />,       pct: signals.scrollRate },
                  { label: 'Keystroke Rhythm', val: `${signals.typingPace}%`,       icon: <Keyboard size={11} />,     pct: signals.typingPace },
                ].map(({ label, val, icon, pct }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{val}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gradient-brand)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline of adaptations */}
            <div className="card" style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                Cognitive State History
              </div>
              <SessionTimeline log={adaptationLog} totalSeconds={elapsedSeconds} />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
