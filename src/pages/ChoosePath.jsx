import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import { sounds } from '../utils/soundEffects';
import { BookOpen, UploadCloud, ArrowRight, ShieldCheck, Layers, Sparkles, Terminal, Cpu, Zap, GraduationCap } from 'lucide-react';

export default function ChoosePath() {
  const navigate = useNavigate();

  const handleSelect = (route) => {
    sounds.playClick();
    navigate(route);
  };

  return (
    <div className="page" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentStep={1} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '50px 24px', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ maxWidth: 1140 }}>

          {/* Heading */}
          <div className="animate-fadeInUp" style={{ textAlign: 'center', marginBottom: 44 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--theme-accent, #818cf8)', textTransform: 'uppercase' }}>
              Curriculum Routing · Step 1 of 3
            </span>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginTop: 8, marginBottom: 12, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Choose your learning pathway
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15.5, maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
              Explore subjects from Kindergarten (LKG/UKG) to University & Research, prompt Qwen to synthesize any custom topic, or upload syllabus notes.
            </p>
          </div>

          {/* 3 Elevated Path Cards */}
          <div className="grid-3 animate-fadeInUp delay-100" style={{ gap: 24 }}>

            {/* Path 1: Curated Subjects */}
            <SpotlightCard
              onClick={() => handleSelect('/subjects')}
              spotlightColor="rgba(255, 255, 255, 0.05)"
              borderColor="var(--theme-accent-border, rgba(129, 140, 248, 0.45))"
              style={{
                padding: '36px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--bg-card)',
              }}
            >
              <div>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'var(--theme-accent-bg, rgba(99,102,241,0.18))',
                  border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.35))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--theme-accent, #818cf8)',
                  marginBottom: 20
                }}>
                  <GraduationCap size={26} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--theme-accent, #818cf8)' }}>
                    All Grades & Domains
                  </span>
                </div>

                <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 10, color: '#ffffff' }}>
                  Universal Catalog
                </h2>

                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.65, marginBottom: 22 }}>
                  Comprehensive tracks covering LKG/UKG Phonics, Class 1-5 Math & Science, Class 6-12 High School, Computer Science, AI, and Finance.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
                  {['LKG/UKG Phonics', 'Class 1-5 Science', 'Systems Architecture', 'Modern AI', 'Finance'].map(s => (
                    <span key={s} className="badge badge-indigo" style={{ fontSize: 10, padding: '3px 8px' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
                Explore All Subjects
                <ArrowRight size={15} />
              </div>
            </SpotlightCard>

            {/* Path 2: Instant Qwen AI Topic Synthesizer */}
            <SpotlightCard
              onClick={() => handleSelect('/subjects')}
              spotlightColor="rgba(245, 158, 11, 0.15)"
              borderColor="rgba(251, 191, 36, 0.45)"
              style={{
                padding: '36px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--bg-card)',
              }}
            >
              <div>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'rgba(245,158,11,0.18)',
                  border: '1px solid rgba(251,191,36,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  marginBottom: 20
                }}>
                  <Zap size={24} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fbbf24' }}>
                    Any Custom Grade or Subject
                  </span>
                </div>

                <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 10, color: '#ffffff' }}>
                  Create Any Subject
                </h2>

                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.65, marginBottom: 22 }}>
                  Type ANY subject (e.g. 2nd class Solar System, Ancient Egypt, Raft Consensus, French Basics) and Qwen generates diagrams and lessons on the fly.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
                  {['Class 2 Math', 'Solar System', 'Ancient Rome', 'Raft Consensus', 'eBPF'].map(s => (
                    <span key={s} className="badge tier-pill-s" style={{ fontSize: 10, padding: '3px 8px' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', gap: 8, borderColor: 'rgba(251,191,36,0.4)', color: '#fbbf24' }}>
                Create Custom Subject
                <ArrowRight size={15} />
              </div>
            </SpotlightCard>

            {/* Path 3: Upload Custom Syllabus */}
            <SpotlightCard
              onClick={() => handleSelect('/topics?source=upload')}
              spotlightColor="rgba(6, 182, 212, 0.15)"
              borderColor="rgba(56, 189, 248, 0.45)"
              style={{
                padding: '36px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--bg-card)',
              }}
            >
              <div>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'rgba(6,182,212,0.18)',
                  border: '1px solid rgba(56,189,248,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  marginBottom: 20
                }}>
                  <UploadCloud size={24} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#38bdf8' }}>
                    Document Intelligence
                  </span>
                </div>

                <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 10, color: '#ffffff' }}>
                  Upload Syllabus / Notes
                </h2>

                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.65, marginBottom: 22 }}>
                  Drag and drop PDF textbook chapters, university notes, or school exam syllabi to automatically extract structured learning modules.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
                  {['Textbook Chapters', 'School Syllabi', 'Lecture Slides', 'Research Papers'].map(s => (
                    <span key={s} className="badge" style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(6,182,212,0.1)', color: '#38bdf8', border: '1px solid rgba(6,182,212,0.3)' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', gap: 8, borderColor: 'rgba(56,189,248,0.4)', color: '#38bdf8' }}>
                Upload Materials
                <ArrowRight size={15} />
              </div>
            </SpotlightCard>

          </div>

          {/* Privacy Footnote */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 48,
            fontSize: 12,
            color: 'var(--text-muted)'
          }}>
            <ShieldCheck size={15} style={{ color: '#10b981' }} />
            <span>Pure OLED Black · Zero cloud storage · In-memory biometric telemetry</span>
          </div>

        </div>
      </div>
    </div>
  );
}
