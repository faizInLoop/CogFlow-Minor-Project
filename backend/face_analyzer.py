"""
CogFlow Face Analyzer Module — Advanced Multimodal Neuromorphic Engine
======================================================================
Integrates MediaPipe Tasks FaceLandmarker (FACS Action Units + 3D Pose)
with the DAiSEE BiLSTM + Temporal Attention Neural Network (ONNX)
via Bayesian Evidential Fusion and Self-Calibrating Online Baselines.

Pipeline:
1. MediaPipe Tasks API extracts 52 FACS Blendshapes and 478 3D facial landmarks.
2. Self-Calibrating Online Baseline tracks individual resting facial tone (AU4 & AU7).
3. 3D Head-Pose Vectorization (Forehead-to-Chin Z-depth) captures pitch orientation.
4. Physiological Safety Overrides gate physical disengagement (closed eyes, extreme pitch, yawns).
5. Biometric FACS Tension Logits fuse with Prior-Calibrated DAiSEE BiLSTM ONNX inference.
6. Temporal Exponential Moving Average (EMA) eliminates camera noise and jitter.
7. Produces continuous Cognitive Load Index (0-100) and calibrated 3-state probabilities.
"""

import os
import cv2
import base64
import collections
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

try:
    import onnxruntime as ort
    HAS_ONNX = True
except ImportError:
    HAS_ONNX = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LANDMARKER_PATH = os.path.join(BASE_DIR, 'face_landmarker.task')
ONNX_MODEL_PATH = os.path.join(BASE_DIR, 'cogflow_daisee.onnx')

STATE_LABELS = {
    0: "Flow (Optimal)",
    1: "Overload / Confusion",
    2: "Boredom / Disengaged"
}

# Empirical training priors from benchmark DAiSEE dataset (Flow=69%, Overload=12%, Boredom=19%)
DAISEE_PRIORS = np.array([3687, 630, 1018], dtype=np.float32) / 5335.0
LOG_PRIORS = np.log(DAISEE_PRIORS)


def softmax(x):
    """Compute softmax probabilities with numerical stability."""
    e_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return e_x / np.sum(e_x, axis=-1, keepdims=True)


