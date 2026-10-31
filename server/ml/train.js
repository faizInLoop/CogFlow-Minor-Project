/**
 * Train the CogFlow cognitive classifier on DAiSEE window summaries.
 * Input: 28 expression statistics. Output: Flow / Overload / Boredom.
 * Pure TensorFlow.js (no native binding, no Python).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tf from '@tensorflow/tfjs';
import { featureNames } from '../../shared/cognitiveFeatures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, 'data', 'daisee_summary_features.csv');
const OUT_DIR = path.join(__dirname, '..', '..', 'public', 'models', 'cogflow');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const stateIndex = header.indexOf('cognitive_state');
  const splitIndex = header.indexOf('split');
  const names = featureNames();
  const featureIndex = names.map((name) => {
    const index = header.indexOf(name);
    if (index < 0) throw new Error(`CSV is missing column ${name}`);
    return index;
  });

  const rows = { train: [], val: [], test: [] };
  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    const cells = lines[i].split(',');
    const split = cells[splitIndex];
    const bucket = split === 'val' || split === 'validation' ? 'val' : split === 'test' ? 'test' : 'train';
    rows[bucket].push({
      y: Number(cells[stateIndex]),
      x: featureIndex.map((index) => Number(cells[index])),
    });
  }
  return rows;
}

function columnStats(rows) {
  const width = rows[0].x.length;
  const mean = new Array(width).fill(0);
  for (const row of rows) {
    for (let i = 0; i < width; i += 1) mean[i] += row.x[i];
  }
  for (let i = 0; i < width; i += 1) mean[i] /= rows.length;
  const variance = new Array(width).fill(0);
  for (const row of rows) {
    for (let i = 0; i < width; i += 1) {
      const delta = row.x[i] - mean[i];
      variance[i] += delta * delta;
    }
  }
  const std = variance.map((value) => Math.sqrt(value / rows.length));
  return { mean, std };
}

function applyNorm(rows, mean, std) {
  return rows.map((row) => ({
    y: row.y,
    x: row.x.map((value, index) => (value - mean[index]) / (std[index] > 1e-6 ? std[index] : 1)),
  }));
}

function classWeights(rows) {
  const counts = [0, 0, 0];
  for (const row of rows) counts[row.y] += 1;
  return counts.map((count) => Math.sqrt(rows.length / (3 * Math.max(1, count))));
}

function repeatForBalance(rows) {
  const weights = classWeights(rows);
  const smallest = Math.min(...weights);
  const copies = weights.map((weight) => Math.max(1, Math.round(weight / smallest)));
  const repeated = [];
  for (const row of rows) {
    for (let copy = 0; copy < copies[row.y]; copy += 1) repeated.push(row);
  }
  for (let i = repeated.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [repeated[i], repeated[j]] = [repeated[j], repeated[i]];
  }
  console.log(`Class copies [flow, overload, boredom]: ${copies.join(', ')} → ${repeated.length} train rows`);
  return repeated;
}

function counts(rows) {
  const tally = [0, 0, 0];
  for (const row of rows) tally[row.y] += 1;
  return tally;
}

function macroF1(truth, predicted) {
  const scores = [];
  for (let label = 0; label < 3; label += 1) {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    for (let i = 0; i < truth.length; i += 1) {
      if (predicted[i] === label && truth[i] === label) tp += 1;
      else if (predicted[i] === label && truth[i] !== label) fp += 1;
      else if (predicted[i] !== label && truth[i] === label) fn += 1;
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    scores.push(precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall));
  }
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

async function saveModel(model) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    const modelJson = {
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{ paths: ['weights.bin'], weights: artifacts.weightSpecs }],
      format: 'layers-model',
      generatedBy: 'CogFlow TensorFlow.js',
      convertedBy: null,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'model.json'), JSON.stringify(modelJson));
    fs.writeFileSync(path.join(OUT_DIR, 'weights.bin'), Buffer.from(artifacts.weightData));
    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
      },
    };
  }));
}

async function predictLabels(model, rows) {
  const xs = tf.tensor2d(rows.map((row) => row.x));
  const output = model.predict(xs);
  const labels = Array.from(output.argMax(1).dataSync());
  xs.dispose();
  output.dispose();
  return labels;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`DAiSEE summary CSV not found at ${CSV_PATH}`);
  }
  await tf.ready();
  console.log(`TensorFlow.js backend: ${tf.getBackend()}`);

  const parsed = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  if (parsed.val.length === 0) {
    const holdout = Math.max(1, Math.floor(parsed.train.length * 0.15));
    parsed.val = parsed.train.slice(0, holdout);
    parsed.train = parsed.train.slice(holdout);
  }
  if (parsed.test.length === 0) parsed.test = parsed.val;
  console.log(`Rows — train ${parsed.train.length}, val ${parsed.val.length}, test ${parsed.test.length}`);
  console.log(`Train class counts [flow, overload, boredom]: ${counts(parsed.train).join(', ')}`);

  const { mean, std } = columnStats(parsed.train);
  const val = applyNorm(parsed.val, mean, std);
  const test = applyNorm(parsed.test, mean, std);
  const train = repeatForBalance(applyNorm(parsed.train, mean, std));

  const model = tf.sequential();
  model.add(tf.layers.dense({
    inputShape: [28],
    units: 64,
    activation: 'relu',
    kernelInitializer: 'heNormal',
  }));
  model.add(tf.layers.dropout({ rate: 0.25 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu', kernelInitializer: 'heNormal' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  const xTrain = tf.tensor2d(train.map((row) => row.x));
  const yTrain = tf.oneHot(tf.tensor1d(train.map((row) => row.y), 'int32'), 3);

  let bestF1 = -1;
  let bestWeights = null;
  for (let epoch = 0; epoch < 30; epoch += 1) {
    const history = await model.fit(xTrain, yTrain, {
      epochs: 1,
      batchSize: 64,
      shuffle: true,
      verbose: 0,
    });
    const valPred = await predictLabels(model, val);
    const valTruth = val.map((row) => row.y);
    const valF1 = macroF1(valTruth, valPred);
    const valAcc = valTruth.filter((label, index) => label === valPred[index]).length / valTruth.length;
    const loss = history.history.loss[0];
    console.log(`Epoch ${String(epoch + 1).padStart(2, '0')}  loss ${loss.toFixed(4)}  val_acc ${(valAcc * 100).toFixed(1)}%  val_macro_f1 ${valF1.toFixed(3)}`);
    if (valF1 > bestF1) {
      bestF1 = valF1;
      if (bestWeights) bestWeights.forEach((weight) => weight.dispose());
      bestWeights = model.getWeights().map((weight) => weight.clone());
    }
  }

  if (bestWeights) model.setWeights(bestWeights);
  xTrain.dispose();
  yTrain.dispose();

  const testTruth = test.map((row) => row.y);
  const testPred = await predictLabels(model, test);
  let correct = 0;
  const matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < testTruth.length; i += 1) {
    matrix[testTruth[i]][testPred[i]] += 1;
    if (testTruth[i] === testPred[i]) correct += 1;
  }
  const accuracy = test.length ? correct / test.length : 0;
  const f1 = test.length ? macroF1(testTruth, testPred) : 0;

  await saveModel(model);
  const metrics = {
    dataset: 'DAiSEE window summaries',
    features: featureNames(),
    labels: ['flow', 'overload', 'boredom'],
    train_rows: parsed.train.length,
    val_rows: parsed.val.length,
    test_rows: parsed.test.length,
    test_accuracy: Number(accuracy.toFixed(4)),
    test_macro_f1: Number(f1.toFixed(4)),
    confusion_matrix: matrix,
    trained_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'norm.json'), JSON.stringify({ mean, std, labels: metrics.labels }));
  fs.writeFileSync(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));

  console.log(`Test accuracy ${(accuracy * 100).toFixed(1)}%   macro-F1 ${f1.toFixed(3)}`);
  console.log('Confusion matrix (rows true, cols predicted):');
  for (const row of matrix) console.log(`  ${row.join('  ')}`);
  console.log(`Saved model to ${OUT_DIR}`);
  model.dispose();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
