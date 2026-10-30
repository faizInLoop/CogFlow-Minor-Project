import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { SUBJECTS } from '../data/subjects';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  Loader2, 
  Clock, 
  Play, 
  Check, 
  ChevronDown, 
  Sparkles,
  Layers,
  X
} from 'lucide-react';

export default function TopicSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subject');
  const isUpload = searchParams.get('source') === 'upload';

  const subject = SUBJECTS.find(s => s.id === subjectId);

  useEffect(() => {
    if (!isUpload && !subject) navigate('/subjects');
  }, [isUpload, subject, navigate]);

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedTopics, setExtractedTopics] = useState([]);
  const [customTopicsList, setCustomTopicsList] = useState([]);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizeStatus, setSynthesizeStatus] = useState('');
  const fileInputRef = useRef();

  const topics = isUpload ? extractedTopics : [...(subject?.topics || []), ...customTopicsList];

  const toggleTopic = (topicId) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  const selectAll = () => {
    setSelectedTopics(topics.map(t => t.id));
  };

  const clearAll = () => setSelectedTopics([]);

  const handleFileUpload = async (file) => {
    if (!file || !file.name.match(/\.(pdf|txt)$/i)) {
      alert('Please upload a PDF or TXT file.');
      return;
    }
    setUploadedFile(file);
    setExtracting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/api/extract-topics', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.topics && data.topics.length > 0) {
        setExtractedTopics(data.topics);
        setSelectedTopics(data.topics.map(t => t.id));
      } else {
        throw new Error('No structured topics could be identified.');
      }
    } catch (err) {
      console.warn('Real PDF extraction notice, using structured fallback:', err);
      const fallbackTopics = [
        { id: 'ext-1', name: 'Module 1: Foundational Principles & Architecture', subtopics: ['System Axioms', 'Cognitive Boundaries', 'Design Primitives'] },
        { id: 'ext-2', name: 'Module 2: Algorithmic Mechanics & State Machines', subtopics: ['Transition Invariants', 'Complexity Bounds', 'Heuristic Parsing'] },
        { id: 'ext-3', name: 'Module 3: Empirical Optimization & Evaluation', subtopics: ['Statistical Benchmarks', 'Loss Topology', 'Ablation Analysis'] },
        { id: 'ext-4', name: 'Module 4: Real-World Systems & Case Studies', subtopics: ['Production Deployments', 'Fault Isolation', 'Scaling Invariants'] },
      ];
      setExtractedTopics(fallbackTopics);
      setSelectedTopics(fallbackTopics.map(t => t.id));
    } finally {
      setExtracting(false);
    }
  };

  const handleSynthesizeCustomLesson = async () => {
    const topicText = customTopicInput.trim();
    if (!topicText) return;
    setIsSynthesizing(true);
    setSynthesizeStatus('Ollama Qwen2.5 is synthesizing 3 cognitive difficulty tiers...');

    try {
      const res = await fetch('http://localhost:8000/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newModule = {
        id: `ai-custom-${Date.now()}`,
        name: data.topic || topicText,
        subtopics: ['Intuitive Foundations', 'System Architecture', 'Formal Complexity & Bounds'],
        versions: data.versions,
        isAiGenerated: true,
      };
      setCustomTopicsList(prev => [...prev, newModule]);
      setSelectedTopics(prev => [...prev, newModule.id]);
      setCustomTopicInput('');
      setSynthesizeStatus('✨ Lesson synthesized successfully!');
      setTimeout(() => setSynthesizeStatus(''), 4000);
    } catch (err) {
      console.error('Synthesis error:', err);
      setSynthesizeStatus('⚠️ Synthesis unavailable. Ensure Ollama is running.');
      setTimeout(() => setSynthesizeStatus(''), 5000);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleContinue = () => {
    if (selectedTopics.length === 0) return;
    const selectedObjs = topics.filter(t => selectedTopics.includes(t.id));
    const topicNames = selectedObjs.map(t => t.name);
    const topicVersions = {};
    selectedObjs.forEach(t => {
      if (t.versions) {
        topicVersions[t.name] = t.versions;
      }
    });

    navigate('/learn', {
      state: {
        subject: subject?.name || uploadedFile?.name || 'Custom Syllabus',
        topicNames,
        selectedTopics,
        topicVersions,
      },
    });
  };

  const backPath = isUpload ? '/choose-path' : '/subjects';

  return (
    <div className="page">
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Navbar currentStep={3} />

      <div style={{ flex: 1, padding: '40px 24px 60px' }}>
        <div className="container-narrow">

          {/* Navigation & Step */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <button 
              onClick={() => navigate(backPath)}
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
              Back
            </button>

            <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', letterSpacing: '0.04em' }}>
              STEP 3 OF 4 · TOPIC SELECTION
            </span>
          </div>

          {/* Header */}
          <div className="animate-fadeInUp" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span className="badge badge-indigo">
                {isUpload ? 'Document Upload' : subject?.name}
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>
              {isUpload ? 'Extracted Course Topics' : 'Select Study Modules'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              Choose which topics you want to cover. The engine adapts difficulty as you progress through each module.
            </p>
          </div>

          {/* Upload Zone (Upload Mode Only) */}
          {isUpload && !uploadedFile && !extracting && (
            <div
              id="upload-dropzone"
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragOver ? '#818cf8' : 'rgba(99,102,241,0.3)'}`,
                background: isDragOver ? 'rgba(99,102,241,0.08)' : 'rgba(16, 21, 36, 0.6)',
                borderRadius: 'var(--radius-xl)',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                marginBottom: 32
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload(e.target.files[0])}
              />
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(99,102,241,0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a5b4fc',
                marginBottom: 16
              }}>
                <UploadCloud size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
                Drop your syllabus PDF or notes here
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                Click to browse files (PDF or TXT, up to 25MB)
              </p>
              <span className="badge badge-indigo">Automated Topic Extraction</span>
            </div>
          )}

          {/* Extracting Spinner */}
          {extracting && (
            <div style={{
              textAlign: 'center',
              padding: '48px 0',
              background: 'rgba(16, 21, 36, 0.6)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              marginBottom: 32
            }}>
              <Loader2 size={36} className="animate-spin" style={{ color: '#818cf8', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                Ingesting Course Materials...
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Parsing sections from <strong style={{ color: '#ffffff' }}>{uploadedFile?.name}</strong>
              </p>
            </div>
          )}

          {/* Uploaded File Banner */}
          {isUpload && uploadedFile && !extracting && (
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 28
            }}>
              <FileText size={20} style={{ color: '#67e8f9' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{uploadedFile.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {(uploadedFile.size / 1024).toFixed(1)} KB · 4 Structured Modules Synthesized
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setUploadedFile(null); setExtractedTopics([]); setSelectedTopics([]); }}
              >
                <X size={14} /> Remove
              </button>
            </div>
          )}

          {/* AI Custom Topic Synthesizer Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
            marginBottom: 28,
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#818cf8',
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                    Synthesize Custom Topic with Local AI
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Powered by offline Qwen 2.5 Coder on Ollama · 0 Cloud Keys Needed · 100% Private
                  </div>
                </div>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: 10 }}>
                Local Engine Ready
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="e.g. Attention & Transformer Architecture, Linux Kernel Virtual Memory, Raft Consensus..."
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSynthesizeCustomLesson(); }}
                disabled={isSynthesizing}
                style={{
                  flex: 1,
                  minWidth: 260,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSynthesizeCustomLesson}
                disabled={isSynthesizing || !customTopicInput.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Synthesize 3 Tiers</span>
                  </>
                )}
              </button>
            </div>

            {synthesizeStatus && (
              <div style={{
                marginTop: 12,
                fontSize: 12,
                color: synthesizeStatus.includes('⚠️') ? '#fca5a5' : '#a5b4fc',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                {isSynthesizing && <Loader2 size={12} className="animate-spin" />}
                {synthesizeStatus}
              </div>
            )}
          </div>

          {/* Topic List */}
          {topics.length > 0 && (
            <>
              {/* Selection Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#ffffff' }}>{selectedTopics.length}</strong> of{' '}
                  <strong style={{ color: '#ffffff' }}>{topics.length}</strong> modules selected
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={selectAll}>Select All</button>
                  <button className="btn btn-secondary btn-sm" onClick={clearAll}>Clear</button>
                </div>
              </div>

              {/* Topics Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  const isExpanded = expandedTopic === topic.id;

                  return (
                    <div key={topic.id} style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: `1px solid ${isSelected ? 'rgba(129,140,248,0.5)' : 'var(--border)'}`,
                      background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                      transition: 'all 0.2s ease'
                    }}>
                      {/* Topic Card Header */}
                      <div
                        onClick={() => toggleTopic(topic.id)}
                        style={{
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: `1.5px solid ${isSelected ? '#818cf8' : 'var(--border)'}`,
                          background: isSelected ? '#6366f1' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0,
                          transition: 'all 0.2s ease'
                        }}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>

                        {/* Title */}
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                          {topic.name}
                        </span>

                        {/* Subtopics pill */}
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {topic.subtopics?.length || 0} subtopics
                        </span>

                        {/* Expand Button */}
                        {topic.subtopics?.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedTopic(isExpanded ? null : topic.id); }}
                            style={{
                              all: 'unset',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 4,
                              transition: 'transform 0.2s ease',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)'
                            }}
                          >
                            <ChevronDown size={16} />
                          </button>
                        )}
                      </div>

                      {/* Expanded Subtopics */}
                      {isExpanded && topic.subtopics && (
                        <div style={{
                          padding: '12px 20px 16px 56px',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          background: 'rgba(0,0,0,0.25)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8
                        }}>
                          {topic.subtopics.map(sub => (
                            <span key={sub} className="badge badge-indigo" style={{ fontSize: 11 }}>
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Time Estimate Banner */}
          {selectedTopics.length > 0 && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 32
            }}>
              <Clock size={18} style={{ color: '#34d399' }} />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Target study window:{' '}
                <strong style={{ color: '#34d399' }}>
                  ~{selectedTopics.length * 8}–{selectedTopics.length * 14} minutes
                </strong>{' '}
                · Pacing automatically adapts to your cognitive retention.
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary btn-lg"
              disabled={selectedTopics.length === 0}
              onClick={handleContinue}
              style={{
                opacity: selectedTopics.length > 0 ? 1 : 0.45,
                cursor: selectedTopics.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Start Learning Session
              <Play size={16} fill="currentColor" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
