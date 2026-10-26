import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Eye, EyeOff, AlertCircle, CheckCircle2, Brain, Zap, Sparkles, Activity, ShieldCheck, Wifi, WifiOff } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function WebcamMonitor({ onCognitiveLoadUpdate, onTriggerSuggestion, onCameraStatusChange }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0);
  const [backendConnected, setBackendConnected] = useState(false);
  
  // Real-time analysis states
  const [detectedState, setDetectedState] = useState('Idle');
  const [stateReason, setStateReason] = useState('Camera inactive');
  const [confidence, setConfidence] = useState(0);
  const [modelName, setModelName] = useState('DAiSEE BiLSTM');
  const [probabilities, setProbabilities] = useState({ flow: 0.33, overload: 0.33, boredom: 0.33 });
  const [metrics, setMetrics] = useState({ brow_down: 0, blink: 0, squint: 0, pitch_ratio: 0 });
  const [errorMsg, setErrorMsg] = useState(null);

  // Persistence windows: 5s for overload, 8s for boredom.
  const [sustainedState, setSustainedState] = useState('Flow');
  const [sustainedSeconds, setSustainedSeconds] = useState(0);

  // Presentation Demo Mode state (explicitly labeled simulation)
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatedStateName, setSimulatedStateName] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const isSimulatedRef = useRef(false);
  
  // Personal baseline calibration
  const baseBrowRef = useRef(0.005);
  const baseSquintRef = useRef(0.35);
  const calibSamplesRef = useRef([]);

  // Sustained tracking refs to avoid stale closures
  const sustainedStateRef = useRef('Flow');
  const sustainedSecsRef = useRef(0);

  // Store parent callbacks in refs so interval does NOT restart on parent re-renders
  const onCognitiveLoadUpdateRef = useRef(onCognitiveLoadUpdate);
  const onTriggerSuggestionRef = useRef(onTriggerSuggestion);
  const onCameraStatusChangeRef = useRef(onCameraStatusChange);
  useEffect(() => {
    onCognitiveLoadUpdateRef.current = onCognitiveLoadUpdate;
    onTriggerSuggestionRef.current = onTriggerSuggestion;
    onCameraStatusChangeRef.current = onCameraStatusChange;
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

  // ── Health Check to Port 8000 on mount ──
  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/`, { method: 'GET' });
        if (isMounted) setBackendConnected(res.ok);
      } catch {
        if (isMounted) setBackendConnected(false);
      }
    };
    checkBackend();
    const pingTimer = setInterval(checkBackend, 4000);
    return () => {
      isMounted = false;
      clearInterval(pingTimer);
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
      setIsCalibrating(true);
      setCalibProgress(0);
      calibSamplesRef.current = [];
      sustainedSecsRef.current = 0;
      setSustainedSeconds(0);
      setDetectedState('Calibrating (0/5s)');
      setStateReason('Look naturally at the screen to establish personal baseline');
      if (onCameraStatusChangeRef.current) {
        onCameraStatusChangeRef.current({ active: true, calibrated: false });
      }
    } catch (err) {
      console.error('Error opening webcam:', err);
      setErrorMsg('Could not access webcam. Please verify camera permissions in your browser.');
      setCameraActive(false);
      if (onCameraStatusChangeRef.current) {
        onCameraStatusChangeRef.current({ active: false, calibrated: false });
      }
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
    if (onCameraStatusChangeRef.current) {
      onCameraStatusChangeRef.current({ active: false, calibrated: false });
    }
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── Process Frame Analysis Loop (Runs continuously when cameraActive is true) ──
  useEffect(() => {
    if (!cameraActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Capture and analyze 1 frame every 1 second
    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      // Re-link stream if detached
      if (streamRef.current && video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
        video.play().catch(console.warn);
      }

      // Check video has live frames
      if (video.readyState < 2 || video.videoWidth === 0) {
        return;
      }

      canvas.width = 320;
      canvas.height = 240;

      const ctx = canvas.getContext('2d');
      // Standard mirror transform on canvas
      ctx.save();
      ctx.translate(320, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, 320, 240);
      ctx.restore();

      const base64Image = canvas.toDataURL('image/jpeg', 0.65);

      try {
        const response = await fetch(`${API_BASE}/api/analyze-frame`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
            base_brow: baseBrowRef.current,
            base_squint: baseSquintRef.current
          })
        });

        if (!response.ok) {
          setBackendConnected(false);
          return;
        }

        const data = await response.json();
        setBackendConnected(true);

        // When demo simulation is active, preserve it without overwriting from camera ticks
        if (isSimulatedRef.current) {
          return;
        }

        if (data.status === 'success' && data.face_detected) {
          const currentMetrics = data.metrics || {};
          setMetrics(currentMetrics);
          if (data.confidence) setConfidence(data.confidence);
          if (data.model_name) setModelName(data.model_name);
          if (data.probabilities) setProbabilities(data.probabilities);

          // ── Calibration Stage (First 5 seconds) ──
          if (calibSamplesRef.current.length < 5) {
            calibSamplesRef.current.push({
              brow: currentMetrics.brow_down || 0.005,
              squint: currentMetrics.squint || 0.35
            });
            const progress = calibSamplesRef.current.length;
            setCalibProgress(progress);
            setDetectedState(`Calibrating (${progress}/5s)`);
            setStateReason('Hold neutral gaze while model maps your resting facial shape');

            if (progress >= 5) {
              const avgBrow = calibSamplesRef.current.reduce((a, b) => a + b.brow, 0) / 5;
              const avgSquint = calibSamplesRef.current.reduce((a, b) => a + b.squint, 0) / 5;
              baseBrowRef.current = avgBrow;
              baseSquintRef.current = avgSquint;
              setIsCalibrating(false);
              setDetectedState(data.state_label || 'Flow (Optimal)');
              setStateReason('Baseline calibrated! Real-time AI monitoring active.');
              if (onCameraStatusChangeRef.current) {
                onCameraStatusChangeRef.current({ active: true, calibrated: true });
              }
            }
            return;
          }

          // ── Active Neural Classification Stage ──
          const stateCode = data.cognitive_state; // 0=Flow, 1=Overload, 2=Boredom
          const label = data.state_label || 'Flow (Optimal)';
          setDetectedState(label);
          setStateReason(data.reason || '');

          // Update Cognitive Load Gauge (0 to 100)
          let calculatedLoad = 48;
          if (stateCode === 1) calculatedLoad = 82; // Overload
          else if (stateCode === 2) calculatedLoad = 22; // Boredom
          else calculatedLoad = 48; // Flow
          
          if (onCognitiveLoadUpdateRef.current) {
            onCognitiveLoadUpdateRef.current(calculatedLoad);
          }

          // Sustained-state policy avoids reacting to a single noisy estimate.
          const currentCategory = stateCode === 1 ? 'Overload' : (stateCode === 2 ? 'Boredom' : 'Flow');
          
          if (currentCategory === sustainedStateRef.current) {
            sustainedSecsRef.current += 1;
          } else {
            sustainedStateRef.current = currentCategory;
            sustainedSecsRef.current = 1;
          }

          setSustainedState(sustainedStateRef.current);
          setSustainedSeconds(sustainedSecsRef.current);

          // Fast response for overload; require a short stable window for boredom.
          const persistenceThreshold = sustainedStateRef.current === 'Overload' ? 5 : 8;
          if (sustainedStateRef.current !== 'Flow' && sustainedSecsRef.current >= persistenceThreshold) {
            if (sustainedStateRef.current === 'Overload' && onTriggerSuggestionRef.current) {
              onTriggerSuggestionRef.current('simpler');
            } else if (sustainedStateRef.current === 'Boredom' && onTriggerSuggestionRef.current) {
              onTriggerSuggestionRef.current('harder');
            }
            // Reset counter to avoid duplicate firing; parent cooldown prevents oscillation.
            sustainedSecsRef.current = 0;
            setSustainedSeconds(0);
          }

        } else if (!data.face_detected) {
          if (calibSamplesRef.current.length < 5) {
            setStateReason('Please center your face in the camera view');
          } else {
            setDetectedState('No Face Detected');
            setStateReason(data.reason || 'Please face the camera directly to track focus');
          }
        }
      } catch (err) {
        setBackendConnected(false);
        setStateReason('FastAPI backend offline on port 8000');
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraActive]);

  // Color mappings
  const getStateColor = () => {
    if (isSimulated) {
      if (simulatedStateName === 'overload') return '#f43f5e';
      if (simulatedStateName === 'boredom') return '#f59e0b';
      if (simulatedStateName === 'flow') return '#10b981';
    }
    if (detectedState.includes('Flow')) return '#10b981'; // Emerald
    if (detectedState.includes('Overload') || detectedState.includes('Confusion')) return '#f43f5e'; // Rose
    if (detectedState.includes('Boredom') || detectedState.includes('Disengaged')) return '#f59e0b'; // Amber
    if (detectedState.includes('Calibrating')) return '#818cf8'; // Indigo
    return '#94a3b8';
  };

  // ── Presentation Demo Controls (Clearly labeled simulation) ──
  const simulateState = (target) => {
    isSimulatedRef.current = true;
    setIsSimulated(true);
    setSimulatedStateName(target);

    if (target === 'overload') {
      setDetectedState('Overload / Confusion (SIMULATED)');
      setStateReason('Demo simulation: high AU4 brow furrow strain & confusion');
      setProbabilities({ flow: 0.05, overload: 0.90, boredom: 0.05 });
      setConfidence(94);
      setMetrics({ brow_down: 0.125, blink: 0.04, squint: 0.45, pitch_ratio: -0.05 });
      if (onCognitiveLoadUpdateRef.current) onCognitiveLoadUpdateRef.current(84);
      if (onTriggerSuggestionRef.current) onTriggerSuggestionRef.current('simpler');
    } else if (target === 'boredom') {
      setDetectedState('Boredom / Disengaged (SIMULATED)');
      setStateReason('Demo simulation: flat affect, low arousal, looking away');
      setProbabilities({ flow: 0.06, overload: 0.04, boredom: 0.90 });
      setConfidence(92);
      setMetrics({ brow_down: 0.002, blink: 0.02, squint: 0.10, pitch_ratio: 0.48 });
      if (onCognitiveLoadUpdateRef.current) onCognitiveLoadUpdateRef.current(22);
      if (onTriggerSuggestionRef.current) onTriggerSuggestionRef.current('harder');
    } else if (target === 'flow') {
      setDetectedState('Flow / Optimal (SIMULATED)');
      setStateReason('Demo simulation: focused steady reading pace');
      setProbabilities({ flow: 0.90, overload: 0.05, boredom: 0.05 });
      setConfidence(90);
      setMetrics({ brow_down: 0.008, blink: 0.15, squint: 0.35, pitch_ratio: 0.02 });
      if (onCognitiveLoadUpdateRef.current) onCognitiveLoadUpdateRef.current(48);
    }
  };

  const resetSimulation = () => {
    isSimulatedRef.current = false;
    setIsSimulated(false);
    setSimulatedStateName(null);
    if (!cameraActive) {
      setDetectedState('Idle');
      setStateReason('Camera inactive');
      if (onCognitiveLoadUpdateRef.current) onCognitiveLoadUpdateRef.current(50);
    }
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
                background: backendConnected ? '#10b981' : '#f43f5e'
              }} />
              {backendConnected ? 'DAiSEE BiLSTM Connected' : 'Port 8000 Disconnected'}
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
              background: '#090d16',
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

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

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
                AU4: {metrics.brow_down?.toFixed(3)}
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

          {/* Sustained-state progress */}
          {!isCalibrating ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Sustained {sustainedState}</span>
                <span style={{ fontWeight: 700, color: sustainedSeconds >= (sustainedState === 'Boredom' ? 8 : 5) ? '#fda4af' : 'var(--text-secondary)' }}>
                  {sustainedSeconds}s / {sustainedState === 'Boredom' ? 8 : 5}s
                </span>
              </div>
              <div style={{
                height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (sustainedSeconds / (sustainedState === 'Boredom' ? 8 : 5)) * 100)}%`,
                  background: sustainedState === 'Overload' ? 'var(--rose)' : (sustainedState === 'Boredom' ? 'var(--amber)' : 'var(--emerald)'),
                  transition: 'width 0.9s linear'
                }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                Estimates are smoothed over 5 seconds (Overload) or 8 seconds (Boredom)
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(99,102,241,0.06)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--indigo-light)', marginBottom: 4 }}>
                <span>Calibrating Personal Baseline</span>
                <span style={{ fontWeight: 700 }}>{calibProgress}/5s</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(calibProgress / 5) * 100}%`, background: 'var(--indigo-light)', transition: 'width 0.5s ease' }} />
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

      {/* ── Presentation Demo Controls (Clearly labeled simulation) ── */}
      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Presentation Demo Controls
          </span>
          {isSimulated && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#fda4af', background: 'rgba(244,63,94,0.18)',
              padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(244,63,94,0.3)',
            }}>
              SIMULATION ACTIVE
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            type="button"
            id="demo-simulate-overload"
            onClick={() => simulateState('overload')}
            style={{
              padding: '6px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: simulatedStateName === 'overload' ? 'rgba(244,63,94,0.3)' : 'rgba(244,63,94,0.12)',
              color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            ⚡ Overload
          </button>
          <button
            type="button"
            id="demo-simulate-boredom"
            onClick={() => simulateState('boredom')}
            style={{
              padding: '6px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: simulatedStateName === 'boredom' ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.12)',
              color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            ⚡ Boredom
          </button>
        </div>
        {isSimulated && (
          <button
            type="button"
            id="demo-reset-sim"
            onClick={resetSimulation}
            style={{
              marginTop: 6, width: '100%', padding: '5px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)',
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            🔄 Reset to Live State
          </button>
        )}
      </div>
    </div>
  );
}
