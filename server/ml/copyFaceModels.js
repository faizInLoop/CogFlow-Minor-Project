/**
 * Copy the small face-detector and expression nets into public/
 * so the browser can load them without a third-party CDN.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(__dirname, '..', '..', 'node_modules', '@vladmandic', 'face-api', 'model');
const target = path.join(__dirname, '..', '..', 'public', 'models', 'face');

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model.bin',
  'face_expression_model-weights_manifest.json',
  'face_expression_model.bin',
];

if (!fs.existsSync(source)) {
  console.error('face-api models were not found. Run npm install first.');
  process.exit(1);
}

fs.mkdirSync(target, { recursive: true });
for (const file of files) {
  fs.copyFileSync(path.join(source, file), path.join(target, file));
  console.log(`copied ${file}`);
}
