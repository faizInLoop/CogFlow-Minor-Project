from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import json
import os
import tempfile
import re
import uuid
import urllib.request
import urllib.error

os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "cogflow_matplotlib"))

from rag_engine import RAGEngine
from face_analyzer import FaceAnalyzer
from database import init_db, get_db, User, LearningSession, TopicProgress
from sqlalchemy.orm import Session

try:
    import anthropic
except ImportError:
    anthropic = None

# Initialize FastAPI application server
app = FastAPI(title="CogFlow Backend API", description="Adaptive Learning Engine & User History")

# Initialize SQLite database schema
init_db()

# ── CORS: Allow any local development port ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate the RAG engine and Facial Cognitive Load Analyzer
rag = RAGEngine()
face_analyzer = FaceAnalyzer()

# ── Pydantic Schemas for Users, Sessions, and Telemetry ──
class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    avatar: Optional[str] = "🎓"
    grade_level: Optional[str] = "B.Tech Computer Science"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    grade_level: Optional[str] = None
    baseline_brow: Optional[float] = None
    baseline_squint: Optional[float] = None
    preferred_tier: Optional[str] = None

class SessionSaveRequest(BaseModel):
    user_id: str = "usr_default"
    subject: str
    duration_seconds: int
    avg_cognitive_load: float = 50.0
    initial_tier: str = "tier3"
    final_tier: str = "tier3"
    topics: List[str] = []
    adaptation_log: List[Dict[str, Any]] = []
    time_in_flow_secs: Optional[int] = 0
    time_in_overload_secs: Optional[int] = 0
    time_in_boredom_secs: Optional[int] = 0

class StudentData(BaseModel):
    cognitive_state: int  # 0 = Flow, 1 = Overload, 2 = Boredom
    current_level: int    # Content difficulty level ranging from 1 to 5
    topic: Optional[str] = None          # Active topic name from frontend
    subject: Optional[str] = None        # Active subject name
    current_tier: Optional[str] = None   # Current tier: tier1 / tier3 / tier5
    target_tier: Optional[str] = None    # Target tier: tier1 / tier3 / tier5
    curated_content: Optional[str] = None  # Curated markdown content for the target tier
    content_source: Optional[str] = None

class FrameRequest(BaseModel):
    image: str  # Base64 data URL from browser canvas
    base_brow: float = 0.005
    base_squint: float = 0.35

class PDFRequest(BaseModel):
    filename: str
    content: str

class LessonGenerationRequest(BaseModel):
    topic: str
    source_text: Optional[str] = None
    source_reference: Optional[str] = None

MAX_UPLOAD_BYTES = 10 * 1024 * 1024

# ── Local Open-Source AI Configuration (Ollama / Qwen) ──
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5-coder:7b")
_ADAPTATION_CACHE: Dict[str, str] = {}


def check_ollama_status() -> Dict[str, Any]:
    """Check if local Ollama daemon is responsive and discover available models."""
    try:
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/tags",
            headers={"User-Agent": "CogFlow-LocalAI/2.0"},
            method="GET"
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            models = [m.get("name", "") for m in data.get("models", [])]
            matched_model = None
            for m in models:
                if OLLAMA_MODEL in m or "qwen2.5-coder" in m or "qwen" in m:
                    matched_model = m
                    break
            if not matched_model and models:
                matched_model = models[0]

            return {
                "available": True,
                "model": matched_model or OLLAMA_MODEL,
                "all_models": models,
                "url": OLLAMA_URL
            }
    except Exception as e:
        return {
            "available": False,
            "model": OLLAMA_MODEL,
            "all_models": [],
            "error": str(e),
            "url": OLLAMA_URL
        }


