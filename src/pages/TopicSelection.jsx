import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { SUBJECTS, getContent } from '../data/subjects';
import { extractTopics as extractDocumentTopics, generateLesson } from '../services/api';

export default function TopicSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subject');
  const isUpload = searchParams.get('source') === 'upload';

  const subject = SUBJECTS.find(s => s.id === subjectId);

  // FIX: Guard — redirect to /subjects if not upload mode and no valid subject found
  useEffect(() => {
    if (!isUpload && !subject) navigate('/subjects');
  }, [isUpload, subject, navigate]);

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedTopics, setExtractedTopics] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const fileInputRef = useRef();
  const continueInFlightRef = useRef(false);

  const topics = isUpload ? extractedTopics : (subject?.topics || []);
  const selectedLessonMinutes = topics.filter(t => selectedTopics.includes(t.id)).reduce((sum, topic) => {
    const text = topic.versions?.tier3 || getContent(topic.name, 'tier3');
    return sum + Math.ceil(text.split(/\s+/).filter(Boolean).length / 130);
  }, 0);

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

  // Uploads are extracted and sectioned by the backend.
  const handleFileUpload = async (file) => {
    if (!file || !file.name.match(/\.(pdf|txt)$/i)) {
      alert('Please upload a PDF or TXT file.');
      return;
    }
    setUploadedFile(file);
    setExtracting(true);
    setUploadError('');
    try {
      const data = await extractDocumentTopics(file);
      setExtractedTopics(data.topics);
      setDocumentInfo(data);
    } catch (error) {
      setUploadedFile(null);
      setUploadError(error.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleContinue = async () => {
    if (selectedTopics.length === 0 || continueInFlightRef.current) return;
    continueInFlightRef.current = true;
    const chosen = topics.filter(t => selectedTopics.includes(t.id));
    const topicNames = chosen.map(t => t.name);
    let topicVersions = chosen.map(t => t.versions || null);
    let topicSources = chosen.map(t => t.versions ? (isUpload ? 'document_extracted' : 'curated_topic_library') : null);
    let readingEstimates = chosen.map(() => null);
    if (isUpload) {
      setGeneratingLesson(true);
      for (let i = 0; i < chosen.length; i += 1) {
        const source = chosen[i].versions?.tier3;
        if (!source) continue;
        try {
          const result = await generateLesson(chosen[i].name, source, `${documentInfo?.filename || 'uploaded document'} — ${chosen[i].source?.section || chosen[i].name}`);
          topicVersions[i] = result.versions;
          topicSources[i] = result.content_source;
          readingEstimates[i] = result.reading_estimates;
        } catch (error) {
          if (error.message.includes('needs GEMINI_API_KEY or CLAUDE_API_KEY')) break;
          // Preserve the extracted fallback and its honest source label.
        }
      }
      setGeneratingLesson(false);
    }
    navigate('/learn', {
      state: {
        subject: subject?.name || uploadedFile?.name || 'Custom',
        subjectId,
        selectedTopics,
        topicNames,
        topicVersions,
        topicSources,
        readingEstimates,
        topicReferences: chosen.map(t => t.source || null),
        documentInfo,
        fromUpload: isUpload,
      },
    });
    continueInFlightRef.current = false;
  };

  const handleCustomTopic = async () => {
    const exactTopic = customTopic.trim();
    if (!exactTopic || generatingLesson || continueInFlightRef.current) return;
    continueInFlightRef.current = true;
    setGeneratingLesson(true);
    setGenerationError('');
    try {
      const lesson = await generateLesson(exactTopic);
      navigate('/learn', { state: {
        subject: 'Custom Topic', topicNames: [lesson.topic], selectedTopics: [lesson.topic],
        topicVersions: [lesson.versions], topicSources: [lesson.content_source],
        readingEstimates: [lesson.reading_estimates], generatedTopic: true,
      } });
    } catch (error) {
      setGenerationError(error.message);
    } finally {
      continueInFlightRef.current = false;
      setGeneratingLesson(false);
    }
  };

  const backPath = isUpload ? '/choose-path' : `/subjects`;

  return (
    <div className="page">
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Navbar currentStep={3} />

      <div className="content-area" style={{ flex: 1, padding: '48px 24px' }}>
        <div className="container-narrow">

          {/* Back */}
          <button className="back-button animate-fadeIn" onClick={() => navigate(backPath)} id="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          {/* Header */}
          <div className="animate-fadeInUp" style={{ marginTop: 24, marginBottom: 32 }}>
            {subject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{subject.icon}</span>
                <span className="badge badge-indigo">{subject.name}</span>
              </div>
            )}
            {isUpload && (
              <div style={{ marginBottom: 12 }}>
                <span className="badge badge-cyan">📄 Upload Mode</span>
              </div>
            )}
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 10 }}>
              {isUpload ? 'Your Extracted Topics' : `Select Topics to Study`}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              {/* FIX: was showing 'from undefined' in upload mode */}
              {isUpload
                ? 'Topics extracted from your file. Select the ones you want to study.'
                : `Choose which topics from ${subject?.name || 'your subject'} you want to cover in this session.`
              }
            </p>
          </div>

          <section aria-labelledby="custom-topic-title" style={{ margin: '0 0 28px', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.05)' }}>
            <h2 id="custom-topic-title" style={{ fontSize: 18, fontWeight: 750, marginBottom: 6 }}>Learn any topic</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>Enter a topic in your own words. A provider request happens only when you choose Generate.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input aria-label="Custom learning topic" value={customTopic} onChange={e => setCustomTopic(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCustomTopic(); }} maxLength={160} placeholder="e.g. Blockchain consensus mechanisms" style={{ flex: '1 1 280px', minWidth: 0, padding: '11px 13px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              <button className="btn btn-primary" type="button" onClick={handleCustomTopic} disabled={!customTopic.trim() || generatingLesson}>{generatingLesson ? 'Generating lesson…' : 'Generate custom lesson'}</button>
            </div>
            {generationError && <p role="alert" style={{ marginTop: 10, color: '#fda4af', fontSize: 13 }}>{generationError}</p>}
            <p style={{ marginTop: 9, color: 'var(--text-muted)', fontSize: 11 }}>Requires GEMINI_API_KEY or CLAUDE_API_KEY on the backend. Provider usage may incur charges under your provider account.</p>
          </section>

          {/* ── UPLOAD ZONE (shown only in upload mode when no file yet) ── */}
          {isUpload && !uploadedFile && !extracting && (
            <div
              id="upload-dropzone"
              className={`dropzone animate-fadeInUp ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: 32 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload(e.target.files[0])}
              />
              <span className="dropzone-icon">📤</span>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                Drop your PDF or TXT here
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                Or click to browse files
              </p>
              <span className="badge badge-indigo">PDF · TXT · Max 10MB</span>
              <div style={{ marginTop: 16 }}>
                {uploadError && <p role="alert" style={{ color: '#fda4af', marginTop: 12 }}>{uploadError}</p>}
              </div>
            </div>
          )}

          {/* Extracting spinner */}
          {extracting && (
            <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '48px 0', marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin-slow 2s linear infinite', display: 'inline-block' }}>⚙️</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Extracting Topics…</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Analyzing <strong style={{ color: 'var(--text-primary)' }}>{uploadedFile?.name}</strong>
              </p>
            </div>
          )}

          {/* Uploaded file info */}
          {isUpload && uploadedFile && !extracting && (
            <div className="animate-fadeIn" style={{
              background: 'rgba(6,182,212,0.06)',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 28,
            }}>
              <span style={{ fontSize: 24 }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{uploadedFile.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {(uploadedFile.size / 1024).toFixed(1)} KB · {extractedTopics.length} source sections extracted
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                setUploadedFile(null); setExtractedTopics([]); setSelectedTopics([]);
              }}>
                Remove
              </button>
            </div>
          )}
          {isUpload && uploadedFile && !extracting && (
            <p style={{ marginTop: -18, marginBottom: 24, color: 'var(--text-muted)', fontSize: 11 }}>
              Starting selected sections may send their extracted text to the configured backend provider for source-grounded versions. Provider charges may apply; without a key, extracted versions are used.
            </p>
          )}

          {/* Topic list */}
          {topics.length > 0 && (
            <>
              {/* Select controls */}
              <div className="animate-fadeInUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedTopics.length}</strong> of{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{topics.length}</strong> topics selected
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={selectAll} id="select-all-btn">Select All</button>
                  <button className="btn btn-secondary btn-sm" onClick={clearAll} id="clear-all-btn">Clear</button>
                </div>
              </div>

              {/* Topics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }} className="animate-fadeInUp delay-100">
                {topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  const isExpanded = expandedTopic === topic.id;

                  return (
                    <div key={topic.id} id={`topic-${topic.id}`}>
                      {/* Main topic row */}
                      <div
                        className={`topic-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleTopic(topic.id)}
                      >
                        {/* Checkbox */}
                        <div className={`topic-check ${isSelected ? 'checked' : ''}`}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>

                        {/* Name */}
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{topic.name}</span>

                        {/* Subtopic count */}
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {topic.subtopics?.length || 0} subtopics
                        </span>

                        {/* Expand toggle */}
                        {topic.subtopics?.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedTopic(isExpanded ? null : topic.id); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px', fontSize: 12, transition: 'var(--transition)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
                          >
                            ▼
                          </button>
                        )}
                      </div>

                      {/* Subtopics (expanded) */}
                      {isExpanded && topic.subtopics && (
                        <div className="animate-fadeIn" style={{
                          background: 'rgba(99,102,241,0.04)',
                          border: '1px solid rgba(99,102,241,0.15)',
                          borderTop: 'none',
                          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                          padding: '12px 16px 12px 52px',
                          display: 'flex', flexWrap: 'wrap', gap: 8,
                        }}>
                          {topic.subtopics.map(sub => (
                            <span key={sub} className="badge badge-indigo" style={{ fontSize: 12 }}>{sub}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Estimated time */}
          {selectedTopics.length > 0 && (
            <div className="animate-fadeIn" style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 20 }}>⏱️</span>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Estimated reading time from selected text:{' '}
                <strong style={{ color: 'var(--emerald)' }}>
                  ~{selectedLessonMinutes} minutes
                </strong>
                {' '}(adapts based on your pace)
              </div>
            </div>
          )}

          {/* Continue */}
          <div className="animate-fadeInUp delay-200" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              id="start-learning-btn"
              className="btn btn-primary btn-lg"
              onClick={handleContinue}
              disabled={selectedTopics.length === 0 || generatingLesson}
              style={{ opacity: selectedTopics.length > 0 && !generatingLesson ? 1 : 0.4, cursor: selectedTopics.length > 0 && !generatingLesson ? 'pointer' : 'not-allowed' }}
            >
              {generatingLesson ? 'Preparing selected lesson versions…' : 'Start Learning Session'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
