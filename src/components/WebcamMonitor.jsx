import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Eye, EyeOff, AlertCircle, Brain, Sparkles, Activity } from 'lucide-react';
import { WINDOW_SIZE } from '../../shared/cognitiveFeatures';

export default function WebcamMonitor({ onCognitiveLoadUpdate, onTriggerSuggestion, onFaceActive }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  
  // Real-time analysis states
  const [detectedState, setDetectedState] = useState('Idle');
  const [stateReason, setStateReason] = useState('Camera inactive');
  const [confidence, setConfidence] = useState(0);
  const [probabilities, setProbabilities] = useState({ flow: 0.33, overload: 0.33, boredom: 0.33 });
  const [metrics, setMetrics] = useState({ neutral: 0, happy: 0, tension: 0 });
  const [errorMsg, setErrorMsg] = useState(null);

  // 30-Second Rule Tracking
  const [sustainedState, setSustainedState] = useState('Flow');
  const [sustainedSeconds, setSustainedSeconds] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Sustained tracking refs to avoid stale closures
  const sustainedStateRef = useRef('Flow');
  const sustainedSecsRef = useRef(0);

  // Store parent callbacks in refs so interval does NOT restart on parent re-renders
  const onCognitiveLoadUpdateRef = useRef(onCognitiveLoadUpdate);
  const onTriggerSuggestionRef = useRef(onTriggerSuggestion);
  const onFaceActiveRef = useRef(onFaceActive);
  useEffect(() => {
    onCognitiveLoadUpdateRef.current = onCognitiveLoadUpdate;
    onTriggerSuggestionRef.current = onTriggerSuggestion;
    onFaceActiveRef.current = onFaceActive;
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
    fetch('/models/cogflow/model.json')
      .then((response) => { if (isMounted) setModelReady(response.ok); })
      .catch(() => { if (isMounted) setModelReady(false); });
    return () => { isMounted = false; };
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
      setIsCalibrating(true);
      setCalibProgress(0);
      calibSamplesRef.current = [];
      sustainedSecsRef.current = 0;
      setSustainedSeconds(0);
      setDetectedState('Calibrating (0/5s)');
      setStateReason('Look naturally at the screen to establish personal baseline');
    } catch (err) {
      console.error('Error opening webcam:', err);
      setErrorMsg('Could not access webcam. Please verify camera permissions in your browser.');
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
    setIsCalibrating(false);
    setDetectedState('Idle');
    setStateReason('Camera inactive');
    setSustainedSeconds(0);
    sustainedSecsRef.current = 0;
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
          onFaceActiveRef.current?.(false);
          setStateReason('Center your face in the camera. Video stays on this device.');
          if (frames.length >= WINDOW_SIZE) setDetectedState('No Face Detected');
          return;
        }

        frames.push(vector);
        if (frames.length > WINDOW_SIZE) frames.shift();
        onFaceActiveRef.current?.(true);
        setMetrics({
          neutral: vector[6],
          happy: vector[3],
          tension: vector[0] + vector[2] + vector[4],
        });

        if (frames.length < WINDOW_SIZE) {
          setIsCalibrating(true);
          setCalibProgress(frames.length);
          setDetectedState(`Calibrating (${frames.length}/${WINDOW_SIZE})`);
          setStateReason('Look at the lesson naturally while the on-device model fills an 11-frame window.');
          return;
        }

        const data = engine.classificationFromWindow(stack, frames);
        setIsCalibrating(false);
        setConfidence(data.confidence);
        setProbabilities(data.probabilities);
        setDetectedState(data.state_label);
        setStateReason(data.reason);
        onCognitiveLoadUpdateRef.current?.(data.cognitive_load);

        const category = data.cognitive_state === 1 ? 'Overload' : (data.cognitive_state === 2 ? 'Boredom' : 'Flow');
        if (category === sustainedStateRef.current) sustainedSecsRef.current += deltaSec;
        else {
          sustainedStateRef.current = category;
          sustainedSecsRef.current = deltaSec;
        }
        setSustainedState(category);
        setSustainedSeconds(Math.floor(sustainedSecsRef.current));
        if (sustainedSecsRef.current >= 30 && category !== 'Flow') {
          if (category === 'Overload') onTriggerSuggestionRef.current?.('simpler');
          if (category === 'Boredom') onTriggerSuggestionRef.current?.('harder');
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

  // Color mappings
  const getStateColor = () => {
    if (detectedState.includes('Flow')) return '#10b981'; // Emerald
    if (detectedState.includes('Overload') || detectedState.includes('Confusion')) return '#f43f5e'; // Rose
    if (detectedState.includes('Boredom') || detectedState.includes('Disengaged')) return '#f59e0b'; // Amber
    if (detectedState.includes('Calibrating')) return '#818cf8'; // Indigo
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
                {detectedState}
              </div>

              {/* Confidence Badge Top Right */}
              {confidence > 0 && !isCalibrating && (
                <div style={{
                  position: 'absolute', bottom: 8, left: 8,
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                  padding: '2px 7px', borderRadius: 10,
                  fontSize: 9, fontWeight: 700, color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {confidence.toFixed(0)}% Conf
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* State & Reason Card */}
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            background: `${getStateColor()}12`,
            border: `1px solid ${getStateColor()}30`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: getStateColor(), display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={13} />
                {detectedState}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Neutral {Math.round((metrics.neutral || 0) * 100)}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              {stateReason}
            </div>

            {/* Neural Probabilities Mini-bar */}
            {!isCalibrating && probabilities && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>
                  <span style={{ color: '#10b981' }}>Flow {Math.round((probabilities.flow || 0)*100)}%</span>
                  <span style={{ color: '#f43f5e' }}>Overload {Math.round((probabilities.overload || 0)*100)}%</span>
                  <span style={{ color: '#f59e0b' }}>Boredom {Math.round((probabilities.boredom || 0)*100)}%</span>
                </div>
                <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${(probabilities.flow || 0)*100}%`, background: '#10b981' }} />
                  <div style={{ width: `${(probabilities.overload || 0)*100}%`, background: '#f43f5e' }} />
                  <div style={{ width: `${(probabilities.boredom || 0)*100}%`, background: '#f59e0b' }} />
                </div>
              </div>
            )}
          </div>

          {/* 30-Second Sustained Bar */}
          {!isCalibrating ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Sustained {sustainedState}</span>
                <span style={{ fontWeight: 700, color: sustainedSeconds >= 20 ? '#fda4af' : 'var(--text-secondary)' }}>
                  {sustainedSeconds}s / 30s
                </span>
              </div>
              <div style={{
                height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (sustainedSeconds / 30) * 100)}%`,
                  background: sustainedState === 'Overload' ? 'var(--rose)' : (sustainedState === 'Boredom' ? 'var(--amber)' : 'var(--emerald)'),
                  transition: 'width 0.9s linear'
                }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                ⏱️ 30s sustained trigger prevents false adaptation
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(99,102,241,0.06)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--indigo-light)', marginBottom: 4 }}>
                <span>Calibrating Personal Baseline</span>
                <span style={{ fontWeight: 700 }}>{calibProgress}/{WINDOW_SIZE}</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(calibProgress / WINDOW_SIZE) * 100}%`, background: 'var(--indigo-light)', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          background: 'rgba(99,102,241,0.06)',
          border: '1px dashed rgba(99,102,241,0.3)',
          fontSize: 11,
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
