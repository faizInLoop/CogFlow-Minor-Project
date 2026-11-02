# CogFlow — Passive Cognitive Load Detection for Smarter Learning

> An adaptive learning platform that silently monitors student behaviour and adjusts content difficulty in real-time.

---

## Project structure

```
cogflow/
├── src/                    React frontend
├── server/                 Express + MongoDB API
├── shared/                 DAiSEE feature math used by training and the browser
├── public/models/cogflow/  Trained TensorFlow.js model
└── public/models/face/     On-device face expression nets
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite |
| API | Express on port 8000 |
| Database | MongoDB (local, `MONGODB_URI`, or an embedded database) |
| Cognitive model | TensorFlow.js, trained on DAiSEE expression windows |
| Face signals | face-api expression net, in the browser |
| Lessons and quizzes | Express curriculum routes |

Python, PyTorch, FastAPI, and ONNX are not part of this project.

## Run

Install and start [Ollama](https://ollama.com), then download the default local model:

```bash
ollama pull qwen2.5:3b
```

The lesson provider order is local Ollama, each configured Groq key, then OpenRouter. If a provider is offline or returns a lesson that fails validation, CogFlow tries the next configured provider. Cloud keys are read by the backend only from environment variables or the ignored project-root `.env` file; never put API keys in frontend code or commit them.

Create `.env` in the project root and add whichever cloud fallbacks you have:

```dotenv
GROQ_API_KEY=your_first_groq_key
GROQ_API_KEY_1=your_second_groq_key
GROQ_API_KEY_2=your_third_groq_key
OPENROUTER_API_KEY=your_openrouter_key
```

The keys are optional. `GROQ_API_KEYS` may also hold a comma-separated key list. Groq uses `qwen/qwen3.8-27b` by default; override it with `GROQ_MODEL`. OpenRouter uses `OPENROUTER_MODEL`, and the local model can be changed with `OLLAMA_MODEL`. Restart `npm run dev` after editing `.env`. The `/api/ai-status` endpoint reports the configured provider names, not their keys.

```bash
npm install
npm run dev
```

`npm run models` copies the face models and trains the DAiSEE classifier. `npm run dev` starts the API at http://127.0.0.1:8000 and the app at http://localhost:5174.

The camera classifier runs in the browser. Video frames are not sent to the API. Set `MONGODB_URI` when you want an external MongoDB database.

## How a session works

The lesson opens immediately. Mouse, scroll, and typing update the side panel. If the camera is enabled, an 11-frame expression window is classified on device as flow, overload, or boredom. After 30 seconds in overload or boredom, the app offers an easier or harder tier. Ending the session saves history, quiz score, and topic mastery in MongoDB.

## States

| State | Meaning | Lesson change |
|-------|---------|----------------|
| Flow (0) | Engaged | Stay at the current tier |
| Overload (1) | Confused or strained | Offer a simpler tier |
| Boredom (2) | Disengaged | Offer a harder tier |

DAiSEE labels are mapped the same way as before: high confusion or frustration becomes overload, high boredom or low engagement becomes boredom, and the rest is flow.
