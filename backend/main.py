from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import os
import tempfile

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

# ── CORS: Allow the React frontend to call this API ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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

class FrameRequest(BaseModel):
    image: str  # Base64 data URL from browser canvas
    base_brow: float = 0.005
    base_squint: float = 0.35

class PDFRequest(BaseModel):
    filename: str
    content: str

def rewrite_with_claude(text: str, state: int) -> tuple[str, bool]:
    """
    Attempt real-time rewriting using Claude Haiku.
    Returns (text, was_rewritten: bool).
    """
    # Read API key from environment variable (never hardcode keys)
    api_key = os.environ.get("CLAUDE_API_KEY", "")
    if not api_key:
        # Graceful fallback: return original curated RAG text if no key is configured
        print("[Claude] CLAUDE_API_KEY not set - using curated educational content (no LLM rewrite)")
        return text, False

    if anthropic is None:
        print("[Claude] anthropic library not available - using curated educational content")
        return text, False

    # Construct targeted prompts based on the detected cognitive state
    if state == 1:
        prompt = f"Rewrite the following educational text for a struggling student using simple bullet points to reduce cognitive load:\n\n{text}"
    elif state == 2:
        prompt = f"Rewrite the following educational text to add more advanced depth and challenge for a student who is bored:\n\n{text}"
    else:
        return text, False

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        first_content = response.content[0]
        if hasattr(first_content, 'text'):
            return first_content.text, True  # type: ignore
        return text, False
    except Exception as e:
        print(f"[Claude Error] {e} - falling back to curated content")
        return text, False  # Fallback to curated text


@app.get("/")
def read_root():
    return {"message": "CogFlow Engine is running 🚀", "status": "ok"}


@app.post("/api/adapt")
def get_adaptation(data: StudentData):
    """
    Main adaptation endpoint called by the React frontend.

    Request body:
        cognitive_state: int  — 0=Flow, 1=Overload, 2=Boredom
        current_level:   int  — 1 to 5 (current difficulty level)
        topic:           str  — optional active topic name
        subject:         str  — optional active subject name
        current_tier:    str  — optional 'tier1' | 'tier3' | 'tier5'
        target_tier:     str  — optional 'tier1' | 'tier3' | 'tier5'
        curated_content: str  — optional curated content for target tier

    Response:
        status:              "success"
        action_taken:        human-readable description of what happened
        new_level:           int — updated difficulty level (1-5)
        new_tier:            str — updated difficulty tier ('tier1', 'tier3', 'tier5')
        topic:               str — active topic
        content_source:      "curated_topic_library" | "claude_ai" | "rag_vector_store"
        rewritten_by_claude: bool — true if genuinely rewritten by Claude LLM
        original_rag_text:   raw curated / RAG text
        content:             final text (Claude-rewritten if key available, else curated)
    """
    # Step 1: Adapt content based on cognitive state, topic, and curated library
    adapted_text, new_level, new_tier, content_source = rag.adapt_content(
        current_level=data.current_level,
        cognitive_state=data.cognitive_state,
        topic=data.topic,
        current_tier=data.current_tier,
        target_tier=data.target_tier,
        curated_content=data.curated_content
    )

    action_log = "Maintained Pace (Flow State)"
    if data.cognitive_state == 1:
        action_log = f"Simplified Content (Overload Detected & Tier Shifted to {new_tier})"
    elif data.cognitive_state == 2:
        action_log = f"Increased Depth (Boredom Detected & Tier Shifted to {new_tier})"

    # Step 2: Trigger Claude rewriting if key is configured
    final_text = adapted_text
    rewritten_by_claude = False
    if data.cognitive_state in (1, 2):
        rewritten_text, success = rewrite_with_claude(adapted_text, data.cognitive_state)
        if success:
            final_text = rewritten_text
            rewritten_by_claude = True

    final_source = "claude_ai" if rewritten_by_claude else content_source

    return {
        "status": "success",
        "action_taken": action_log,
        "new_level": new_level,
        "new_tier": new_tier,
        "topic": data.topic or "General",
        "content_source": final_source,
        "rewritten_by_claude": rewritten_by_claude,
        "original_rag_text": adapted_text,
        "content": final_text,
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
            "face_detected": False,
            "cognitive_state": 0,
            "state_label": "Analysis Error",
            "reason": str(e),
            "metrics": {}
        }


# ── User Profile & Learning History API Endpoints ──

@app.get("/api/users")
def list_users(db: Session = Depends(get_db)):
    """List all registered user profiles."""
    users = db.query(User).all()
    return {"status": "success", "users": [u.to_dict() for u in users]}


@app.post("/api/users")
def create_user(req: UserCreate, db: Session = Depends(get_db)):
    """Create a new student profile."""
    # Check if email already taken
    if req.email:
        existing = db.query(User).filter(User.email == req.email).first()
        if existing:
            return {"status": "success", "user": existing.to_dict(), "message": "Existing profile loaded"}

    new_user = User(
        name=req.name,
        email=req.email,
        avatar=req.avatar or "🎓",
        grade_level=req.grade_level or "B.Tech Computer Science"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "user": new_user.to_dict()}


@app.get("/api/users/{user_id}")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Retrieve user profile by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {"status": "success", "user": user.to_dict()}


@app.put("/api/users/{user_id}")
def update_user_profile(user_id: str, req: UserUpdate, db: Session = Depends(get_db)):
    """Update profile details, baseline calibrations, or preferred difficulty."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    if req.name is not None: user.name = req.name
    if req.email is not None: user.email = req.email
    if req.avatar is not None: user.avatar = req.avatar
    if req.grade_level is not None: user.grade_level = req.grade_level
    if req.baseline_brow is not None: user.baseline_brow = req.baseline_brow
    if req.baseline_squint is not None: user.baseline_squint = req.baseline_squint
    if req.preferred_tier is not None: user.preferred_tier = req.preferred_tier

    user.last_active = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {"status": "success", "user": user.to_dict()}


@app.post("/api/sessions")
def record_learning_session(req: SessionSaveRequest, db: Session = Depends(get_db)):
    """
    Save a completed learning session and automatically update learned topic history & mastery.
    """
    # Verify user exists or fallback to default
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        user = db.query(User).filter(User.id == "usr_default").first()
        req.user_id = user.id if user else "usr_default"

    # Compute duration and breakdown
    dur = max(1, req.duration_seconds)
    flow_secs = req.time_in_flow_secs
    overload_secs = req.time_in_overload_secs
    boredom_secs = req.time_in_boredom_secs

    # If telemetry breakdown wasn't explicitly tracked, estimate from avg load
    if flow_secs == 0 and overload_secs == 0 and boredom_secs == 0:
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

    # Update learned history / topic mastery for each topic studied
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
            # Update tier if current final tier is higher
            if tier_rank.get(req.final_tier, 3) > tier_rank.get(existing_topic.highest_tier_reached, 3):
                existing_topic.highest_tier_reached = req.final_tier
            # Increment mastery score (capped at 100)
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

    # Update user's last active timestamp
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
    """Retrieve all past learning sessions for a user, ordered from most recent to oldest."""
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
    """Retrieve learned history and mastery metrics across all topics."""
    records = db.query(TopicProgress).filter(
        TopicProgress.user_id == user_id
    ).order_by(TopicProgress.last_reviewed.desc()).all()

    # Group topics by subject
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
    """Aggregate cognitive analytics for student profile dashboard."""
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