import * as faceapi from '@vladmandic/face-api';
import {
  WINDOW_SIZE,
  STATE_LABELS,
  expressionToVector,
  summarizeWindow,
  normalizeFeatures,
  loadFromProbabilities,
} from '../../shared/cognitiveFeatures.js';

let stackPromise = null;

export function loadCognitiveStack() {
  if (!stackPromise) {
    stackPromise = (async () => {
      const tf = faceapi.tf;
      try {
        await tf.setBackend('webgl');
      } catch {
        await tf.setBackend('cpu');
      }
      await tf.ready();
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models/face');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models/face');
      const [model, norm] = await Promise.all([
        tf.loadLayersModel('/models/cogflow/model.json'),
        fetch('/models/cogflow/norm.json').then((response) => {
          if (!response.ok) throw new Error('Cognitive model stats are missing. Run npm run train.');
          return response.json();
        }),
      ]);
      return { model, norm };
    })().catch((error) => {
      stackPromise = null;
      throw error;
    });
  }
  return stackPromise;
}

const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.45,
});

export async function readExpression(video) {
  const detection = await faceapi
    .detectSingleFace(video, detectorOptions)
    .withFaceExpressions();
  if (!detection?.expressions) return null;
  return expressionToVector(detection.expressions);
}

export function classificationFromWindow(stack, frames) {
  const tf = faceapi.tf;
  const features = normalizeFeatures(summarizeWindow(frames), stack.norm.mean, stack.norm.std);
  const input = tf.tensor2d([features]);
  const output = stack.model.predict(input);
  const probabilities = Array.from(output.dataSync());
  input.dispose();
  output.dispose();

  let state = 0;
  const margin = probabilities[1] - probabilities[0];
  const boredomMargin = probabilities[2] - probabilities[0];
  if (probabilities[1] >= 0.42 && margin > 0.04) state = 1;
  else if (probabilities[2] >= 0.42 && boredomMargin > 0.04) state = 2;
  const confidence = probabilities[state] || 0;
  const latest = frames[frames.length - 1];
  return {
    cognitive_state: state,
    state_label: STATE_LABELS[state],
    cognitive_load: loadFromProbabilities(probabilities),
    confidence: Math.round(confidence * 100),
    probabilities: {
      flow: probabilities[0],
      overload: probabilities[1],
      boredom: probabilities[2],
    },
    reason: reasonFor(state, confidence),
    metrics: {
      neutral: latest[6],
      happy: latest[3],
      tension: latest[0] + latest[2] + latest[4],
    },
    filled: frames.length,
    window: WINDOW_SIZE,
  };
}

function reasonFor(state, confidence) {
  const sure = confidence >= 0.45 ? 'Clear' : 'Weak';
  if (state === 1) return `${sure} match to the DAiSEE overload pattern: rising tense expressions while reading.`;
  if (state === 2) return `${sure} match to the DAiSEE boredom pattern: flat, low-change expression.`;
  return `${sure} match to the DAiSEE flow pattern: stable, engaged expression.`;
}

export { WINDOW_SIZE };
