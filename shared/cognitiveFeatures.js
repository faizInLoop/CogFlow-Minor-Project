/**
 * Shared DAiSEE feature math.
 * Training (Node) and live inference (browser) must use this file unchanged.
 *
 * Each 11-frame window of 7 expression channels becomes 28 numbers:
 * mean, population std, max, and trend (later-half mean minus early-half mean).
 * Channel order matches daisee_summary_features.csv.
 */

export const CHANNELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral'];
export const WINDOW_SIZE = 11;
export const STATE_LABELS = ['Flow (Optimal)', 'Overload / Confusion', 'Boredom / Disengaged'];

const FACE_API_KEY = {
  Angry: 'angry',
  Disgust: 'disgusted',
  Fear: 'fearful',
  Happy: 'happy',
  Sad: 'sad',
  Surprise: 'surprised',
  Neutral: 'neutral',
};

export function featureNames() {
  const names = [];
  for (const channel of CHANNELS) {
    names.push(`${channel}_mean`, `${channel}_std`, `${channel}_max`, `${channel}_trend`);
  }
  return names;
}

export function expressionToVector(expressions) {
  return CHANNELS.map((name) => {
    const value = expressions?.[FACE_API_KEY[name]];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  });
}

export function summarizeWindow(frames) {
  const count = frames.length;
  const features = new Array(CHANNELS.length * 4);

  for (let channel = 0; channel < CHANNELS.length; channel += 1) {
    let sum = 0;
    let max = -Infinity;
    for (let i = 0; i < count; i += 1) {
      const value = frames[i][channel];
      sum += value;
      if (value > max) max = value;
    }
    const mean = count ? sum / count : 0;
    let variance = 0;
    for (let i = 0; i < count; i += 1) {
      const delta = frames[i][channel] - mean;
      variance += delta * delta;
    }
    const std = count ? Math.sqrt(variance / count) : 0;

    const earlyEnd = Math.min(5, count);
    const lateStart = Math.min(6, count);
    let earlySum = 0;
    let earlyCount = 0;
    for (let i = 0; i < earlyEnd; i += 1) {
      earlySum += frames[i][channel];
      earlyCount += 1;
    }
    let lateSum = 0;
    let lateCount = 0;
    for (let i = lateStart; i < count; i += 1) {
      lateSum += frames[i][channel];
      lateCount += 1;
    }
    const earlyMean = earlyCount ? earlySum / earlyCount : mean;
    const lateMean = lateCount ? lateSum / lateCount : mean;

    const base = channel * 4;
    features[base] = mean;
    features[base + 1] = std;
    features[base + 2] = max === -Infinity ? 0 : max;
    features[base + 3] = lateMean - earlyMean;
  }

  return features;
}

export function normalizeFeatures(features, mean, std) {
  return features.map((value, index) => {
    const scale = std[index];
    return (value - mean[index]) / (scale > 1e-6 ? scale : 1);
  });
}

export function loadFromProbabilities(probabilities) {
  const flow = probabilities[0] || 0;
  const overload = probabilities[1] || 0;
  const boredom = probabilities[2] || 0;
  return Math.round(Math.min(100, Math.max(0, overload * 88 + flow * 48 + boredom * 18)));
}
