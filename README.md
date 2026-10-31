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

```bash
npm install
npm run prepare
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