def _call_ollama_raw(prompt: str, json_format: bool = False, max_tokens: int = 2048, num_ctx: int = 2048, temperature: float = 0.2, timeout: int = 60) -> str:
    """Invokes local Ollama server with optimized CPU/GPU context size."""
    status = check_ollama_status()
    if not status["available"]:
        raise RuntimeError(f"Ollama server is unreachable at {OLLAMA_URL}")

    model_name = status.get("model") or OLLAMA_MODEL
    url = f"{OLLAMA_URL}/api/generate"
    payload: Dict[str, Any] = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "top_p": 0.9,
            "num_ctx": num_ctx
        }
    }
    if json_format:
        payload["format"] = "json"

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "CogFlow-Backend"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        return res_data.get("response", "")


def _generate_with_ollama(prompt: str) -> str:
    """Generates structured educational lessons using local Qwen2.5 Coder."""
    return _call_ollama_raw(prompt, json_format=True, max_tokens=1800, num_ctx=3072, temperature=0.2, timeout=120)


def rewrite_with_ollama(text: str, state: int) -> Tuple[str, bool]:
    """
    Rewrites educational content in real-time using local Qwen via Ollama.
    Optimized for high-speed CPU/GPU token throughput with in-memory caching.
    """
    cache_key = f"{state}:{hash(text[:300])}"
    if cache_key in _ADAPTATION_CACHE:
        return _ADAPTATION_CACHE[cache_key], True

    status = check_ollama_status()
    if not status["available"]:
        return text, False

    if state == 1:
        instructions = (
            "You are a cognitive load adaptation assistant. The student is overwhelmed. "
            "Rewrite the explanation into exactly 3 concise, intuitive bullet points with bold keywords "
            "and 1 short analogy. Keep total response under 50 words. Output ONLY the rewritten markdown."
        )
    elif state == 2:
        instructions = (
            "You are a cognitive depth adaptation assistant. The student is bored. "
            "Rewrite the explanation to increase technical rigor. Add computational complexity bounds "
            "and 1 challenge question. Keep total response under 70 words. Output ONLY the rewritten markdown."
        )
    else:
        return text, False

    prompt = f"{instructions}\n\nORIGINAL TEXT:\n{text[:500]}"
    try:
        rewritten = _call_ollama_raw(prompt, json_format=False, max_tokens=70, num_ctx=1536, temperature=0.2, timeout=28).strip()
        if rewritten:
            _ADAPTATION_CACHE[cache_key] = rewritten
            return rewritten, True
    except Exception as e:
        print(f"[Ollama] Real-time adaptation rewrite notice: {e}")

    return text, False


def _lesson_prompt(topic: str, source_text: Optional[str] = None, source_reference: Optional[str] = None) -> str:
    grounding = ""
    if source_text:
        grounding = (
            f"\nThe lesson must be grounded only in this uploaded source. Do not add unsupported facts. "
            f"Cite this reference where relevant: {source_reference or 'uploaded source'}.\nSOURCE TEXT:\n{source_text[:12000]}\n"
        )
    return f"""Create a high-quality, comprehensive educational lesson for the topic: {topic!r}.
Return ONLY valid JSON with this exact schema: {{\"versions\": {{\"tier1\": "markdown text", \"tier3\": "markdown text", \"tier5\": "markdown text"}}}}
Requirements for the 3 distinct versions:
- tier1 (Simplified): 3-4 clearly headed sections (## and ###). Use everyday analogies, visual bullet points, and plain intuitive language without technical gatekeeping. (300-500 words).
- tier3 (Standard): 4-5 clearly headed sections. Core technical concepts, precise terminology, worked architectural or code example, and practical applications. (400-600 words).
- tier5 (Expert): 4-5 clearly headed sections. Rigorous theoretical foundations, mathematical/asymptotic complexity, system trade-offs, edge cases, and 2 advanced self-check questions. (500-750 words).
Make all 3 versions specifically about {topic!r}. Output valid pure JSON only without markdown formatting backticks around the json.{grounding}"""


