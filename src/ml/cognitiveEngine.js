import * as faceapi from '@vladmandic/face-api';
import {
  WINDOW_SIZE,
  STATE_LABELS,
  expressionToVector,
  summarizeWindow,
  featureNames,
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

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models/face'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models/face'),
      ]);

      const response = await fetch('/models/cogflow/logistic_model.json');

      if (!response.ok) {
        throw new Error(
          'CogFlow Logistic Regression model is missing. Place logistic_model.json in public/models/cogflow.'
        );
      }

      const model = await response.json();

      const expectedFeatures = featureNames();

      const validModel =
        model?.model_type === 'multinomial_logistic_regression' &&
        Array.isArray(model.features) &&
        model.features.length === expectedFeatures.length &&
        model.features.every(
          (name, index) => name === expectedFeatures[index]
        ) &&
        Array.isArray(model.classes) &&
        model.classes.length === 3 &&
        model.classes.every((value, index) => value === index) &&
        Array.isArray(model.mean) &&
        model.mean.length === 28 &&
        Array.isArray(model.scale) &&
        model.scale.length === 28 &&
        Array.isArray(model.coefficients) &&
        model.coefficients.length === 3 &&
        model.coefficients.every(
          row => Array.isArray(row) && row.length === 28
        ) &&
        Array.isArray(model.intercepts) &&
        model.intercepts.length === 3 &&
        model.mean.every(Number.isFinite) &&
        model.scale.every(
          value => Number.isFinite(value) && value > 0
        ) &&
        model.coefficients.every(
          row => row.every(Number.isFinite)
        ) &&
        model.intercepts.every(Number.isFinite);

      if (!validModel) {
        throw new Error(
          'CogFlow Logistic Regression model has an invalid format or dimensions.'
        );
      }

      const norm = {
        mean: model.mean,
        std: model.scale,
      };

      return { model, norm };
    })().catch(error => {
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

  const box = detection?.detection?.box;
  const score = detection?.detection?.score;
  const faceWidth = box?.width || 0;
  const frameWidth = video?.videoWidth || 0;
  const largeEnough = frameWidth > 0 && faceWidth / frameWidth >= 0.12;
  if (!detection?.expressions || !(score >= 0.45) || !largeEnough) return null;

  return expressionToVector(detection.expressions);
}

function predictProbabilities(model, normalizedFeatures) {
  const logits = model.coefficients.map((weights, classIndex) => {
    let score = model.intercepts[classIndex];

    for (let i = 0; i < weights.length; i += 1) {
      score += weights[i] * normalizedFeatures[i];
    }

    return score;
  });

  const maxLogit = Math.max(...logits);

  const exponentials = logits.map(
    value => Math.exp(value - maxLogit)
  );

  const total = exponentials.reduce(
    (sum, value) => sum + value,
    0
  );

  return exponentials.map(value => value / total);
}

export function classificationFromWindow(stack, frames) {
  if (
    !stack?.model ||
    !stack?.norm ||
    !Array.isArray(frames) ||
    frames.length === 0
  ) {
    throw new Error(
      'CogFlow classifier is not ready or the frame window is empty.'
    );
  }

  const rawFeatures = summarizeWindow(frames);

  const features = normalizeFeatures(
    rawFeatures,
    stack.norm.mean,
    stack.norm.std
  );

  const probabilities = predictProbabilities(
    stack.model,
    features
  );

  let state = 0;

  for (let i = 1; i < probabilities.length; i += 1) {
    if (probabilities[i] > probabilities[state]) {
      state = i;
    }
  }

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

    reason: reasonFor(state, confidence, latest),

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
  const score = `${Math.round(confidence * 100)}% model score`;
  if (state === 1) {
    return `${score} for the derived overload label. A lesson change still waits until this holds.`;
  }
  if (state === 2) {
    return `${score} for the derived boredom label. A lesson change still waits until this holds.`;
  }
  return `${score} for the derived flow label.`;
}

export { WINDOW_SIZE };