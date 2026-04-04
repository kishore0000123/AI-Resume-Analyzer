from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from services import extract_text_from_bytes, extract_skills, score_resume, match_jobs, best_role, get_suggestions, optimize_resume, get_db, get_chat_reply, get_role_suggestions, jd_match, generate_interview_questions
import datetime

router = APIRouter()

LOW_TEXT_ERROR = (
    "Could not extract readable text from this PDF. "
    "It may be a scanned or image-only PDF. Please upload a text-based PDF "
    "or run OCR first."
)


class ChatRequest(BaseModel):
    question: str


class RoleSuggestionRequest(BaseModel):
    role: str
    current_skills: list[str] = []


class ResumeTextRequest(BaseModel):
    text: str
    skills: list[str] = []


class JDTextRequest(BaseModel):
    resume_text: str
    jd_text: str
    skills: list[str] = []


@router.get("/")
def home():
    return {"message": "AI Resume Analyzer API is running"}


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Phase 1: Upload PDF and extract raw text."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    try:
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail=LOW_TEXT_ERROR)

    return {"filename": file.filename, "text": text, "word_count": len(text.split())}


@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    """Full analysis: extract text → skills → score → job matches."""
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        content = await file.read()
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {e}")

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail=LOW_TEXT_ERROR)

    skills = extract_skills(text)
    score_data = score_resume(text, skills)
    job_matches = match_jobs(skills)
    top_role = best_role(job_matches)

    result = {
        "filename": file.filename,
        "text": text,
        "skills": skills,
        "score": score_data,
        "job_matches": job_matches[:6],  # Top 6 matches
        "best_role": top_role,
    }

    # Persist to MongoDB if available
    db = get_db()
    if db is not None:
        try:
            record = {**result, "created_at": datetime.datetime.utcnow()}
            record.pop("text", None)  # Don't store full text
            db["resumes"].insert_one(record)
        except Exception as e:
            # Keep API response successful, but make persistence problems visible in logs.
            print(f"MongoDB insert failed: {e}")

    return result


@router.post("/suggest")
async def suggest_improvements(file: UploadFile = File(...)):
    """Generate AI-powered resume improvement suggestions."""
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        content = await file.read()
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {e}")

    skills = extract_skills(text)
    score_data = score_resume(text, skills)
    suggestions = get_suggestions(text, skills, score_data["total"])

    return {
        "suggestions": suggestions,
        "score": score_data["total"],
        "score_breakdown": score_data.get("breakdown", {}),
        "skills_count": len(skills),
    }


@router.post("/optimize")
async def optimize_resume_endpoint(file: UploadFile = File(...)):
    """AI-powered resume rewriting (requires OpenAI API key)."""
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        content = await file.read()
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to optimize resume: {e}")

    optimized = optimize_resume(text)

    return {"original_length": len(text), "optimized": optimized}


@router.post("/suggest-text")
def suggest_improvements_from_text(payload: ResumeTextRequest):
    """Generate suggestions directly from resume text (fallback when file object isn't available)."""
    text = (payload.text or "").strip()
    if len(text) < 50:
        raise HTTPException(status_code=400, detail="Resume text is too short.")

    skills = payload.skills or extract_skills(text)
    score_data = score_resume(text, skills)
    suggestions = get_suggestions(text, skills, score_data["total"])

    return {
        "suggestions": suggestions,
        "score": score_data["total"],
        "score_breakdown": score_data.get("breakdown", {}),
        "skills_count": len(skills),
    }


@router.post("/optimize-text")
def optimize_resume_from_text(payload: ResumeTextRequest):
    """Optimize resume directly from resume text (fallback when file object isn't available)."""
    text = (payload.text or "").strip()
    if len(text) < 50:
        raise HTTPException(status_code=400, detail="Resume text is too short.")

    skills = payload.skills or extract_skills(text)
    optimized = optimize_resume(text, skills)
    return {"original_length": len(text), "optimized": optimized}


@router.get("/history")
def get_history(limit: int = 20):
    """Return recent analyzed resumes from MongoDB if available."""
    db = get_db()
    if db is None:
        return {"history": [], "available": False, "message": "MongoDB unavailable"}

    safe_limit = max(1, min(limit, 100))
    try:
        cursor = db["resumes"].find({}, {"_id": 0, "text": 0}).sort("created_at", -1).limit(safe_limit)
        items = list(cursor)
        return {"history": items, "available": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {e}")


@router.post("/chat")
def chat_with_bot(payload: ChatRequest):
    """Mentor bot endpoint for frontend chat UI."""
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        return get_chat_reply(question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate bot reply: {e}")


@router.post("/role-suggestions")
def role_suggestions(payload: RoleSuggestionRequest):
    """Return role-based skills, keywords, and project ideas."""
    role = (payload.role or "").strip()
    if not role:
        raise HTTPException(status_code=400, detail="Role is required")

    try:
        result = get_role_suggestions(role, payload.current_skills)
        if not result.get("available"):
            raise HTTPException(status_code=404, detail=result.get("message", "Role not found"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate role suggestions: {e}")


@router.post("/jd-match")
async def jd_match_endpoint(
    file: UploadFile = File(...),
    jd_text: str = Form(...),
):
    """Compare resume against a pasted job description and return a match score."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    if not jd_text or len(jd_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description is too short.")

    try:
        content = await file.read()
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read resume: {e}")

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail=LOW_TEXT_ERROR)

    skills = extract_skills(text)
    result = jd_match(text, jd_text, skills)
    return result


@router.post("/jd-match-text")
def jd_match_text_endpoint(payload: JDTextRequest):
    """Compare cached resume text against a pasted job description."""
    resume_text = (payload.resume_text or "").strip()
    jd_text = (payload.jd_text or "").strip()

    if len(resume_text) < 50:
        raise HTTPException(status_code=400, detail="Resume text is too short.")
    if len(jd_text) < 20:
        raise HTTPException(status_code=400, detail="Job description is too short.")

    skills = payload.skills or extract_skills(resume_text)
    return jd_match(resume_text, jd_text, skills)


@router.post("/interview-questions")
async def interview_questions_endpoint(file: UploadFile = File(...)):
    """Generate role-tailored interview questions from a resume."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        content = await file.read()
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read resume: {e}")

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail=LOW_TEXT_ERROR)

    skills = extract_skills(text)
    job_matches = match_jobs(skills)
    top_role = best_role(job_matches)
    role_name = top_role["role"] if top_role else "General"

    result = generate_interview_questions(text, role_name, skills)
    return result