def _parse_lesson_json(text: str) -> Dict[str, str]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.I)
    parsed = json.loads(cleaned)
    versions = parsed.get("versions", parsed)
    if not all(isinstance(versions.get(tier), str) for tier in ("tier1", "tier3", "tier5")):
        raise ValueError("Provider response omitted one or more lesson tiers.")
    if len({versions[t].strip() for t in ("tier1", "tier3", "tier5")}) != 3:
        raise ValueError("Provider returned duplicate lesson versions.")
    for tier in ("tier1", "tier3", "tier5"):
        words = len(re.findall(r"\b[\w'-]+\b", versions[tier]))
        headings = len(re.findall(r"(?m)^#{2,3}\s+", versions[tier]))
        if words < 120 or headings < 2:
            raise ValueError(f"Provider lesson tier {tier} is too short or lacks sections (words: {words}, headings: {headings}).")
    return versions


def _generate_with_gemini(prompt: str) -> str:
    key = os.environ.get("GEMINI_API_KEY", "")
    model = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json", "maxOutputTokens": 12000}}
    request = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json", "x-goog-api-key": key}, method="POST")
    with urllib.request.urlopen(request, timeout=120) as response:
        data = json.loads(response.read().decode("utf-8"))
    return "".join(part.get("text", "") for part in data["candidates"][0]["content"]["parts"])


def _generate_with_claude(prompt: str) -> str:
    if anthropic is None:
        raise RuntimeError("Claude SDK is not installed.")
    client = anthropic.Anthropic(api_key=os.environ["CLAUDE_API_KEY"])
    versions = {}
    for tier in ("tier1", "tier3", "tier5"):
        tier_prompt = prompt + f"\nFor this call, return only the {tier} version as valid JSON with exactly this shape: {{\"content\":\"markdown lesson\"}}."
        response = client.messages.create(model="claude-3-haiku-20240307", max_tokens=4096, messages=[{"role": "user", "content": tier_prompt}])
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.I)
        versions[tier] = json.loads(text)["content"]
    return json.dumps({"versions": versions})


@app.post("/api/generate-lesson")
def generate_lesson(req: LessonGenerationRequest):
    topic = req.topic.strip()
    if not topic or len(topic) > 160:
        raise HTTPException(status_code=422, detail="Enter a topic between 1 and 160 characters.")
    source_text = req.source_text.strip() if req.source_text else None
    if source_text and len(source_text) > 18000:
        source_text = source_text[:18000]

    ollama_info = check_ollama_status()
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    claude_key = os.environ.get("CLAUDE_API_KEY", "")

    providers = []
    # 1. Primary: Local Open-Source Ollama Qwen (Fast, Private, 0-Cloud-Key)
    if ollama_info["available"]:
        providers.append(("ollama_qwen", _generate_with_ollama))
    # 2. Secondary fallback: Gemini
    if gemini_key:
        providers.append(("gemini_ai", _generate_with_gemini))
    # 3. Tertiary fallback: Claude
    if claude_key:
        providers.append(("claude_ai", _generate_with_claude))

    prompt = _lesson_prompt(topic, source_text, req.source_reference)
    errors = []

    for provider_name, generate in providers:
        try:
            print(f"[Lesson Synthesis] Generating curriculum with '{provider_name}'...")
            raw_output = generate(prompt)
            versions = _parse_lesson_json(raw_output)
            estimates = {
                tier: {
                    "words": len(re.findall(r"\b[\w'-]+\b", body)),
                    "minutes": round(len(re.findall(r"\b[\w'-]+\b", body)) / 130, 1)
                }
                for tier, body in versions.items()
            }
            return {
                "status": "success",
                "topic": topic,
                "versions": versions,
                "content_source": provider_name,
                "model": ollama_info.get("model", "qwen2.5-coder:7b") if provider_name == "ollama_qwen" else provider_name,
                "source_reference": req.source_reference if source_text else None,
                "reading_estimates": estimates
            }
        except Exception as e:
            print(f"[Lesson Synthesis] Provider {provider_name} error: {e}")
            errors.append(f"{provider_name}: {str(e)[:120]}")

    # Fallback to curated RAG if topic is in knowledge base
    from rag_engine import TOPIC_KNOWLEDGE_BASE
    for kb_topic, kb_levels in TOPIC_KNOWLEDGE_BASE.items():
        if topic.lower() in kb_topic.lower() or kb_topic.lower() in topic.lower():
            versions = {
                "tier1": kb_levels.get(1) or kb_levels.get(2) or "Simplified foundation",
                "tier3": kb_levels.get(3) or "Standard curriculum",
                "tier5": kb_levels.get(5) or kb_levels.get(4) or "Expert depth"
            }
            estimates = {
                tier: {"words": len(re.findall(r"\b[\w'-]+\b", body)), "minutes": round(len(re.findall(r"\b[\w'-]+\b", body)) / 130, 1)}
                for tier, body in versions.items()
            }
            return {
                "status": "success",
                "topic": topic,
                "versions": versions,
                "content_source": "rag_curated_fallback",
                "reading_estimates": estimates
            }

    if not providers:
        raise HTTPException(
            status_code=503,
            detail="No AI generation engine is running. Please verify that Ollama is running ('ollama run qwen2.5-coder:7b') or configure GEMINI_API_KEY / CLAUDE_API_KEY."
        )

    raise HTTPException(
        status_code=502,
        detail=f"Lesson generation failed across active providers: {'; '.join(errors)}. Please retry."
    )