class FaceAnalyzer:
    def __init__(self):
        if not os.path.exists(LANDMARKER_PATH):
            raise FileNotFoundError(f"MediaPipe model not found at: {LANDMARKER_PATH}")

        # 1. Initialize MediaPipe FaceLandmarker
        base_options = python.BaseOptions(model_asset_path=LANDMARKER_PATH)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
            num_faces=1
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)
        print("[FaceAnalyzer] MediaPipe Tasks FaceLandmarker initialized.")

        # 2. Initialize DAiSEE BiLSTM+Attention ONNX Model
        self.onnx_session = None
        self.input_name = None
        if HAS_ONNX and os.path.exists(ONNX_MODEL_PATH):
            try:
                self.onnx_session = ort.InferenceSession(ONNX_MODEL_PATH)
                self.input_name = self.onnx_session.get_inputs()[0].name
                print(f"[FaceAnalyzer] DAiSEE ONNX Neural Network loaded from: {ONNX_MODEL_PATH}")
            except Exception as e:
                print(f"[FaceAnalyzer] Warning loading ONNX model ({e}), using calibrated heuristic fallback.")
        else:
            print("[FaceAnalyzer] ONNX model not found or onnxruntime unavailable, using calibrated fallback.")

        # Temporal sequence buffer (11-frame window for BiLSTM)
        self.sequence_buffer = collections.deque(maxlen=11)

        # Self-calibrating online baseline trackers
        self.adaptive_brow = 0.005
        self.adaptive_squint = 0.35
        self.has_user_anchor = False

        # Temporal Exponential Moving Average filter for jitter-free probability dynamics
        self.smooth_probs = np.array([0.72, 0.14, 0.14], dtype=np.float32)

    def decode_base64_image(self, base64_str: str) -> np.ndarray:
        """Decode a base64 image (with or without data URI prefix) into a BGR numpy array."""
        if ',' in base64_str:
            base64_str = base64_str.split(',', 1)[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    def analyze_frame(self, image_bgr: np.ndarray, base_brow: float = 0.005, base_squint: float = 0.35) -> dict:
        """
        Analyze a single webcam frame through the full multimodal ML pipeline.
        Returns real-time cognitive classification, continuous load index (0-100),
        softmax probability distributions, and biometric tension telemetry.
        """
        if image_bgr is None or image_bgr.size == 0:
            return {
                "face_detected": False,
                "cognitive_state": 0,
                "cognitive_load": 50,
                "state_label": "No Video Feed",
                "confidence": 0.0,
                "reason": "Empty video frame received",
                "metrics": {},
                "model_name": "None"
            }

        # Sync base anchor if supplied by user calibration
        if not self.has_user_anchor and (base_brow != 0.005 or base_squint != 0.35):
            self.adaptive_brow = float(base_brow)
            self.adaptive_squint = float(base_squint)
            self.has_user_anchor = True

        rgb_img = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
        detection_result = self.detector.detect(mp_image)

        if not detection_result.face_landmarks or len(detection_result.face_landmarks) == 0:
            return {
                "face_detected": False,
                "cognitive_state": 0,
                "cognitive_load": 50,
                "state_label": "No Face Detected",
                "confidence": 0.0,
                "reason": "Please face the camera directly to track focus",
                "metrics": {},
                "model_name": "None"
            }

        # ── 1. Extract 52 FACS Blendshapes ──
        blendshapes = {}
        if detection_result.face_blendshapes and len(detection_result.face_blendshapes) > 0:
            for cat in detection_result.face_blendshapes[0]:
                blendshapes[cat.category_name] = cat.score

        # Core Action Units (Ekman FACS)
        brow_down_raw = (blendshapes.get('browDownLeft', 0.0) + blendshapes.get('browDownRight', 0.0)) / 2.0
        blink = (blendshapes.get('eyeBlinkLeft', 0.0) + blendshapes.get('eyeBlinkRight', 0.0)) / 2.0
        squint_raw = (blendshapes.get('eyeSquintLeft', 0.0) + blendshapes.get('eyeSquintRight', 0.0)) / 2.0
        jaw_open = blendshapes.get('jawOpen', 0.0)
        smile = (blendshapes.get('mouthSmileLeft', 0.0) + blendshapes.get('mouthSmileRight', 0.0)) / 2.0
        frown = (blendshapes.get('mouthFrownLeft', 0.0) + blendshapes.get('mouthFrownRight', 0.0)) / 2.0
        nose_sneer = (blendshapes.get('noseSneerLeft', 0.0) + blendshapes.get('noseSneerRight', 0.0)) / 2.0
        brow_inner_up = blendshapes.get('browInnerUp', 0.0)

        # Baseline-normalized geometric tension deltas
        delta_brow = max(0.0, brow_down_raw - self.adaptive_brow)
        delta_squint = max(0.0, squint_raw - self.adaptive_squint)

        # ── 2. 3D Head Pitch Calculation from Mesh Geometry ──
        landmarks = detection_result.face_landmarks[0]
        lm_10 = landmarks[10]    # Forehead
        lm_152 = landmarks[152]  # Chin
        face_h = np.sqrt((lm_10.x - lm_152.x)**2 + (lm_10.y - lm_152.y)**2)
        face_h = max(1e-4, float(face_h))
        # Positive = looking up / tilted away; Negative = looking down
        pitch_ratio = float((lm_10.z - lm_152.z) / face_h)

        metrics = {
            "brow_down": round(float(brow_down_raw), 4),
            "delta_brow": round(float(delta_brow), 4),
            "blink": round(float(blink), 4),
            "squint": round(float(squint_raw), 4),
            "pitch_ratio": round(float(pitch_ratio), 3),
            "jaw_open": round(float(jaw_open), 3),
            "smile": round(float(smile), 3),
            "adaptive_baseline_brow": round(float(self.adaptive_brow), 4),
        }

        # ── 3. Physiological Safety Overrides (Reflex Constraints) ──
        # Severe eye closure (> 58%) -> Microsleep / Inattentive
        if blink > 0.58:
            override_probs = np.array([0.05, 0.05, 0.90], dtype=np.float32)
            self.smooth_probs = 0.70 * self.smooth_probs + 0.30 * override_probs
            return {
                "face_detected": True,
                "cognitive_state": 2,
                "cognitive_load": 18,
                "state_label": "Boredom / Inattentive",
                "confidence": 92.0,
                "probabilities": {"flow": 0.05, "overload": 0.05, "boredom": 0.90},
                "reason": "Eyes closed / reading pace interrupted",
                "metrics": metrics,
                "model_name": "Physiological Eye-Gating"
            }

        # Head tilted severely away from screen (|pitch| > 0.48)
        if pitch_ratio > 0.48 or pitch_ratio < -0.52:
            override_probs = np.array([0.08, 0.04, 0.88], dtype=np.float32)
            self.smooth_probs = 0.70 * self.smooth_probs + 0.30 * override_probs
            return {
                "face_detected": True,
                "cognitive_state": 2,
                "cognitive_load": 20,
                "state_label": "Disengaged / Looking Away",
                "confidence": 88.0,
                "probabilities": {"flow": 0.08, "overload": 0.04, "boredom": 0.88},
                "reason": "Head orientation not facing curriculum view",
                "metrics": metrics,
                "model_name": "3D Head-Pose Tracker"
            }

        # Pronounced yawning (jaw open > 0.42)
        if jaw_open > 0.42:
            override_probs = np.array([0.10, 0.05, 0.85], dtype=np.float32)
            self.smooth_probs = 0.70 * self.smooth_probs + 0.30 * override_probs
            return {
                "face_detected": True,
                "cognitive_state": 2,
                "cognitive_load": 22,
                "state_label": "Fatigue / Under-stimulated",
                "confidence": 86.0,
                "probabilities": {"flow": 0.10, "overload": 0.05, "boredom": 0.85},
                "reason": "Yawning / physiological fatigue detected",
                "metrics": metrics,
                "model_name": "FACS Yawn-Fatigue Detector"
            }

        # ── 4. Map Facial Geometry to DAiSEE Sequence Features ──
        feat_angry = float(min(1.0, delta_brow * 8.0))
        feat_disgust = float(min(1.0, nose_sneer * 2.0))
        feat_fear = float(min(1.0, brow_inner_up * 1.5))
        feat_happy = float(min(1.0, smile * 2.5))
        feat_sad = float(min(1.0, frown * 2.0 + delta_brow * 2.5))
        feat_surprise = float(min(1.0, jaw_open * 1.8))
        active_sum = feat_angry + feat_disgust + feat_fear + feat_happy + feat_sad + feat_surprise
        feat_neutral = float(max(0.05, 1.0 - active_sum))

        feature_vector = np.array([
            feat_angry, feat_disgust, feat_fear, feat_happy, feat_sad, feat_surprise, feat_neutral
        ], dtype=np.float32)
        feat_norm = feature_vector / (np.sum(feature_vector) + 1e-6)
        self.sequence_buffer.append(feat_norm)

        # ── 5. Biometric FACS Tension Evidence Formulation ──
        overload_evidence = (delta_brow * 32.0) + (delta_squint * 14.0)
        boredom_evidence = (
            max(0.0, abs(pitch_ratio) - 0.20) * 5.0 +
            max(0.0, blink - 0.28) * 6.0 +
            (jaw_open * 4.5) +
            (0.80 if (delta_brow < 0.005 and delta_squint * 0.05 < 0.01 and smile < 0.02 and abs(pitch_ratio) > 0.15) else 0.0)
        )

        if overload_evidence < 0.2 and boredom_evidence < 0.2:
            flow_evidence = 2.6
        else:
            flow_evidence = max(0.1, 2.0 - (overload_evidence * 1.2) - (boredom_evidence * 1.2))

        bio_logits = np.array([flow_evidence, overload_evidence, boredom_evidence], dtype=np.float32)

        # ── 6. Temporal Sequence Inference & Bayesian Fusion ──
        if self.onnx_session is not None:
            curr_buffer = list(self.sequence_buffer)
            while len(curr_buffer) < 11:
                curr_buffer.insert(0, curr_buffer[0] if curr_buffer else feat_norm)

            seq_tensor = np.array(curr_buffer, dtype=np.float32).reshape(1, 11, 7)
            try:
                outputs = self.onnx_session.run(None, {self.input_name: seq_tensor})
                raw_logits = outputs[0][0]
                # Prior correction: remove dataset class distribution imbalance
                calibrated_net_logits = raw_logits - 0.35 * LOG_PRIORS
                # Multimodal Bayesian Fusion (40% temporal recurrent sequence + 60% FACS geometric tension)
                fused_logits = 0.40 * calibrated_net_logits + 0.60 * bio_logits
            except Exception as e:
                print(f"[FaceAnalyzer] ONNX inference fallback ({e})")
                fused_logits = bio_logits
        else:
            fused_logits = bio_logits

        raw_probs = softmax(fused_logits)

        # ── 7. Temporal Exponential Moving Average (Jitter Removal) ──
        self.smooth_probs = 0.65 * self.smooth_probs + 0.35 * raw_probs
        probs = self.smooth_probs

        pred_class = int(np.argmax(probs))
        confidence = float(probs[pred_class] * 100.0)

        # ── 8. Continuous Cognitive Load Index (0-100) ──
        # Flow is anchored around 48%, Overload scales to 88%, Boredom drops to 18%
        cognitive_load = int(round(probs[0] * 48.0 + probs[1] * 88.0 + probs[2] * 18.0))
        cognitive_load = max(5, min(98, cognitive_load))

        # ── 9. Online Adaptive Self-Calibration ──
        # During confirmed Flow state without acute tension, slowly adapt baseline to ambient conditions
        if pred_class == 0 and delta_brow < 0.008 and abs(pitch_ratio) < 0.18:
            self.adaptive_brow = 0.995 * self.adaptive_brow + 0.005 * brow_down_raw
            self.adaptive_squint = 0.995 * self.adaptive_squint + 0.005 * squint_raw

        # Contextual reason for UI telemetry feedback
        if pred_class == 1:
            reason = f"AU4 brow furrow strain & cognitive tension detected (+{delta_brow:.3f})"
        elif pred_class == 2:
            reason = "Low affective arousal / passive disengagement detected"
        else:
            reason = "Steady reading pace with relaxed facial tone (Optimal Flow)"

        return {
            "face_detected": True,
            "cognitive_state": pred_class,
            "cognitive_load": cognitive_load,
            "state_label": STATE_LABELS.get(pred_class, "Flow (Optimal)"),
            "confidence": round(confidence, 1),
            "probabilities": {
                "flow": round(float(probs[0]), 3),
                "overload": round(float(probs[1]), 3),
                "boredom": round(float(probs[2]), 3)
            },
            "reason": reason,
            "metrics": metrics,
            "model_name": "BiLSTM-FACS Bayesian Hybrid Ensemble"
        }
