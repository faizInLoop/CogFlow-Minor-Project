import { useState, useEffect } from 'react';
import { generateDynamicQuiz, evaluateStudentAnswer } from '../services/api';
import { findCuratedQuiz } from '../data/quizBank';
import {
  Sparkles, CheckCircle2, XCircle, AlertCircle, HelpCircle,
  Brain, Send, Loader2, Award, ArrowRight, RefreshCw, PenTool, Lightbulb, Check, ChevronDown, ChevronUp
} from 'lucide-react';

// Saved question banks stay as written. Other topics wait for the local model.
function savedQuiz(topic) {
  return findCuratedQuiz(topic);
}

export default function TopicAssessment({
  topicName,
  subtopicName = null,
  tier = 'tier3',
  lessonText = '',
  cognitiveLoad = 50.0,
  onAssessmentComplete = () => {},
  initialResults = null
}) {
  const [quizError, setQuizError] = useState('');
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState({});

  // Tier metadata for styling
  const tierBadges = {
    tier1: { label: 'B-Tier Foundations', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
    tier3: { label: 'A-Tier Core Engineering', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' },
    tier5: { label: 'S-Tier Staff & Research', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  };
  const currentBadge = tierBadges[tier] || tierBadges.tier3;

  // Instant quiz loading (0ms) + background AI dynamic quiz upgrade
  useEffect(() => {
    let isCancelled = false;

    // Reset user responses for new topic
    setSelectedAnswers(initialResults?.selectedAnswers || {});
    setShowExplanations(initialResults?.showExplanations || {});
    setStudentAnswer(initialResults?.studentAnswer || '');
    setAiEvaluation(initialResults?.aiEvaluation || null);
    setAssessmentCompleted(!!initialResults?.completed);

    const saved = savedQuiz(topicName);
    if (saved) {
      setQuizData(saved);
      setQuizError('');
      setLoadingQuiz(false);
      return undefined;
    }

    if (!lessonText || lessonText.length < 400) {
      setQuizData(null);
      setQuizError('');
      setLoadingQuiz(true);
      return undefined;
    }

    setQuizData(null);
    setQuizError('');
    setLoadingQuiz(true);
    const controller = new AbortController();

    async function writeQuestions() {
      try {
        const data = await generateDynamicQuiz({
          topic: topicName,
          subtopic: subtopicName,
          tier,
          content_snippet: lessonText,
          signal: controller.signal,
        });
        if (!isCancelled && data?.mcqs?.length) {
          setQuizData(data);
          setLoadingQuiz(false);
        } else if (!isCancelled) {
          setQuizError('Questions for this topic could not be written.');
          setLoadingQuiz(false);
        }
      } catch (err) {
        if (isCancelled || err?.name === 'AbortError') return;
        if (!isCancelled) {
          setQuizError(err?.message || 'The local model did not write questions for this topic.');
          setLoadingQuiz(false);
        }
      }
    }

    writeQuestions();
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [topicName, subtopicName, tier, lessonText]);

  const handleSelectOption = (qId, optionIdx, correctIdx) => {
    if (selectedAnswers[qId] !== undefined) return; // Locked once answered
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    setShowExplanations(prev => ({ ...prev, [qId]: true }));
    setExpandedExplanation(prev => ({ ...prev, [qId]: true }));
  };

  const handleEvaluateAnswer = async () => {
    const text = studentAnswer.trim();
    if (!text || text.split(/\s+/).length < 8) {
      alert('Please provide a more detailed explanation (at least 15-20 words) for AI evaluation.');
      return;
    }

    setIsEvaluating(true);
    const typingPromptQuestion = quizData?.typingPrompt?.question || `Explain the core mechanics and trade-offs of ${topicName}.`;

    try {
      const data = await evaluateStudentAnswer({
        topic: topicName,
        question: typingPromptQuestion,
        student_answer: text,
        tier: tier,
        lesson: lessonText,
      });

      if (data && data.score !== undefined) {
        setAiEvaluation(data);
        completeAssessment(data);
      } else {
        throw new Error('Invalid evaluation response');
      }
    } catch (err) {
      setAiEvaluation({
        score: null,
        verdict: 'Not checked',
        strengths: '',
        key_points_covered: [],
        missing_or_misunderstood: [],
        constructive_feedback: err?.message || 'The answer could not be checked against the topic. Make sure Ollama is running, then try again.',
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const completeAssessment = (evaluation) => {
    const mcqs = quizData?.mcqs || [];
    const totalMCQs = mcqs.length;
    let correctCount = 0;
    mcqs.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const mcqScore = totalMCQs > 0 ? Math.round((correctCount / totalMCQs) * 100) : 75;
    const typingScore = evaluation?.score || 75;
    // Composite score: 40% MCQ + 60% Active Recall Explanation
    const totalScore = Math.round((mcqScore * 0.4) + (typingScore * 0.6));

    setAssessmentCompleted(true);
    onAssessmentComplete({
      topic: topicName,
      tier,
      totalScore,
      mcqScore,
      correctCount,
      totalMCQs,
      typingScore,
      aiEvaluation: evaluation,
      selectedAnswers,
      showExplanations,
      studentAnswer,
      completed: true,
      timestamp: new Date().toISOString()
    });
  };

  const mcqs = quizData?.mcqs || [];
  const answeredMCQsCount = Object.keys(selectedAnswers).length;
  const mcqsComplete = answeredMCQsCount === mcqs.length && mcqs.length > 0;

  return (
    <div style={{
      marginTop: 28,
      marginBottom: 32,
      background: 'linear-gradient(180deg, #0d0d10 0%, #0a0a0d 100%)',
      border: '1px solid rgba(99, 102, 241, 0.22)',
      borderRadius: 'var(--radius-xl)',
      padding: '28px 32px',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Cyber Ambient Mesh */}
      <div style={{
        position: 'absolute', top: -50, right: -50, width: 220, height: 220,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 20, marginBottom: 24, borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexWrap: 'wrap', gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#c7d2fe',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)'
          }}>
            <Brain size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                On-The-Fly Mastery Check
              </span>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 6,
                background: currentBadge.bg, color: currentBadge.color, border: `1px solid ${currentBadge.border}`
              }}>
                {currentBadge.label}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Questions stay on this topic. A saved set is used when one exists.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            <Sparkles size={13} style={{ color: '#818cf8' }} />
            Questions for this topic
          </span>
        </div>
      </div>

      {loadingQuiz ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.2)',
            borderTopColor: '#818cf8',
            animation: 'spin 0.9s linear infinite'
          }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
            Writing questions from the checked lesson
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 420 }}>
            These questions wait until the lesson is ready, and they use only that lesson.
          </p>
        </div>
      ) : quizError ? (
        <div style={{ padding: '36px 24px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {quizError}
        </div>
      ) : (
        <div>
          {/* ═════════════════════════════════════════════════════════ */}
          {/* SECTION 1: DYNAMIC CONCEPTUAL MCQS                       */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#c7d2fe' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#818cf8'
                }}>1</span>
                Part 1 · Diagnostic Conceptual Questions
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {answeredMCQsCount} of {mcqs.length} answered
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {mcqs.map((q, idx) => {
                const userChoice = selectedAnswers[q.id];
                const hasAnswered = userChoice !== undefined;
                const isCorrect = userChoice === q.correctIndex;
                const isExpanded = expandedExplanation[q.id] || hasAnswered;

                return (
                  <div
                    key={q.id || idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${hasAnswered ? (isCorrect ? 'rgba(52,211,153,0.35)' : 'rgba(244,63,94,0.35)') : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 12,
                      padding: '18px 20px',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff', lineHeight: 1.55, marginBottom: 14 }}>
                      <span style={{ color: '#818cf8', marginRight: 6 }}>Q{idx + 1}.</span>
                      {q.question}
                    </div>

                    {/* Options list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, optIdx) => {
                        const isThisChosen = userChoice === optIdx;
                        const isThisCorrect = q.correctIndex === optIdx;

                        let optBg = 'rgba(255, 255, 255, 0.02)';
                        let optBorder = 'rgba(255, 255, 255, 0.08)';
                        let optColor = 'var(--text-secondary)';

                        if (hasAnswered) {
                          if (isThisCorrect) {
                            optBg = 'rgba(52, 211, 153, 0.14)';
                            optBorder = 'rgba(52, 211, 153, 0.5)';
                            optColor = '#6ee7b7';
                          } else if (isThisChosen && !isThisCorrect) {
                            optBg = 'rgba(244, 63, 94, 0.14)';
                            optBorder = 'rgba(244, 63, 94, 0.5)';
                            optColor = '#fda4af';
                          } else {
                            optColor = 'var(--text-muted)';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={hasAnswered}
                            onClick={() => handleSelectOption(q.id, optIdx, q.correctIndex)}
                            style={{
                              all: 'unset',
                              cursor: hasAnswered ? 'default' : 'pointer',
                              padding: '10px 14px',
                              borderRadius: 8,
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              color: optColor,
                              fontSize: 12.5,
                              lineHeight: 1.5,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <span style={{
                              width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10.5, fontWeight: 800,
                              background: hasAnswered && isThisCorrect ? '#10b981' : hasAnswered && isThisChosen ? '#f43f5e' : 'rgba(255,255,255,0.06)',
                              color: hasAnswered && (isThisCorrect || isThisChosen) ? '#ffffff' : 'var(--text-muted)'
                            }}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span style={{ flex: 1 }}>{opt}</span>
                            {hasAnswered && isThisCorrect && <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />}
                            {hasAnswered && isThisChosen && !isThisCorrect && <XCircle size={16} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanatory Rationale */}
                    {hasAnswered && isExpanded && (
                      <div style={{
                        marginTop: 14, padding: '12px 16px', borderRadius: 8,
                        background: isCorrect ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        border: `1px solid ${isCorrect ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                        fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: isCorrect ? '#6ee7b7' : '#fcd34d', marginBottom: 4 }}>
                          <Lightbulb size={13} />
                          Conceptual Breakdown:
                        </div>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* SECTION 2: ACTIVE RECALL FREE-FORM TYPING CHALLENGE     */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 14,
            padding: '22px 24px',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#c7d2fe' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#818cf8'
                }}>2</span>
                Part 2 · Active Recall: Explain in Your Own Words
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, color: '#a5b4fc',
                background: 'rgba(99, 102, 241, 0.15)', padding: '3px 8px', borderRadius: 6
              }}>
                Checked against this lesson
              </span>
            </div>

            <p style={{ fontSize: 13.5, color: '#ffffff', fontWeight: 600, lineHeight: 1.6, marginBottom: 14 }}>
              {quizData?.typingPrompt?.question || `Explain the core mechanics and trade-offs of ${topicName}.`}
            </p>

            {/* Rubric hints pill row */}
            {quizData?.typingPrompt?.rubricKeywords && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Concepts to address:</span>
                {quizData.typingPrompt.rubricKeywords.slice(0, 5).map((kw, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 10.5, color: '#c7d2fe', background: 'rgba(255,255,255,0.04)',
                      padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Terminal-like typing area */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <textarea
                value={studentAnswer}
                onChange={e => setStudentAnswer(e.target.value)}
                disabled={isEvaluating || assessmentCompleted}
                placeholder="Type your structured explanation here (explain how the mechanism works, why it is chosen over alternatives, and what happens when it breaks under scale)..."
                rows={5}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: '#f8fafc',
                  fontSize: 13,
                  lineHeight: 1.65,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  resize: 'vertical',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                position: 'absolute', bottom: 10, right: 14,
                fontSize: 10.5, color: 'var(--text-muted)'
              }}>
                {studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0} words
              </div>
            </div>

            {/* Submit button */}
            {!aiEvaluation && (
              <button
                disabled={isEvaluating || !studentAnswer.trim()}
                onClick={handleEvaluateAnswer}
                style={{
                  all: 'unset',
                  cursor: isEvaluating || !studentAnswer.trim() ? 'not-allowed' : 'pointer',
                  opacity: isEvaluating || !studentAnswer.trim() ? 0.45 : 1,
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 12.5,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isEvaluating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Checking your answer against the lesson...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Check my explanation
                  </>
                )}
              </button>
            )}

            {/* AI Evaluation Card */}
            {aiEvaluation && (
              <div style={{
                marginTop: 18,
                padding: '20px',
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {Number.isFinite(aiEvaluation.score) && (
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: aiEvaluation.score >= 80 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      border: `2px solid ${aiEvaluation.score >= 80 ? '#34d399' : '#f59e0b'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 16,
                      color: aiEvaluation.score >= 80 ? '#6ee7b7' : '#fcd34d'
                    }}>
                      {aiEvaluation.score}
                    </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                        {Number.isFinite(aiEvaluation.score) ? 'Active Recall Score' : 'Answer check'}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                        {aiEvaluation.verdict || 'Not checked'}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, color: '#a5b4fc', background: 'rgba(99,102,241,0.2)', padding: '3px 8px', borderRadius: 6 }}>
                    Checked against the lesson
                  </span>
                </div>

                <div style={{ fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.6 }}>
                  <strong>Strengths:</strong> {aiEvaluation.strengths}
                </div>

                {aiEvaluation.missing_or_misunderstood && aiEvaluation.missing_or_misunderstood.length > 0 && (
                  <div style={{ fontSize: 12, color: '#fcd34d', lineHeight: 1.5 }}>
                    <strong>Nuances to deepen:</strong> {aiEvaluation.missing_or_misunderstood.join(', ')}
                  </div>
                )}

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                  <strong>Feedback:</strong> {aiEvaluation.constructive_feedback}
                </div>
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* SECTION 3: COMPOSITE MASTERY OUTCOME                     */}
          {/* ═════════════════════════════════════════════════════════ */}
          {assessmentCompleted && (
            <div style={{
              padding: '16px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(99, 102, 241, 0.12))',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Award size={20} color="#34d399" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                    Topic Mastery Synthesized & Accumulated!
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Your conceptual responses and live score have been integrated into your session analytics.
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '4px 12px', borderRadius: 6 }}>
                ✓ Completed
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