def _document_topics(text: str, filename: str, document_id: str):
    """Split extracted text by headings; keep all lesson versions grounded in source text."""
    sections = []
    current_title, current_lines, current_page = "Overview", [], None
    for line in text.splitlines():
        stripped = line.strip()
        clean = stripped.lstrip("#* ").strip().strip("*_")
        is_heading = bool(re.match(r"^#{1,6}\s+", stripped) or re.match(r"^\*\*.+\*\*$", stripped))
        is_heading = is_heading or (4 <= len(clean) <= 100 and len(clean.split()) <= 10 and clean.istitle() and not clean.endswith((".", ",", ";")))
        if is_heading:
            body = "\n".join(current_lines).strip()
            if len(body) >= 80:
                sections.append((current_title, body, current_page))
            current_title, current_lines = clean, []
            page_heading = re.fullmatch(r"Page (\d+)", current_title)
            if page_heading:
                current_page = int(page_heading.group(1))
        else:
            current_lines.append(line)
    body = "\n".join(current_lines).strip()
    if len(body) >= 80:
        sections.append((current_title, body, current_page))
    if not sections:
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) >= 120]
        sections = [(f"Section {i + 1}", p, None) for i, p in enumerate(paragraphs[:8])]
    result = []
    for idx, (title, body, page_number) in enumerate(sections[:20]):
        excerpt = body[:7000]
        simplified = f"## {title} — Simplified\n\nKey points from {filename}:\n\n" + "\n\n".join(p[:450] for p in re.split(r"(?<=[.!?])\s+", excerpt)[:6])
        standard = f"## {title} — Standard\n\n{excerpt}"
        expert = f"## {title} — Expert / Challenging\n\nSource-grounded extension: compare the claims, assumptions, and evidence in this section.\n\n{excerpt}\n\n### Check your understanding\n- Which claim in this section is best supported by the source? Explain using its wording."
        result.append({"id": f"{document_id}-{idx}", "name": title, "subtopics": [], "document_id": document_id,
                       "source": {"document": filename, "section": title, "page": page_number},
                       "versions": {"tier1": simplified, "tier3": standard, "tier5": expert}})
    return result


