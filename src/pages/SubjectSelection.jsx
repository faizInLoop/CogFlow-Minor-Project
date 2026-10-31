import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { SUBJECTS, createCustomUniversalSubject } from '../data/subjects';
import { sounds } from '../utils/soundEffects';
import { 
  ArrowLeft, Search, Check, ArrowRight, Layers, Sparkles, Clock, X,
  PlusCircle, GraduationCap, Compass, HelpCircle, BookOpen
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Tracks' },
  { id: 'early-school', label: '👶 LKG & Primary (K-5)' },
  { id: 'high-school', label: '🔬 Middle & High School (6-12)' },
  { id: 'systems-tech', label: '💻 Computer Science & AI' },
  { id: 'humanities', label: '📈 Finance & Humanities' }
];

const GRADE_PRESETS = [
  'LKG & UKG (Ages 3-5)',
  'Class 1 to 5 (Primary)',
  'Class 6 to 8 (Middle School)',
  'Class 9 to 12 (High School)',
  'Undergraduate / College',
  'Professional / Lifelong Learner'
];

export default function SubjectSelection() {
  const navigate = useNavigate();
  const [allSubjectsList, setAllSubjectsList] = useState(SUBJECTS);
  const [selected, setSelected] = useState('cs-systems');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Custom Subject Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customGradeLevel, setCustomGradeLevel] = useState(GRADE_PRESETS[1]);
  const [customSubtopicsInput, setCustomSubtopicsInput] = useState('');

  // Dynamic Category Counts
  const categoryCounts = useMemo(() => {
    const counts = { all: allSubjectsList.length };
    CATEGORIES.forEach(c => {
      if (c.id !== 'all') {
        counts[c.id] = allSubjectsList.filter(s => s.category === c.id || s.id === c.id).length;
      }
    });
    return counts;
  }, [allSubjectsList]);

  const filtered = useMemo(() => {
    return allSubjectsList.filter(s => {
      const q = search.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.topics.some(t => t.name.toLowerCase().includes(q));
      
      const matchesCategory = activeCategory === 'all' || s.category === activeCategory || s.id === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allSubjectsList, search, activeCategory]);

  const selectedSubject = allSubjectsList.find(s => s.id === selected) || allSubjectsList[0];

  const handleSelect = (id) => {
    sounds.playClick();
    setSelected(id);
  };

  const handleContinue = () => {
    if (!selected) return;
    sounds.playLevelUp();
    navigate(`/topics?subject=${selected}`);
  };

  const handleCreateCustom = (e) => {
    e.preventDefault();
    const name = customSubjectName.trim();
    if (!name) return;

    sounds.playLevelUp();
    const subtopicsList = customSubtopicsInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const customTopics = subtopicsList.length > 0
      ? subtopicsList.map((tName, i) => ({
          id: `custom-mod-${i + 1}`,
          name: tName,
          subtopics: ['Core Concepts & Foundations', 'Visual Flow & Step-by-Step Walkthrough', 'Key Rules & Practice Review']
        }))
      : [];

    const newSubj = createCustomUniversalSubject(name, customGradeLevel, customTopics);
    setAllSubjectsList(prev => [newSubj, ...prev]);
    setSelected(newSubj.id);
    setIsModalOpen(false);
    setCustomSubjectName('');
    setCustomSubtopicsInput('');
  };

  return (
    <div className="page" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentStep={2} />

      {/* Main Content Area with generous bottom clearance for floating bar */}
      <div style={{ flex: 1, padding: '32px 24px 150px', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ maxWidth: 1200 }}>

          {/* Top Breadcrumb & Step Counter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button 
              onClick={() => {
                sounds.playClick();
                navigate('/choose-path');
              }}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <ArrowLeft size={16} />
              Back to Pathways
            </button>

            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--theme-accent, #818cf8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Step 2 of 3 · Universal Curriculum Catalog
            </span>
          </div>

          {/* Header Title & Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(24px, 3.2vw, 34px)', fontWeight: 800, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.02em' }}>
                Universal Subjects & Technical Tracks
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 640 }}>
                From Kindergarten foundations to staff engineering invariants — or synthesize any custom curriculum on demand with Qwen AI.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 440 }}>
              {/* Search Input */}
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 38, paddingRight: search ? 36 : 14, fontSize: 13, height: 40 }}
                  placeholder="Search tracks, topics, invariants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      all: 'unset', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      cursor: 'pointer', color: 'var(--text-muted)'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Create Any Subject Action Button */}
              <button
                onClick={() => { sounds.playClick(); setIsModalOpen(true); }}
                className="btn btn-primary"
                style={{
                  fontSize: 13,
                  height: 40,
                  padding: '0 16px',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <PlusCircle size={15} />
                Create Any Subject
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="filter-tabs-container" style={{ marginBottom: 26 }}>
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat.id];
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => { sounds.playClick(); setActiveCategory(cat.id); }}
                  className={`category-pill ${isActive ? 'active' : ''}`}
                  style={{ gap: 8 }}
                >
                  <span>{cat.label}</span>
                  {typeof count === 'number' && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      opacity: isActive ? 1 : 0.6,
                      background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                      padding: '1px 6px',
                      borderRadius: 9999
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid of Subject Cards */}
          <div className="grid-2" style={{ gap: 20, marginBottom: 30 }}>

            {filtered.map((sub) => {
              const isSelected = selected === sub.id;

              return (
                <SpotlightCard
                  key={sub.id}
                  onClick={() => handleSelect(sub.id)}
                  spotlightColor={isSelected ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)"}
                  borderColor={isSelected ? "var(--theme-accent, #818cf8)" : "rgba(255, 255, 255, 0.08)"}
                  className="hover-lift"
                  style={{
                    padding: '24px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isSelected 
                      ? 'linear-gradient(180deg, rgba(20,20,28,0.9) 0%, rgba(12,12,16,0.95) 100%)' 
                      : 'linear-gradient(180deg, rgba(14,14,18,0.8) 0%, rgba(8,8,11,0.9) 100%)',
                    borderWidth: isSelected ? '1.5px' : '1px',
                    position: 'relative',
                    borderRadius: 18,
                    boxShadow: isSelected 
                      ? '0 12px 32px rgba(0,0,0,0.6), 0 0 20px var(--theme-accent-bg, rgba(99,102,241,0.2))'
                      : '0 4px 18px rgba(0,0,0,0.3)',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Selected Active Checkmark Pill */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: 18,
                      right: 18,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--theme-accent, #818cf8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 12px var(--theme-accent, #818cf8)'
                    }}>
                      <Check size={13} color="#ffffff" strokeWidth={3} />
                    </div>
                  )}

                  <div>
                    {/* Top Row: Icon + Level Badge + Estimated Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        background: isSelected ? 'var(--theme-accent-bg, rgba(99,102,241,0.2))' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'var(--theme-accent-border, rgba(129,140,248,0.4))' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 21,
                        flexShrink: 0
                      }}>
                        {sub.icon || '📚'}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingRight: isSelected ? 26 : 0 }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: isSelected ? 'var(--theme-accent, #818cf8)' : 'var(--text-secondary)',
                          background: isSelected ? 'var(--theme-accent-bg, rgba(99,102,241,0.15))' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isSelected ? 'var(--theme-accent-border, rgba(129,140,248,0.3))' : 'rgba(255,255,255,0.06)'}`,
                          padding: '2px 8px',
                          borderRadius: 6
                        }}>
                          {sub.gradeLevel || `${sub.topics.length} Modules`}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          ~{sub.topics.length * 8}m
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 style={{ 
                      fontSize: 17.5, 
                      fontWeight: 800, 
                      color: '#ffffff', 
                      marginBottom: 6,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.3
                    }}>
                      {sub.name}
                    </h2>

                    {/* Description */}
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: 13, 
                      lineHeight: 1.55, 
                      marginBottom: 16,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {sub.desc}
                    </p>

                    {/* Clean Structured Module Peek (No messy pill wrapping) */}
                    <div style={{
                      padding: '11px 13px',
                      borderRadius: 10,
                      background: isSelected ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${isSelected ? 'var(--theme-accent-border, rgba(129,140,248,0.22))' : 'rgba(255,255,255,0.05)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginBottom: 16
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                        <span>Curriculum Highlights</span>
                        <span style={{ color: isSelected ? 'var(--theme-accent, #818cf8)' : 'var(--text-muted)' }}>
                          {sub.topics.length} Modules
                        </span>
                      </div>

                      {sub.topics.slice(0, 3).map((t, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          fontSize: 12.5, 
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)' 
                        }}>
                          <span style={{ 
                            width: 5, 
                            height: 5, 
                            borderRadius: '50%', 
                            background: isSelected ? 'var(--theme-accent, #818cf8)' : 'rgba(255,255,255,0.25)', 
                            flexShrink: 0 
                          }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.name}
                          </span>
                        </div>
                      ))}

                      {sub.topics.length > 3 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 13, fontStyle: 'italic' }}>
                          +{sub.topics.length - 3} additional calibrated topics
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Action */}
                  <div style={{
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: isSelected ? 'var(--theme-accent, #818cf8)' : 'var(--text-muted)'
                  }}>
                    <span>{isSelected ? 'Curriculum Selected' : 'Select Track'}</span>
                    <ArrowRight size={14} style={{ transform: isSelected ? 'translateX(2px)' : 'none', transition: 'transform 0.2s ease' }} />
                  </div>
                </SpotlightCard>
              );
            })}

            {/* End of Grid: Custom Track Creator Card */}
            <div
              onClick={() => { sounds.playClick(); setIsModalOpen(true); }}
              className="hover-lift"
              style={{
                cursor: 'pointer',
                borderRadius: 18,
                padding: '24px 26px',
                border: '1.5px dashed var(--theme-accent-border, rgba(129,140,248,0.4))',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 250,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11,
                    background: 'var(--theme-accent-bg, rgba(99,102,241,0.15))',
                    border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.3))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--theme-accent, #818cf8)'
                  }}>
                    <Sparkles size={20} />
                  </div>
                  <span style={{ 
                    fontSize: 10.5, 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.06em', 
                    color: 'var(--theme-accent, #818cf8)', 
                    background: 'var(--theme-accent-bg, rgba(99,102,241,0.12))', 
                    border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.3))',
                    padding: '2px 8px', 
                    borderRadius: 6 
                  }}>
                    Universal AI Synthesis
                  </span>
                </div>

                <h3 style={{ fontSize: 17.5, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>
                  + Design Any Custom Subject or Grade
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Want LKG Phonics, Class 2 Math, Ancient Rome, Astronomy, French, or Quantum Hardware? Qwen synthesizes full custom diagrams, lessons, and quizzes.
                </p>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                fontSize: 12.5, 
                fontWeight: 700, 
                color: 'var(--theme-accent, #818cf8)', 
                marginTop: 14, 
                paddingTop: 12, 
                borderTop: '1px solid rgba(255,255,255,0.06)' 
              }}>
                <span>Synthesize Custom Track</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Empty Search Result State */}
            {filtered.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--bg-card)',
                borderRadius: 18,
                border: '1px solid var(--border)'
              }}>
                <Sparkles size={32} color="var(--theme-accent, #818cf8)" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>
                  No pre-built tracks matching &ldquo;{search}&rdquo;
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 20px' }}>
                  Qwen AI can synthesize a complete curriculum for &ldquo;{search}&rdquo; right now with dynamic diagrams, lessons, and adaptive checks.
                </p>
                <button
                  onClick={() => {
                    setCustomSubjectName(search);
                    setIsModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ gap: 8, padding: '10px 20px' }}
                >
                  <Sparkles size={16} />
                  Synthesize &ldquo;{search}&rdquo; Track
                </button>
              </div>
            )}

          </div>

          {/* Sticky Bottom Action Bar */}
          {selected && selectedSubject && (
            <div style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              width: 'calc(100% - 48px)',
              maxWidth: 780,
              background: 'rgba(10, 10, 14, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--theme-accent-border, rgba(129, 140, 248, 0.4))',
              borderRadius: 18,
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 16px 40px rgba(0,0,0,0.8), 0 0 24px var(--theme-accent-bg, rgba(99,102,241,0.2))'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--theme-accent-bg, rgba(99,102,241,0.2))',
                  border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.4))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--theme-accent, #818cf8)'
                }}>
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                    {selectedSubject.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {selectedSubject.topics.length} calibrated modules ready for adaptive learning
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleContinue}
                id="continue-to-topics-btn"
                style={{ gap: 8, padding: '10px 22px' }}
              >
                Proceed to Topics
                <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── CREATE ANY CUSTOM SUBJECT OR GRADE MODAL ── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.4))',
            borderRadius: 22,
            maxWidth: 520,
            width: '100%',
            padding: '30px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.9), 0 0 30px var(--theme-accent-bg, rgba(99,102,241,0.2))',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                all: 'unset',
                position: 'absolute',
                top: 18,
                right: 18,
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 6
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--theme-accent-bg, rgba(99,102,241,0.15))',
                border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--theme-accent, #818cf8)'
              }}>
                <GraduationCap size={18} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                Create Any Subject or Grade
              </h3>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Enter any topic from Nursery/LKG to Graduate Research. Qwen AI will dynamically generate customized visual diagrams, lessons, and quizzes!
            </p>

            <form onSubmit={handleCreateCustom}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Subject Name or Topic
                </label>
                <input
                  className="input"
                  style={{ width: '100%', fontSize: 13.5 }}
                  placeholder="e.g. LKG Phonics, Class 2 Math, Quantum Chemistry, French..."
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Target Grade Level
                </label>
                <select
                  value={customGradeLevel}
                  onChange={(e) => setCustomGradeLevel(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none'
                  }}
                >
                  {GRADE_PRESETS.map(g => (
                    <option key={g} value={g} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Specific Topics or Modules (Optional, one per line)
                </label>
                <textarea
                  className="input"
                  style={{ width: '100%', height: 85, fontSize: 12.5, resize: 'none', lineHeight: 1.5 }}
                  placeholder={"e.g.\nModule 1: Basic Sounds & Vowels\nModule 2: 3-Letter Rhyming Words\nModule 3: Fun Story Reading"}
                  value={customSubtopicsInput}
                  onChange={(e) => setCustomSubtopicsInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, gap: 6 }}
                >
                  <Sparkles size={15} />
                  Generate Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
