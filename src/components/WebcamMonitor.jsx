import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Eye, EyeOff, AlertCircle, Brain, Sparkles, Activity } from 'lucide-react';
import { CHANNELS, WINDOW_SIZE } from '../../shared/cognitiveFeatures';

const STATE_NAMES = { flow: 'Flow', overload: 'Overload', boredom: 'Boredom', unknown: 'Unknown' };

export default function WebcamMonitor({ cogState, onStateUpdate, onCognitiveLoadUpdate, onTriggerSuggestion, onFaceActive }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [channels, setChannels] = useState(null);
  const [windowCount, setWindowCount] = useState(0);
  
  // Real-time analysis states
  const [detectedState, setDetectedState] = useState('Unknown');
  const [stateReason, setStateReason] = useState('Camera inactive');
  const [confidence, setConfidence] = useState(0);
  const [probabilities, setProbabilities] = useState({ flow: 0.33, overload: 0.33, boredom: 0.33 });
  const [metrics, setMetrics] = useState({ neutral: 0, happy: 0, tension: 0 });
  const [errorMsg, setErrorMsg] = useState(null);

  // 30-Second Rule Tracking
  const [sustainedState, setSustainedState] = useState('flow');
  const [sustainedSeconds, setSustainedSeconds] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Sustained tracking refs to avoid stale closures
  const sustainedStateRef = useRef('unknown');
  const sustainedSecsRef = useRef(0);
  const displayedStateRef = useRef('unknown');
  const candidateStateRef = useRef(null);
  const candidateSinceRef = useRef(0);
  const missedFramesRef = useRef(0);

  // Store parent callbacks in refs so interval does NOT restart on parent re-renders
  const onCognitiveLoadUpdateRef = useRef(onCognitiveLoadUpdate);
  const onTriggerSuggestionRef = useRef(onTriggerSuggestion);
  const onFaceActiveRef = useRef(onFaceActive);
  const onStateUpdateRef = useRef(onStateUpdate);
  useEffect(() => {
    onCognitiveLoadUpdateRef.current = onCognitiveLoadUpdate;
    onTriggerSuggestionRef.current = onTriggerSuggestion;
    onFaceActiveRef.current = onFaceActive;
    onStateUpdateRef.current = onStateUpdate;
  });

  // ── Callback ref: invoked immediately when <video> DOM node is mounted ──
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch(err => console.warn('Webcam video play error:', err));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    fetch('/models/cogflow/logistic_model.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Cognitive model returned HTTP ${response.status}.`);
        return response.json();
      })
      .then((model) => {
        if (isMounted) setModelReady(model?.model_type === 'multinomial_logistic_regression');
      })
      .catch(() => { if (isMounted) setModelReady(false); });
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // ── Sync video element with stream on preview/cameraActive toggle ──
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.play().catch(err => console.warn('Video play error on state update:', err));
    }
  }, [cameraActive, showPreview]);

  // ── Start Webcam Stream ──
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      streamRef.current = stream;

      // Assign to video element if already rendered
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.warn);
      }

      setCameraActive(true);
      setChannels(null);
      setWindowCount(0);
      sustainedStateRef.current = 'unknown';
      sustainedSecsRef.current = 0;
      displayedStateRef.current = 'unknown';
      candidateStateRef.current = null;
      candidateSinceRef.current = 0;
      setSustainedSeconds(0);
      setSustainedState('unknown');
      setDetectedState('Unknown');
      setStateReason('The expression matrix updates with each frame. The class matrix uses 11 frames.');
    } catch (err) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      console.error('Error opening webcam:', err);
      const name = err?.name || '';
      const message = name === 'NotAllowedError' || name === 'PermissionDeniedError'
        ? 'Camera permission was blocked. Allow the camera for this site in the browser site settings, then press Enable AI again.'
        : name === 'NotFoundError' || name === 'DevicesNotFoundError'
          ? 'No camera was found on this computer.'
          : name === 'NotReadableError' || name === 'TrackStartError'
            ? 'The camera is already open in another app or browser tab. Close that app, then press Enable AI again.'
            : name === 'NotSupportedError' || name === 'SecurityError'
              ? 'The camera can only start on localhost or https.'
              : `The camera did not start (${name || 'unknown error'}).`;
      setErrorMsg(message);
      setCameraActive(false);
    }
  };

  // ── Stop Webcam Stream ──
  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setChannels(null);
    setWindowCount(0);
    setDetectedState('Unknown');
    setStateReason('Camera inactive');
    setSustainedState('unknown');
    setSustainedSeconds(0);
    sustainedSecsRef.current = 0;
    displayedStateRef.current = 'unknown';
    candidateStateRef.current = null;
    candidateSinceRef.current = 0;
    onFaceActiveRef.current?.(false);
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Expression window stays in the browser. Frames are never uploaded.
  useEffect(() => {
    if (!cameraActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return undefined;
    }

    let cancelled = false;
    const frames = [];
    let lastStamp = performance.now();
    let busy = false;
    let engine = null;
    let missedFaces = 0;

    const tick = async () => {
      if (busy || cancelled) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;
      if (streamRef.current && video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
        video.play().catch(() => {});
      }

      busy = true;
      const now = performance.now();
      const deltaSec = Math.min(1.5, (now - lastStamp) / 1000);
      lastStamp = now;
      try {
        if (!engine) engine = await import('../ml/cognitiveEngine');
        const stack = await engine.loadCognitiveStack();
        if (cancelled) return;
        setModelReady(true);
        const vector = await engine.readExpression(video);
        if (cancelled) return;

        if (!vector) {
          missedFaces += 1;
          onFaceActiveRef.current?.(false);
          if (missedFaces < 3) {
            setStateReason('Face not clear enough for this sample. The last window is kept.');
            return;
          }
          frames.length = 0;
          setWindowCount(0);
          setDetectedState('Unknown');
          displayedStateRef.current = 'unknown';
          candidateStateRef.current = null;
          candidateSinceRef.current = 0;
          setStateReason('Center your face in the camera. Video stays on this device.');
          return;
        }
        missedFaces = 0;

        frames.push(vector);
        if (frames.length > WINDOW_SIZE) frames.shift();
        onFaceActiveRef.current?.(true);
        setChannels(vector);
        setWindowCount(frames.length);
        setMetrics({
          neutral: vector[6],
          happy: vector[3],
          tension: vector[0] + vector[2] + vector[4],
        });

        if (frames.length < WINDOW_SIZE) {
          setDetectedState('Unknown');
          setStateReason(`Expression matrix is live. Class matrix uses ${frames.length}/${WINDOW_SIZE} frames.`);
          return;
        }

        const data = engine.classificationFromWindow(stack, frames);
        setConfidence(data.confidence);
        setProbabilities(data.probabilities);
        setStateReason(data.reason);
        onCognitiveLoadUpdateRef.current?.(data.cognitive_load);

        const category = data.cognitive_state === 1 ? 'overload' : (data.cognitive_state === 2 ? 'boredom' : 'flow');
        setDetectedState(STATE_NAMES[category]);
        const classifiedAt = performance.now();
        if (category === displayedStateRef.current) {
          candidateStateRef.current = null;
          candidateSinceRef.current = 0;
        } else if (candidateStateRef.current !== category) {
          candidateStateRef.current = category;
          candidateSinceRef.current = classifiedAt;
        } else if (classifiedAt - candidateSinceRef.current >= 4400) {
          displayedStateRef.current = category;
          candidateStateRef.current = null;
          candidateSinceRef.current = 0;
        }
        if (category === sustainedStateRef.current) sustainedSecsRef.current += deltaSec;
        else {
          sustainedStateRef.current = category;
          sustainedSecsRef.current = deltaSec;
        }
        setSustainedState(category);
        setSustainedSeconds(Math.floor(sustainedSecsRef.current));
        onStateUpdateRef.current?.({
          state: displayedStateRef.current,
          confidence: data.confidence / 100,
          source: 'camera',
          load: data.cognitive_load,
          probabilities: data.probabilities,
          sustainedState: category,
          sustainedSeconds: Math.floor(sustainedSecsRef.current),
          windowCount: frames.length,
        });
        setStateReason(`Raw window: ${STATE_NAMES[category]}. ${data.reason}`);
        if (sustainedSecsRef.current >= 30 && category !== 'flow') {
          if (category === 'overload') onTriggerSuggestionRef.current?.('simpler');
          if (category === 'boredom') onTriggerSuggestionRef.current?.('harder');
          sustainedSecsRef.current = 0;
          setSustainedSeconds(0);
        }
      } catch (error) {
        setModelReady(false);
        onFaceActiveRef.current?.(false);
        setStateReason(error?.message || 'The on-device model could not start. Run npm run train.');
      } finally {
        busy = false;
      }
    };

    intervalRef.current = setInterval(tick, 400);
    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraActive]);

  const displayState = STATE_NAMES[cogState?.state] || detectedState;

  const getStateColor = () => {
    if (displayState === 'Flow') return '#10b981';
    if (displayState === 'Overload') return '#f43f5e';
    if (displayState === 'Boredom') return '#f59e0b';
    return '#94a3b8';
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: cameraActive ? 12 : 8,
        minHeight: 36,
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: cameraActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: cameraActive ? 'var(--indigo-light)' : 'var(--text-muted)',
            flexShrink: 0
          }}>
            <Brain size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}>
              Webcam Focus AI
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: modelReady ? '#10b981' : '#f59e0b'
              }} />
              {modelReady ? 'On-device DAiSEE model' : 'Model file not loaded'}
            </div>
          </div>
        </div>

        {/* Toggle Camera Button */}
        <button
          id="btn-toggle-webcam-ai"
          type="button"
          onClick={cameraActive ? stopCamera : startCamera}
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: cameraActive ? 'rgba(244,63,94,0.18)' : 'rgba(99,102,241,0.2)',
            color: cameraActive ? '#fda4af' : '#c7d2fe',
            border: `1px solid ${cameraActive ? 'rgba(244,63,94,0.45)' : 'rgba(99,102,241,0.45)'}`,
            boxShadow: cameraActive ? '0 0 12px rgba(244,63,94,0.2)' : '0 0 12px rgba(99,102,241,0.2)',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            zIndex: 10,
            outline: 'none',
            userSelect: 'none',
          }}
        >
          {cameraActive ? <><CameraOff size={13} /> Stop</> : <><Camera size={13} /> Enable AI</>}
        </button>
      </div>

      {/* Error message banner */}
      {errorMsg && (
        <div style={{
          padding: '8px 10px', borderRadius: 8, background: 'rgba(244,63,94,0.1)',
          border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af', fontSize: 11,
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10
        }}>
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}

      {/* In-Page Video Preview Box */}
      {cameraActive && (
        <div style={{ position: 'relative', marginBottom: 12 }}>
          {showPreview ? (
            <div style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              aspectRatio: '4/3',
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  e.target.play().catch(console.warn);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror preview
                  display: 'block'
                }}
              />

              {/* Status Badge Tag on Top Left */}
              <div style={{
                position: 'absolute', top: 8, left: 8,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                padding: '3px 8px', borderRadius: 12,
                fontSize: 10, fontWeight: 700,
                color: getStateColor(),
                display: 'flex', alignItems: 'center', gap: 5,
                border: `1px solid ${getStateColor()}40`
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: getStateColor() }} />
                {displayState}
              </div>

              {/* Confidence Badge Top Right */}
              {confidence > 0 && windowCount >= WINDOW_SIZE && (
                <div style={{
                  position: 'absolute', bottom: 8, left: 8,
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                  padding: '2px 7px', borderRadius: 10,
                  fontSize: 9, fontWeight: 700, color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {confidence.toFixed(0)}% score
                </div>
              )}

              {/* Hide Preview Button */}
              <button
                onClick={() => setShowPreview(false)}
                title="Hide preview"
                style={{
                  all: 'unset', cursor: 'pointer',
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.6)', borderRadius: '50%',
                  padding: 5, color: '#fff'
                }}
              >
                <EyeOff size={13} />
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)'
            }}>
              <span>Video active in background</span>
              <button
                onClick={() => setShowPreview(true)}
                style={{ all: 'unset', cursor: 'pointer', color: 'var(--indigo-light)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
              >
                <Eye size={12} /> Show Video
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video is analyzed in memory. Nothing is drawn to a canvas or uploaded. */}

      {/* Real-Time Telemetry & Sustained Window Meter */}
      {cameraActive ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* State & Diagnostic Reason Card */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: `${getStateColor()}14`,
            border: `1px solid ${getStateColor()}35`,
            boxShadow: `0 2px 12px ${getStateColor()}10`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: getStateColor(), display: 'flex', alignItems: 'center', gap: 7 }}>
                <Activity size={14} />
                {displayState === 'Flow' && 'Flow'}
                {displayState === 'Overload' && 'Overload'}
                {displayState === 'Boredom' && 'Boredom'}
                {displayState === 'Unknown' && 'Reading the window'}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-secondary)'
              }}>
                {confidence > 0 ? `${confidence}% score` : 'Detecting...'}
              </span>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-primary)', marginTop: 6, lineHeight: 1.45, fontWeight: 550 }}>
              {stateReason}
            </div>
          </div>

          {/* Live Emotional & Facial Cues Breakdown */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Live Facial Indicators
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {/* Focus */}
              <div style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
                <div style={{ fontSize: 10, color: '#a5b4fc', marginBottom: 2 }}>🧠 Focus</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {Math.round((metrics.neutral || 0) * 100)}%
                </div>
              </div>

              {/* Engagement / Joy */}
              <div style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <div style={{ fontSize: 10, color: '#6ee7b7', marginBottom: 2 }}>😊 Joy / Receptive</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {Math.round((metrics.happy || 0) * 100)}%
                </div>
              </div>

              {/* Tension / Strain */}
              <div style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <div style={{ fontSize: 10, color: '#fda4af', marginBottom: 2 }}>⚡ Tension</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {Math.round((metrics.tension || 0) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Cognitive State Probabilities */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>Model scores</span>
              <span>{windowCount}/{WINDOW_SIZE} Frames</span>
            </div>
            {[
              ['Flow (Deep Focus)', probabilities.flow, '#10b981'],
              ['Overload (Struggle)', probabilities.overload, '#f43f5e'],
              ['Boredom (Passive)', probabilities.boredom, '#f59e0b'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 38px', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 650, color }}>{label}</span>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((value || 0) * 100)}%`, background: color, transition: 'width 0.3s ease' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {windowCount >= WINDOW_SIZE ? `${Math.round((value || 0) * 100)}%` : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Sustained Adaptation Progress */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>
              <span>Sustained {STATE_NAMES[sustainedState] || STATE_NAMES.unknown}</span>
              <span style={{ fontWeight: 700, color: sustainedSeconds >= 20 ? '#fda4af' : 'var(--text-secondary)' }}>
                {sustainedSeconds}s / 30s
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (sustainedSeconds / 30) * 100)}%`,
                background: sustainedState === 'overload' ? 'var(--rose)' : (sustainedState === 'boredom' ? 'var(--amber)' : 'var(--emerald)'),
                transition: 'width 0.9s linear'
              }} />
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 5 }}>
              When state persists for 30s, CogFlow offers an automatic tier calibration toast.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(99,102,241,0.06)',
          border: '1px dashed rgba(99,102,241,0.3)',
          fontSize: 11.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
        }}>
          <Sparkles size={16} style={{ color: 'var(--indigo-light)', flexShrink: 0 }} />
          <span>
            Click <strong style={{ color: '#c7d2fe' }}>Enable AI</strong> above to detect cognitive load live via webcam.
          </span>
        </div>
      )}
    </div>
  );
}