@app.post("/api/extract-topics")
async def extract_topics(file: UploadFile = File(...)):
    supplied_name = (file.filename or "upload").replace("\\", "/")
    filename = re.sub(r"[\x00-\x1f]", "_", os.path.basename(supplied_name)).replace("..", "_")[:160]
    suffix = os.path.splitext(filename)[1].lower()
    if suffix not in (".pdf", ".txt"):
        raise HTTPException(status_code=415, detail="Upload a PDF or TXT file.")
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 10 MB upload limit.")
    if suffix == ".txt":
        text = raw.decode("utf-8-sig", errors="replace")
    else:
        if not raw.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="This file is not a valid PDF.")
        try:
            from pypdf import PdfReader
            from io import BytesIO
            reader = PdfReader(BytesIO(raw), strict=True)
            if reader.is_encrypted:
                raise HTTPException(status_code=400, detail="Password-protected PDFs are not supported.")
            text = "\n\n".join(f"## Page {page_number}\n{page.extract_text() or ''}" for page_number, page in enumerate(reader.pages, start=1))
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not read this PDF: {exc}")
    if len(text.strip()) < 80:
        detail = "No selectable text found; scanned or text-free PDFs need OCR before they can be used." if suffix == ".pdf" else "The text file is empty or too short to extract topics."
        raise HTTPException(status_code=422, detail=detail)
    document_id = uuid.uuid4().hex
    topics = _document_topics(text, filename, document_id)
    if not topics:
        raise HTTPException(status_code=422, detail="Could not identify useful sections in this document.")
    return {"status": "success", "document_id": document_id, "filename": filename, "topics": topics}


def rewrite_with_claude(text: str, state: int) -> Tuple[str, bool]:
    api_key = os.environ.get("CLAUDE_API_KEY", "")
    if not api_key:
        print("[Claude] CLAUDE_API_KEY not set - using curated educational content (no LLM rewrite)")
        return text, False

    if anthropic is None:
        return text, False

    client = anthropic.Anthropic(api_key=api_key)

    if state == 1:
        prompt = f"Rewrite the following educational text for a struggling student using simple bullet points to reduce cognitive load:\n\n{text}"
    elif state == 2:
        prompt = f"Rewrite the following educational text to add more advanced depth and challenge for a student who is bored:\n\n{text}"
    else:
        return text, False

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )
        first_content = response.content[0]
        if hasattr(first_content, 'text'):
            return first_content.text, True  # type: ignore
        return text, False
    except Exception as e:
        print(f"⚠️ Claude API Error: {e}")
        return text, False


@app.get("/")
def read_root():
    return {"message": "CogFlow Engine is running 🚀", "status": "ok"}


@app.get("/api/ai-status")
def get_ai_status():
    """Returns real-time status of local Ollama Qwen and optional cloud providers."""
    ollama_info = check_ollama_status()
    gemini_key = bool(os.environ.get("GEMINI_API_KEY", ""))
    claude_key = bool(os.environ.get("CLAUDE_API_KEY", ""))

    primary = "ollama_qwen" if ollama_info["available"] else ("gemini" if gemini_key else ("claude" if claude_key else "curated_rag"))

    return {
        "status": "online" if (ollama_info["available"] or gemini_key or claude_key) else "rag_curated",
        "primary_provider": primary,
        "ollama": {
            "available": ollama_info["available"],
            "model": ollama_info.get("model", OLLAMA_MODEL),
            "all_models": ollama_info.get("all_models", []),
            "url": OLLAMA_URL
        },
        "cloud": {
            "gemini_configured": gemini_key,
            "claude_configured": claude_key
        },
        "adaptation_cache_entries": len(_ADAPTATION_CACHE)
    }


@app.post("/api/adapt")
def get_adaptation(data: StudentData):
    """
    Main adaptation endpoint called by the React frontend.
    Dynamically rewrites content using Ollama Qwen when cognitive shift occurs.
    """
    adapted_text, new_level, new_tier, content_source = rag.adapt_content(
        data.current_level,
        data.cognitive_state,
        topic=data.topic,
        current_tier=data.current_tier,
        target_tier=data.target_tier,
        curated_content=data.curated_content
    )

    action_log = "Maintained Pace (Flow State)"
    final_text = adapted_text
    was_rewritten = False
    provider_used = content_source

    if data.cognitive_state == 1:
        action_log = "Simplified Content (Overload Mitigated)"
        # 1. Try local open-source Ollama Qwen first
        final_text, was_rewritten = rewrite_with_ollama(adapted_text, 1)
        if was_rewritten:
            provider_used = "ollama_qwen_adaptive"
        else:
            # 2. Fall back to Claude if configured
            final_text, was_rewritten = rewrite_with_claude(adapted_text, 1)
            if was_rewritten:
                provider_used = "claude_rewrite"

    elif data.cognitive_state == 2:
        action_log = "Increased Depth (Boredom Challenged)"
        # 1. Try local open-source Ollama Qwen first
        final_text, was_rewritten = rewrite_with_ollama(adapted_text, 2)
        if was_rewritten:
            provider_used = "ollama_qwen_adaptive"
        else:
            # 2. Fall back to Claude if configured
            final_text, was_rewritten = rewrite_with_claude(adapted_text, 2)
            if was_rewritten:
                provider_used = "claude_rewrite"

    return {
        "status": "success",
        "action_taken": action_log,
        "new_level": new_level,
        "new_tier": new_tier,
        "original_rag_text": adapted_text,
        "content": final_text,
        "content_source": provider_used,
    }


