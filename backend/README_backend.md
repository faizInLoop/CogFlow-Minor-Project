# CogFlow Backend

FastAPI server for adaptive content delivery using ChromaDB (RAG) + Claude AI rewriting.

## Setup

```bash
cd "d:\Minor Project - B.Tech\cogflow\backend"

# Create a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Set your Claude API key (optional — backend works without it using raw RAG content)
$env:CLAUDE_API_KEY = "sk-ant-your-key-here"   # PowerShell
# or
set CLAUDE_API_KEY=sk-ant-your-key-here         # CMD

# Start the server
uvicorn main:app --reload --port 8000
```

Server runs at: **http://localhost:8000**

Custom lesson generation is requested only when a student submits a custom topic. If `GEMINI_API_KEY` is set it is used first; `CLAUDE_API_KEY` is the fallback. Set keys in the backend process environment, never in frontend code or a committed file. Gemini/Claude usage may incur charges under the provider account; configure provider budgets before enabling a key. Without either key, curated topics and extracted-document fallback content remain available, while arbitrary-topic generation explains that a key is required.

PowerShell setup (before starting Uvicorn):

```powershell
$env:GEMINI_API_KEY = "your-Google-AI-Studio-key"
$env:GEMINI_MODEL = "gemini-3.8-flash" # optional; this is the default
# Or configure the existing fallback provider instead:
$env:CLAUDE_API_KEY = "your-Anthropic-key"
```

---

## API Endpoints

### `GET /`
Health check.
```json
{ "message": "CogFlow Engine is running 🚀", "status": "ok" }
```

### `POST /api/adapt`
Main endpoint. Called by the React frontend when content needs to adapt.

**Request:**
```json
{
  "cognitive_state": 1,   // 0=Flow, 1=Overload, 2=Boredom
  "current_level": 3      // 1–5 difficulty level
}
```

**Response:**
```json
{
  "status": "success",
  "action_taken": "Simplified Content (Overload Detected)",
  "new_level": 2,
  "original_rag_text": "Level 2 content from ChromaDB...",
  "content": "Claude-rewritten simplified version..."
}
```

### `POST /api/extract-topics`
Accepts a PDF or TXT multipart upload (10 MB limit), extracts text and sections, and returns source-referenced topic data with three marked difficulty versions. Text-free/scanned PDFs require OCR and are rejected with an explanatory error.

### `POST /api/generate-lesson`
Accepts `{ "topic": "..." }` for a custom topic, or optional `source_text` and `source_reference` for an uploaded-document topic. Gemini is used when `GEMINI_API_KEY` is present and falls back to the existing Claude integration when configured. It validates the returned versions and reports actual word-count reading estimates. Without a provider key it returns HTTP 503 rather than substituting a generic lesson.

---

## Frontend Connection Points

| Frontend file | Function | What to call |
|---|---|---|
| `src/pages/LearningInterface.jsx` | `useSignalMonitor()` | `POST /api/adapt` |
| `src/pages/TopicSelection.jsx` | `handleFileUpload()` | `POST /api/extract-topics` |

### Tier Mapping (Frontend → Backend)

The frontend uses `tier1/tier3/tier5`, the backend uses levels `1–5`:

| Frontend Tier | Backend Level | Cognitive State |
|---|---|---|
| `tier1` (Simplified) | 1–2 | 1 (Overload) |
| `tier3` (Standard)  | 3   | 0 (Flow) |
| `tier5` (Expert)    | 4–5 | 2 (Boredom) |

---

## ML Model (ml_brain/)

The trained PyTorch model (`exported_models/cogflow_model.pth`) classifies 5 input features:

| Feature | Description |
|---|---|
| `gaze_variance` | How much eyes are moving |
| `blink_rate` | Blinks per minute |
| `facial_tension` | Facial muscle tension (requires webcam) |
| `mouse_speed` | Average mouse velocity |
| `typing_gap` | Average pause between keystrokes |

**Output:** 0 (Flow), 1 (Overload), 2 (Boredom)

> Phase 1 uses mouse_speed and typing_gap only (no webcam). Full 5-feature input planned for Phase 2.

---

## Note on `train.py`

`ml_brain/train.py` currently contains a copy of `rag_engine.py` — this appears to be a commit mistake. The actual PyTorch training script should train `model.py` on `simulated_cogflow_data.csv`. The pre-trained model is already present in `exported_models/`.
