import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundEffects';
import {
  Clock, Target, Shuffle, BookOpen, Award, Sparkles, CheckCircle2,
  BarChart2, ArrowRight, RotateCcw, User, Home, Activity, TrendingUp, TrendingDown
} from 'lucide-react';

const TIER_COLORS = {
  tier1: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', text: '#6ee7b7', label: 'Simplified', hex: '#34d399' },
  tier3: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc', label: 'Standard',   hex: '#818cf8' },
  tier5: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d', label: 'Expert',     hex: '#fbbf24' },
};

const REASON_LABELS = {
  'manual-simpler': 'User Simplified',
  'manual-harder':  'User Stepped Up',
  'ai-suggested':   'AI Adapted',
  'manual':         'Manual Switch',
  'manual-pill':    'Quick Switch',
  'shortcut-key':   'Hotkey Switch',
};

export default function SessionResults() {
  const navigate = useNavigate();
  const location = useLocation();

  const stored = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('cogflow_last_results') || sessionStorage.getItem('cogflow_active_session') || '{}');
    } catch { return {}; }
  })();

  const navState = location.state || {};
  const subject = navState.subject || stored.subject || 'Computer Systems & OS Architecture';
  const topicNames = navState.topicNames || stored.topicNames || ['Foundational Architecture & Memory Hierarchy'];
  const adaptationLog = navState.adaptationLog || stored.adaptationLog || [];
  const totalSeconds = navState.totalSeconds !== undefined ? navState.totalSeconds : (stored.totalSeconds || 120);
  const avgLoad = navState.avgLoad !== undefined ? navState.avgLoad : (stored.avgLoad || 52);
  const topicAssessments = navState.topicAssessments || stored.topicAssessments || {};
  const avgQuizScore = navState.avgQuizScore !== undefined ? navState.avgQuizScore : (stored.avgQuizScore || 85);

  const canvasRef = useRef(null);

  // Celebratory confetti and audio chime on session completion
  useEffect(() => {
    if (totalSeconds >= 10) {
      sounds.playLevelUp();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#c084fc', '#38bdf8']
        });
      } catch {}
    }
  }, [totalSeconds]);

  // Draw smooth tier-based timeline on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || totalSeconds < 1) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Grid lines & labels
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    [
      { label: 'Simplified', y: H * 0.8 },
      { label: 'Standard',   y: H * 0.5 },
      { label: 'Expert',     y: H * 0.2 },
    ].forEach(({ label, y }) => {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(label, 6, y - 4);
    });

    // Build tier segments
    const TIER_Y = { tier1: H * 0.8, tier3: H * 0.5, tier5: H * 0.2 };
    const TIER_HEX = { tier1: '#34d399', tier3: '#818cf8', tier5: '#fbbf24' };
    const segments = [];
    let prevTier = 'tier3';
    let prevTime = 0;

    adaptationLog.forEach(e => {
      segments.push({ tier: prevTier, from: prevTime, to: e.time });
      prevTier = e.to;
      prevTime = e.time;
    });
    segments.push({ tier: prevTier, from: prevTime, to: totalSeconds });

    if (segments.length === 1) {
      const y = TIER_Y[segments[0].tier] || H / 2;
      const col = TIER_HEX[segments[0].tier] || '#818cf8';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const x1 = (seg.from / totalSeconds) * W;
        const x2 = (seg.to / totalSeconds) * W;
        const y1 = TIER_Y[segments[i === 0 ? 0 : i - 1]?.tier] || H / 2;
        const y2 = TIER_Y[seg.tier] || H / 2;

        ctx.beginPath();
        ctx.moveTo(x1, i === 0 ? y2 : y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = TIER_HEX[seg.tier] || '#818cf8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Pulsing glow point at start of segment
        ctx.beginPath();
        ctx.arc(x1, y2, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = TIER_HEX[seg.tier] || '#818cf8';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#07090e';
        ctx.stroke();
      }
    }
  }, [adaptationLog, totalSeconds]);

  // subject guaranteed by fallback

  // Compute tier time breakdown
  const tierSeconds = { tier1: 0, tier3: 0, tier5: 0 };
  let prevTier = 'tier3';
  let prevTime2 = 0;

  adaptationLog.forEach(e => {
    const dur = e.time - prevTime2;
    if (tierSeconds[prevTier] !== undefined) tierSeconds[prevTier] += dur;
    prevTier = e.to;
    prevTime2 = e.time;
  });
  const lastDur = totalSeconds - prevTime2;
  if (tierSeconds[prevTier] !== undefined) tierSeconds[prevTier] += lastDur;

  const total = Math.max(1, totalSeconds);
  const simplifiedPct = Math.round((tierSeconds.tier1 / total) * 100);
  const standardPct   = Math.round((tierSeconds.tier3 / total) * 100);
  const expertPct     = Math.round((tierSeconds.tier5 / total) * 100);

  const tooShort = totalSeconds < 10;
  const engagementScore = tooShort ? 0 : Math.min(100, Math.round(
    standardPct * 0.5 + expertPct * 1.0 + simplifiedPct * 0.35 + 20
  ));

  const formatTime = (s) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const score = tooShort ? 0 : Math.min(100, engagementScore);
  const scoreLabel = tooShort ? 'Early Exit' : score >= 75 ? 'Flow Mastery' : score >= 50 ? 'Strong Focus' : 'Developing';
  const scoreColor = tooShort ? '#818cf8' : score >= 75 ? '#34d399' : score >= 50 ? '#818cf8' : '#fbbf24';

  return (
    <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Navbar currentStep={0} />

      <div className="content-area" style={{ flex: 1, padding: '36px 24px 80px' }}>
        <div className="container" style={{ maxWidth: 1000 }}>

          {/* Header & Flow Score Meter */}
          <div className="animate-fadeInUp" style={{ textAlign: 'center', marginBottom: 44 }}>
            {/* Concentric Score Dial */}
            <div style={{
              width: 130, height: 130, borderRadius: '50%',
              background: `conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: `0 0 35px ${scoreColor}35`,
              position: 'relative',
            }}>
              <div style={{
                width: 106, height: 106, borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif', color: scoreColor, lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                  Flow Index
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {tooShort ? 'Session Completed Early' : 'Cognitive Session Summary'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, marginBottom: 12 }}>
              {subject} · {formatTime(totalSeconds)} Duration · {topicNames.length} {topicNames.length === 1 ? 'Topic' : 'Topics'} Covered
            </p>

            {tooShort ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 99,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                color: 'var(--indigo-light)', fontSize: 12, fontWeight: 600,
              }}>
                Study for at least 30 seconds for full biometric profiling
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 16px', borderRadius: 99,
                background: `${scoreColor}15`, border: `1px solid ${scoreColor}40`,
                color: scoreColor, fontSize: 12, fontWeight: 700,
              }}>
                <Sparkles size={13} />
                {scoreLabel}
              </span>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid-4 animate-fadeInUp delay-100" style={{ marginBottom: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { label: 'Total Duration', value: formatTime(totalSeconds), icon: <Clock size={18} color="var(--indigo-light)" />, sub: 'Active reading time' },
              { label: 'Standard Depth', value: `${standardPct}%`, icon: <Target size={18} color="#818cf8" />, sub: formatTime(tierSeconds.tier3) },
              { label: 'Adaptations', value: adaptationLog.length, icon: <Shuffle size={18} color="#34d399" />, sub: 'Dynamic tier shifts' },
              { label: 'Completed Topics', value: topicNames.length, icon: <BookOpen size={18} color="#fbbf24" />, sub: 'Curriculum nodes' },
            ].map(({ label, value, icon, sub }) => (
              <div key={label} className="card" style={{ padding: '20px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>{icon}</div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Chart + State Breakdown */}
          <div className="grid-2 animate-fadeInUp delay-200" style={{ marginBottom: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>

            {/* Timeline Canvas */}
            <div className="card" style={{ padding: '22px', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart2 size={13} style={{ color: 'var(--indigo-light)' }} />
                Depth Timeline Trajectory
              </div>
              <canvas
                ref={canvasRef}
                width={420} height={150}
                style={{ width: '100%', height: 150, borderRadius: 8, background: 'rgba(7,9,14,0.4)', border: '1px solid var(--border)' }}
              />
              <div style={{ display: 'flex', gap: 16, marginTop: 14, justifyContent: 'center' }}>
                {Object.entries(TIER_COLORS).map(([tier, cfg]) => (
                  <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.hex, boxShadow: `0 0 6px ${cfg.hex}80` }} />
                    {cfg.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Tier Breakdown */}
            <div className="card" style={{ padding: '22px', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={13} style={{ color: 'var(--indigo-light)' }} />
                Difficulty Tier Distribution
              </div>
              {[
                { tier: 'tier1', pct: simplifiedPct, seconds: tierSeconds.tier1 },
                { tier: 'tier3', pct: standardPct,   seconds: tierSeconds.tier3 },
                { tier: 'tier5', pct: expertPct,     seconds: tierSeconds.tier5 },
              ].map(({ tier, pct, seconds }) => {
                const cfg = TIER_COLORS[tier];
                return (
                  <div key={tier} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.hex }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.text }}>{cfg.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(seconds)}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.text, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cfg.hex, borderRadius: 99, transition: 'width 1s ease', boxShadow: `0 0 8px ${cfg.hex}60` }} />
                    </div>
                  </div>
                );
              })}

              {/* Performance Insight */}
              <div style={{
                marginTop: 14, padding: '12px 14px',
                background: 'rgba(99,102,241,0.05)', borderRadius: 10,
                border: '1px solid rgba(99,102,241,0.15)', fontSize: 12,
                color: 'var(--text-secondary)', lineHeight: 1.55, display: 'flex', alignItems: 'flex-start', gap: 8
              }}>
                <Sparkles size={14} style={{ color: 'var(--indigo-light)', flexShrink: 0, marginTop: 2 }} />
                <span>
                  {expertPct >= 40
                    ? `Exceptional performance: ${expertPct}% of your session was spent at Expert depth with minimal cognitive strain.`
                    : simplifiedPct >= 50
                    ? `High cognitive load absorbed: ${simplifiedPct}% spent in Simplified mode to ensure core concept mastery.`
                    : `Balanced session: Stable comprehension and sustained focus throughout standard curriculum depth.`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Topics Covered */}
          <div className="card animate-fadeInUp delay-300" style={{ marginBottom: 28, padding: '22px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>
              Topics Mastered in Session
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {topicNames.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                  borderRadius: 99, padding: '6px 14px',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--indigo-light)', fontWeight: 800 }}>#{i + 1}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{t}</span>
                  <CheckCircle2 size={13} color="#10b981" />
                </div>
              ))}
            </div>
          </div>

          {/* Active Recall & AI Assessment Outcomes */}
          <div className="card animate-fadeInUp delay-350" style={{ marginBottom: 28, padding: '24px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#818cf8',
                }}>
                  <Award size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Active Recall & AI Assessment Outcomes
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Verified conceptual mastery & free-form typing evaluation
                  </div>
                </div>
              </div>

              {avgQuizScore !== null && (
                <span className="badge badge-emerald" style={{ fontSize: 12 }}>
                  {avgQuizScore}% Overall Mastery
                </span>
              )}
            </div>

            {Object.keys(topicAssessments).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.values(topicAssessments).map((item, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                        {item.topic}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          MCQ: {item.correctCount}/{item.totalMCQs}
                        </span>
                        <span style={{ fontSize: 11, color: item.typingScore >= 80 ? '#34d399' : '#fbbf24', background: item.typingScore >= 80 ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                          Score: {item.totalScore}%
                        </span>
                      </div>
                    </div>

                    {item.aiEvaluation && (
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: 2 }}>
                          Qwen AI Verdict: {item.aiEvaluation.verdict}
                        </div>
                        <div>{item.aiEvaluation.strengths}</div>
                        {item.aiEvaluation.constructive_feedback && (
                          <div style={{ color: '#cbd5e1', marginTop: 4, fontStyle: 'italic' }}>
                            "{item.aiEvaluation.constructive_feedback}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No active recall assessments submitted for this session. Complete the end-of-topic mastery checks to record evaluated scores.
              </div>
            )}
          </div>

          {/* Adaptation Log */}
          {adaptationLog.length > 0 && (
            <div className="card animate-fadeInUp delay-400" style={{ marginBottom: 28, padding: '22px', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>
                Dynamic Adaptation Timeline · {adaptationLog.length} Shift{adaptationLog.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {adaptationLog.map((entry, i) => {
                  const fromCfg = TIER_COLORS[entry.from] || TIER_COLORS.tier3;
                  const toCfg   = TIER_COLORS[entry.to]   || TIER_COLORS.tier3;
                  const reasonLabel = REASON_LABELS[entry.reason] || 'Manual Adjustment';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                      padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.015)',
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text-muted)', width: 40, flexShrink: 0 }}>
                        {Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: fromCfg.bg, color: fromCfg.text, border: `1px solid ${fromCfg.border}`, fontWeight: 700 }}>
                        {entry.fromLabel || fromCfg.label}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: toCfg.bg, color: toCfg.text, border: `1px solid ${toCfg.border}`, fontWeight: 700 }}>
                        {entry.toLabel || toCfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {reasonLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Database Persistence Status */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              color: '#6ee7b7', padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600
            }}>
              <CheckCircle2 size={13} />
              Session & topic mastery successfully synced to your profile history
            </span>
          </div>

          {/* Action Buttons */}
          <div className="animate-fadeInUp delay-400" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="view-profile-btn"
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/profile')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <User size={15} />
              View Profile & History
            </button>
            <button
              id="study-again-btn"
              className="btn btn-primary btn-lg"
              onClick={() => {
                if (location.state?.subjectId) {
                  navigate(`/topics?subject=${location.state.subjectId}`);
                } else {
                  navigate('/subjects');
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RotateCcw size={15} />
              Study Again
            </button>
            <button
              id="home-btn"
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Home size={15} />
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