@app.post("/api/analyze-frame")
def analyze_frame(req: FrameRequest):
    """
    Receives an in-page webcam frame from the React frontend,
    decodes it, runs MediaPipe Blendshapes + Head Pose analysis,
    and returns real-time cognitive state classification.
    """
    try:
        img = face_analyzer.decode_base64_image(req.image)
        result = face_analyzer.analyze_frame(img, base_brow=req.base_brow, base_squint=req.base_squint)
        return {"status": "success", **result}
    except Exception as e:
        print(f"Error in analyze_frame: {e}")
        return {
            "status": "error",
            "message": str(e),
            "state": "Idle",
            "reason": "Analysis failed",
            "confidence": 0,
            "model": "Fallback",
            "probabilities": {"flow": 0.33, "overload": 0.33, "boredom": 0.33},
            "metrics": {"brow_down": 0, "blink": 0, "squint": 0, "pitch_ratio": 0}
        }


# ── User Profile & Learning History Database Endpoints ──

@app.get("/api/users")
def list_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {"status": "success", "users": [u.to_dict() for u in users]}


@app.post("/api/users")
def create_new_user(user_data: UserCreate, db: Session = Depends(get_db)):
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    new_user = User(
        id=user_id,
        name=user_data.name,
        email=user_data.email or f"{user_data.name.lower().replace(' ', '')}@cogflow.ai",
        avatar=user_data.avatar or "🎓",
        grade_level=user_data.grade_level or "B.Tech Computer Science"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "user": new_user.to_dict()}


@app.get("/api/users/{user_id}")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "user": user.to_dict()}


