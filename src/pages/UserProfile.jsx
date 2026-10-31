import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getSessionHistory, getUserProgress, getUserAnalytics } from '../services/api';
import Navbar from '../components/Navbar';
import {
  Brain, Clock, Sparkles, BookOpen, ChevronRight, User, Settings,
  Award, TrendingUp, RefreshCw, Calendar, CheckCircle2, ArrowLeft,
  Edit3, Shield, Zap, Layers, PlusCircle, AlertCircle, SlidersHorizontal,
  GraduationCap, History, Check, X
} from 'lucide-react';

const TIER_COLORS = {
  tier1: { label: 'Simplified', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  tier3: { label: 'Standard',   color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
  tier5: { label: 'Expert',     color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
};

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, allUsers, switchUser, createUser, updateProfile } = useUser();

  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'sessions' | 'calibration'
  const [sessions, setSessions] = useState([]);
  const [progressData, setProgressData] = useState({ total_topics: 0, by_subject: {}, topics: [] });
  const [analytics, setAnalytics] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editGrade, setEditGrade] = useState(user?.grade_level || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  // Fetch history & analytics when user changes
  useEffect(() => {
    let mounted = true;
    async function fetchUserData() {
      if (!user?.id) return;
      setLoadingData(true);
      try {
        const [hist, prog, anal] = await Promise.all([
          getSessionHistory(user.id),
          getUserProgress(user.id),
          getUserAnalytics(user.id)
        ]);
        if (mounted) {
          setSessions(hist);
          setProgressData(prog);
          setAnalytics(anal);
        }
      } catch (err) {
        console.error('Error fetching user profile data:', err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    }
    fetchUserData();
    return () => { mounted = false; };
  }, [user?.id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: editName,
        grade_level: editGrade,
        avatar: '🎓',
        email: editEmail
      });
      setIsEditModalOpen(false);
    } catch {
      alert('Error updating profile');
    }
  };

  const handleCreateNewUser = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      await createUser({
        name: editName,
        grade_level: editGrade || 'Student',
        avatar: '🎓',
        email: editEmail || `${editName.toLowerCase().replace(/\s+/g, '')}@cogflow.ai`
      });
      setIsCreateModalOpen(false);
    } catch {
      alert('Error creating user profile');
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m ${sec % 60}s`;
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CF';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Navbar currentStep={0} />

      <main className="container" style={{ flex: 1, padding: '32px 24px 60px', maxWidth: 1140 }}>
        {/* ── Top Navigation Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: 'var(--text-muted)', fontWeight: 600,
              transition: 'var(--transition)'
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* Profile Switcher dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Learner:</span>
            <select
              value={user?.id || 'usr_default'}
              onChange={(e) => {
                const selected = allUsers.find(u => u.id === e.target.value);
                if (selected) switchUser(selected);
              }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  {u.name} ({u.grade_level || 'Learner'})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setEditName('');
                setEditGrade('B.Tech Computer Science');
                setEditEmail('');
                setIsCreateModalOpen(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <PlusCircle size={14} /> New Learner
            </button>
          </div>
        </div>

        {/* ── Profile Header Card ── */}
        <div style={{
          background: 'var(--gradient-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: 'var(--shadow-card)',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background ambient blur */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 220, height: 220,
            borderRadius: '50%', background: 'rgba(99,102,241,0.1)', filter: 'blur(60px)', pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Monogram Ring Avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))',
              border: '2px solid rgba(129,140,248,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 22, fontWeight: 800, color: '#c7d2fe',
              boxShadow: '0 0 24px rgba(99,102,241,0.25)'
            }}>
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  {user?.name || 'Student Profile'}
                </h1>
                <span className="badge badge-indigo" style={{ fontSize: 10, padding: '2px 8px' }}>
                  Calibrated Learner
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                {user?.grade_level || 'B.Tech Computer Science'} · {user?.email || 'student@cogflow.ai'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                setEditName(user?.name || '');
                setEditGrade(user?.grade_level || '');
                setEditEmail(user?.email || '');
                setIsEditModalOpen(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
            <button
              onClick={() => navigate('/choose-path')}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Start Session <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Key Cognitive Analytics Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}>
          {[
            {
              label: 'Total Study Time',
              value: formatSeconds(analytics?.total_study_time_seconds || 0),
              icon: <Clock size={18} color="var(--indigo-light)" />,
              desc: `${analytics?.total_sessions || 0} completed sessions`
            },
            {
              label: 'Optimal Flow Ratio',
              value: `${analytics?.flow_state_percentage || 78}%`,
              icon: <Sparkles size={18} color="#34d399" />,
              desc: 'Time spent in peak cognitive focus'
            },
            {
              label: 'Avg Cognitive Load',
              value: `${analytics?.avg_cognitive_load || 50}%`,
              icon: <Brain size={18} color="#c084fc" />,
              desc: analytics?.avg_cognitive_load > 65 ? 'High demand curve' : 'Balanced load curve'
            },
            {
              label: 'Mastered Topics',
              value: progressData.total_topics || 0,
              icon: <BookOpen size={18} color="#fbbf24" />,
              desc: `${analytics?.total_adaptations_mitigated || 0} adaptations recorded`
            }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {stat.label}
                </span>
                <div style={{
                  padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {stat.icon}
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {stat.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Navigation Tabs ── */}
        <div style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12,
          marginBottom: 24
        }}>
          {[
            { id: 'topics', label: 'Curriculum & Topic Mastery', icon: <GraduationCap size={15} />, count: progressData.total_topics },
            { id: 'sessions', label: 'Session Telemetry Logs', icon: <History size={15} />, count: sessions.length },
            { id: 'calibration', label: 'Biometric AI Calibration', icon: <SlidersHorizontal size={15} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                background: activeTab === tab.id ? 'rgba(99,102,241,0.14)' : 'transparent',
                color: activeTab === tab.id ? 'var(--indigo-light)' : 'var(--text-muted)',
                border: activeTab === tab.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'var(--transition)'
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 10,
                  background: activeTab === tab.id ? 'var(--indigo)' : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Learned Topics & Mastery History ── */}
        {activeTab === 'topics' && (
          <div>
            {Object.keys(progressData.by_subject || {}).length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '56px 24px', background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)'
              }}>
                <BookOpen size={36} color="var(--indigo-light)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>No Topics Mastered Yet</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '6px auto 18px', lineHeight: 1.6 }}>
                  Complete a study session to automatically log curriculum progress, highest depth tiers unlocked, and mastery retention scores.
                </p>
                <button onClick={() => navigate('/choose-path')} className="btn btn-primary btn-sm">
                  Start Learning Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(progressData.by_subject).map(([subject, topics]) => (
                  <div key={subject} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-card)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BookOpen size={18} style={{ color: 'var(--indigo-light)' }} />
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{subject}</h2>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{topics.length} topics mastered</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                      {topics.map(t => {
                        const tierMeta = TIER_COLORS[t.highest_tier_reached] || TIER_COLORS.tier3;
                        return (
                          <div key={t.id} style={{
                            background: 'rgba(255,255,255,0.015)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '16px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {t.topic_name}
                              </div>
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                background: tierMeta.bg, color: tierMeta.color, border: `1px solid ${tierMeta.border}`
                              }}>
                                {tierMeta.label}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                              <span>Retention Score</span>
                              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{t.mastery_score}%</span>
                            </div>
                            <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 12 }}>
                              <div style={{ height: '100%', width: `${t.mastery_score}%`, background: 'var(--gradient-brand)', borderRadius: 99 }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                              <span>Reviewed {t.times_reviewed}x</span>
                              <span>{formatDate(t.last_reviewed)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Past Learning Sessions ── */}
        {activeTab === 'sessions' && (
          <div>
            {sessions.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '56px 24px', background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)'
              }}>
                <Clock size={36} color="var(--indigo-light)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>No Past Sessions Logged</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 380, margin: '6px auto 18px', lineHeight: 1.6 }}>
                  Completed study sessions with webcam telemetry, average cognitive loads, and adaptation charts will appear here.
                </p>
                <button onClick={() => navigate('/choose-path')} className="btn btn-primary btn-sm">
                  Start First Session
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sessions.map(s => {
                  const finalMeta = TIER_COLORS[s.final_tier] || TIER_COLORS.tier3;
                  return (
                    <div key={s.id} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                      boxShadow: 'var(--shadow-card)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12,
                          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Brain size={20} style={{ color: 'var(--indigo-light)' }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{s.subject}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                              background: finalMeta.bg, color: finalMeta.color, border: `1px solid ${finalMeta.border}`
                            }}>
                              Ended at {finalMeta.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            {formatDate(s.created_at)} · {formatSeconds(s.duration_seconds)} · {s.topics?.length || 0} topics covered
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>
                            {s.avg_cognitive_load}%
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Avg Load</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: s.adaptations_count > 0 ? '#fbbf24' : '#34d399' }}>
                            {s.adaptations_count}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Adaptations</div>
                        </div>

                        <button
                          onClick={() => {
                            navigate('/results', {
                              state: {
                                subject: s.subject,
                                topicNames: s.topics,
                                adaptationLog: s.adaptation_log,
                                totalSeconds: s.duration_seconds,
                                avgLoad: s.avg_cognitive_load
                              }
                            });
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: '6px 12px' }}
                        >
                          View Analytics Chart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Personal AI Telemetry Calibration ── */}
        {activeTab === 'calibration' && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '28px', boxShadow: 'var(--shadow-card)'
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SlidersHorizontal size={18} style={{ color: 'var(--indigo-light)' }} />
              Personal Biometric Calibration Settings
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22, lineHeight: 1.6, maxWidth: 640 }}>
              These geometric thresholds calibrate the MediaPipe and BiLSTM neural inference to your individual resting baseline, ensuring expressions of curiosity are not misclassified as frustration.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'rgba(255,255,255,0.015)', padding: '18px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AU4 Brow Furrow Baseline</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--indigo-light)', fontFamily: 'Space Grotesk, sans-serif', marginTop: 6 }}>
                  {user?.baseline_brow?.toFixed(4) || '0.0050'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                  Neutral forehead & brow resting tension score.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.015)', padding: '18px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AU7 Squint Baseline</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399', fontFamily: 'Space Grotesk, sans-serif', marginTop: 6 }}>
                  {user?.baseline_squint?.toFixed(2) || '0.35'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                  Natural eyelid aperture during focused screen reading.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.015)', padding: '18px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entry Depth Tier</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', fontFamily: 'Space Grotesk, sans-serif', marginTop: 6 }}>
                  Standard (Tier 3)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                  Recommended baseline difficulty for new topics.
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: 'rgba(99,102,241,0.05)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.18)', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={16} style={{ color: 'var(--indigo-light)', flexShrink: 0 }} />
              <span><strong>Autonomous Calibration:</strong> Clicking <em>Enable AI</em> during any active study session fine-tunes your personal baseline over the first 5 seconds.</span>
            </div>
          </div>
        )}
      </main>

      {/* ── Edit Profile Modal ── */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
            padding: '28px', maxWidth: 440, width: '90%', boxShadow: 'var(--shadow-glow)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Edit Learner Profile</h2>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Learner Name</label>
                <input
                  type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Program / Degree</label>
                <input
                  type="text" value={editGrade} onChange={e => setEditGrade(e.target.value)} required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Email</label>
                <input
                  type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create New User Modal ── */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
            padding: '28px', maxWidth: 440, width: '90%', boxShadow: 'var(--shadow-glow)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Create New Learner Profile</h2>
            <form onSubmit={handleCreateNewUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Learner Name</label>
                <input
                  type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Mayank Garg" required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Program / Degree</label>
                <input
                  type="text" value={editGrade} onChange={e => setEditGrade(e.target.value)} placeholder="e.g. B.Tech Computer Science"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
