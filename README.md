# CogFlow

CogFlow is an adaptive learning app. It can analyze facial expressions in the browser, offer an optional content-tier change, generate checked lessons and quizzes with Groq, and save learning sessions through an Express and MongoDB API.

## Architecture

- `src/`: React interface, learning flow, webcam monitor, and browser-side cognitive inference.
- `shared/`: feature extraction and authored course content shared by the browser and API.
- `server/`: Express routes, MongoDB models, document extraction, Groq integration, and ML training utilities.
- `public/models/face/`: face-api Tiny Face Detector and Face Expression model files served locally.
- `public/models/cogflow/logistic_model.json`: the classifier currently loaded by the browser.
- `server/ml/data/daisee_summary_features.csv`: the checked-in feature dataset used by the training utility.

The camera remains in the browser. CogFlow samples 11 expression vectors in the order Angry, Disgust, Fear, Happy, Sad, Surprise, Neutral. `shared/cognitiveFeatures.js` summarizes them into 28 mean, standard-deviation, maximum, and trend values. The browser normalizes those values using the mean and scale stored in `logistic_model.json`, then applies that file's three-class multinomial logistic coefficients for Flow, Overload, and Boredom. Face frames are not uploaded.

The current inference path uses `logistic_model.json`; it does not load `model.json` or `weights.bin`. Its metadata identifies a multinomial logistic classifier, records `C: 0.03` and balanced class weights, and includes validation/test scores, coefficients, intercepts, and fitted mean/scale arrays. The accompanying CSV contains 8,165 already summarized DAiSEE rows split into train, validation, and test sets. The shared feature code defines the seven expression channels and the 28 mean, population-standard-deviation, maximum, and trend values used by inference.

**The active logistic classifier does not have a reproducible training/export workflow in this repository.** Git history shows that `server/ml/train.js` replaced an older PyTorch/ONNX sequence model with a separate 64-32-3 TensorFlow.js dense network. The logistic JSON was added afterward, without a corresponding fit/export script. The artifact does not record the training library/version, solver, penalty, convergence settings, random seed, exact scaler-fit procedure, label derivation, or exporter. The checked-in CSV is feature-level data, not the original DAiSEE video/expression source. Although its metadata suggests the fitting configuration, it is insufficient to reproduce the exact coefficients and validate equivalence safely. Do not use `npm run train` or `npm run models` to recreate the active classifier; those commands rewrite the separate neural-network artifacts. The current classifier is therefore preserved as a release asset, while its original fitting workflow remains an explicit reproducibility limitation.

## Requirements and setup

Use a current Node.js release that supports the versions in `package-lock.json` (Vite 8 requires Node 20.19+ or 22.12+).

```bash
npm ci
cp .env.example .env
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed. Add at least one Groq key to `.env` for generated lessons, quizzes, and answer feedback. The frontend runs at `http://localhost:5174`; the API listens on `http://127.0.0.1:8000`.

The backend first tries `MONGODB_URI`, then local MongoDB at `127.0.0.1:27017`, then a project-local embedded MongoDB. The embedded server may need to download its MongoDB binary the first time it runs. To use a different Groq model, set `GROQ_MODEL`; the default is `openai/gpt-oss-120b`. Provide fallback keys in `GROQ_API_KEY`, `GROQ_API_KEY_1` through `GROQ_API_KEY_3`, or the comma-separated `GROQ_API_KEYS`. Keys are tried in order and are read by the backend only. `/api/ai-status` reports configuration, not live provider reachability; it returns provider names and model configuration, never key values.

There is no Ollama or other local text-generation provider in the current runtime. Groq is optional for browsing authored lessons, but dynamic lessons, generated quizzes, and answer evaluation need a configured, reachable Groq key. Local MongoDB is an optional data service; embedded MongoDB is the default fallback.

## Run checks

```bash
npm test
npm run lint
npm run build
```

`npm run preview` serves the production build locally. `npm run backend` starts only the API. `npm run dev` starts both the API and Vite frontend.

The tracked face model files are copied into Vite's production output from `public/models/face`. `npm run models` recopies those face assets and runs the separate neural-network training utility described above; it is not required for normal installation or startup. Do not run it as part of routine release checks because it rewrites model artifacts.

## Learning flow and routes

The learner can select a subject or upload a PDF/TXT document. The backend extracts text and returns sections as topics. In a lesson, the learner can use Overview, Visual, Code, Notes, and Quiz views, select Simplified, Standard, or Expert content, and navigate between topics. Lessons are generated only for the selected topic and tier; browser and server caches include those values. Authored course material is served directly where available.

When the learner enables the webcam, face detection and expression inference run on device. After an 11-frame window is classified, the displayed state is stabilized before the app tracks a sustained state. A state transition can offer a tier recommendation; the learner must accept it before content changes. Manual tier controls remain available.

Key API routes include `/api/ai-status`, `/api/model-info`, `/api/generate-content`, `/api/generate-quiz`, `/api/evaluate-answer`, `/api/adapt`, `/api/extract-topics`, and the user/session/progress routes. The API is bound to loopback for local development.

## Configuration and repository notes

Copy `.env.example` to `.env`. `.env` and other environment files are ignored by Git; keep real credentials out of source and commits. `dist/`, `node_modules/`, Python caches, and local database files are also ignored. The trained classifier, face model weights, manifests, training utility, and feature dataset are required project assets and remain tracked.