@app.put("/api/users/{user_id}")
def update_user_profile(user_id: str, updates: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if updates.name is not None: user.name = updates.name
    if updates.email is not None: user.email = updates.email
    if updates.avatar is not None: user.avatar = updates.avatar
    if updates.grade_level is not None: user.grade_level = updates.grade_level
    if updates.baseline_brow is not None: user.baseline_brow = updates.baseline_brow
    if updates.baseline_squint is not None: user.baseline_squint = updates.baseline_squint
    if updates.preferred_tier is not None: user.preferred_tier = updates.preferred_tier

    db.commit()
    db.refresh(user)
    return {"status": "success", "user": user.to_dict()}


@app.post("/api/sessions/save")
def record_learning_session(req: SessionSaveRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()

    dur = req.duration_seconds
    flow_secs = req.time_in_flow_secs or 0
    overload_secs = req.time_in_overload_secs or 0
    boredom_secs = req.time_in_boredom_secs or 0

    if flow_secs == 0 and overload_secs == 0 and boredom_secs == 0 and dur > 0:
        if req.avg_cognitive_load > 70:
            overload_secs = int(dur * 0.6)
            flow_secs = int(dur * 0.4)
        elif req.avg_cognitive_load < 35:
            boredom_secs = int(dur * 0.6)
            flow_secs = int(dur * 0.4)
        else:
            flow_secs = int(dur * 0.8)
            overload_secs = int(dur * 0.1)
            boredom_secs = int(dur * 0.1)

    new_session = LearningSession(
        user_id=req.user_id,
        subject=req.subject,
        duration_seconds=req.duration_seconds,
        avg_cognitive_load=req.avg_cognitive_load,
        initial_tier=req.initial_tier,
        final_tier=req.final_tier,
        adaptations_count=len(req.adaptation_log),
        topics_json=json.dumps(req.topics),
        adaptation_log_json=json.dumps(req.adaptation_log),
        time_in_flow_secs=flow_secs,
        time_in_overload_secs=overload_secs,
        time_in_boredom_secs=boredom_secs
    )
    db.add(new_session)

    tier_rank = {"tier1": 1, "tier3": 3, "tier5": 5}
    for topic in req.topics:
        existing_topic = db.query(TopicProgress).filter(
            TopicProgress.user_id == req.user_id,
            TopicProgress.subject == req.subject,
            TopicProgress.topic_name == topic
        ).first()

        if existing_topic:
            existing_topic.times_reviewed += 1
            existing_topic.last_reviewed = datetime.utcnow()
            if tier_rank.get(req.final_tier, 3) > tier_rank.get(existing_topic.highest_tier_reached, 3):
                existing_topic.highest_tier_reached = req.final_tier
            existing_topic.mastery_score = min(100.0, existing_topic.mastery_score + 10.0)
        else:
            new_topic = TopicProgress(
                user_id=req.user_id,
                subject=req.subject,
                topic_name=topic,
                highest_tier_reached=req.final_tier,
                times_reviewed=1,
                last_reviewed=datetime.utcnow(),
                mastery_score=75.0 if req.final_tier == "tier3" else (90.0 if req.final_tier == "tier5" else 60.0)
            )
            db.add(new_topic)

    if user:
        user.last_active = datetime.utcnow()

    db.commit()
    db.refresh(new_session)

    return {
        "status": "success",
        "session": new_session.to_dict(),
        "message": "Learning session saved to history"
    }


@app.get("/api/users/{user_id}/history")
def get_user_session_history(user_id: str, db: Session = Depends(get_db)):
    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == user_id
    ).order_by(LearningSession.created_at.desc()).all()

    return {
        "status": "success",
        "count": len(sessions),
        "history": [s.to_dict() for s in sessions]
    }


@app.get("/api/users/{user_id}/progress")
def get_user_topic_progress(user_id: str, db: Session = Depends(get_db)):
    records = db.query(TopicProgress).filter(
        TopicProgress.user_id == user_id
    ).order_by(TopicProgress.last_reviewed.desc()).all()

    subjects_map = {}
    for r in records:
        subj = r.subject
        if subj not in subjects_map:
            subjects_map[subj] = []
        subjects_map[subj].append(r.to_dict())

    return {
        "status": "success",
        "total_topics": len(records),
        "by_subject": subjects_map,
        "topics": [r.to_dict() for r in records]
    }


@app.get("/api/users/{user_id}/analytics")
def get_user_cognitive_analytics(user_id: str, db: Session = Depends(get_db)):
    sessions = db.query(LearningSession).filter(LearningSession.user_id == user_id).all()
    topics = db.query(TopicProgress).filter(TopicProgress.user_id == user_id).all()

    total_sessions = len(sessions)
    total_study_time = sum(s.duration_seconds for s in sessions)
    avg_load = sum(s.avg_cognitive_load for s in sessions) / total_sessions if total_sessions > 0 else 50.0

    total_flow_secs = sum(s.time_in_flow_secs for s in sessions)
    flow_pct = round((total_flow_secs / max(1, total_study_time)) * 100, 1)

    total_adaptations = sum(s.adaptations_count for s in sessions)

    return {
        "status": "success",
        "analytics": {
            "total_sessions": total_sessions,
            "total_study_time_seconds": total_study_time,
            "avg_cognitive_load": round(avg_load, 1),
            "flow_state_percentage": flow_pct,
            "total_adaptations_mitigated": total_adaptations,
            "topics_mastered_count": len(topics)
        }
    }
