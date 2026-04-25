from turtle import save

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from services import extract_text_from_bytes, extract_skills, score_resume, match_jobs, best_role, get_suggestions, optimize_resume, get_db, jd_match, generate_interview_questions

from services import (
    extract_text_from_bytes, 
    extract_skills, 
    score_resume, 
    match_jobs, 
    best_role, 
    get_suggestions, 
    optimize_resume, 
    get_db, 
    jd_match
)
from services import extract_text_from_bytes, extract_skills, score_resume, match_jobs, best_role, get_suggestions, optimize_resume, get_db, jd_match, generate_interview_questions

from services import extract_text_from_bytes, extract_skills, score_resume, match_jobs, best_role, get_suggestions, optimize_resume, get_db 
import datetime

router = APIRouter()

LOW_TEXT_ERROR = (
    "Could not extract readable text from this PDF. "
    "It may be a scanned or image-only PDF. Please upload a text-based PDF "
    "or run OCR first."
)
class ChatRequest(BaseModel):
    question: str

class ChatRequest(BaseModel):
    question: str


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


@router.post("/jd-match")
def match_against_jd(payload: JDTextRequest):
    """Match resume against a specific job description."""
    text = (payload.resume_text or "").strip()
    jd = (payload.jd_text or "").strip()
    if len(text) < 50 or len(jd) < 50:
        raise HTTPException(status_code=400, detail="Resume or JD text is too short.")

    skills = payload.skills or extract_skills(text)
    match_result = jd_match(text, jd, skills)
    return match_result
async def jd_match_endpoint(file: UploadFile = File(...), jd_text: str = Form(...)):
    """Match resume against job description."""
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
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")

    skills = extract_skills(text)
    result = jd_match(text, jd_text, skills)
    return result


@router.post("/jd-match-text")
def jd_match_text_endpoint(payload: JDTextRequest):
    """Match resume text against job description."""
    resume_text = (payload.resume_text or "").strip()
    jd_text = (payload.jd_text or "").strip()
    
    if len(resume_text) < 50 or len(jd_text) < 20:
        raise HTTPException(status_code=400, detail="Resume or JD text is too short.")

    skills = payload.skills or extract_skills(resume_text)
    result = jd_match(resume_text, jd_text, skills)
    return result


@router.post("/interview-questions")
async def interview_questions_endpoint(file: UploadFile = File(...)):
    """Generate interview questions based on the resume."""
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
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")

    skills = extract_skills(text)
    job_matches = match_jobs(skills)
    top_role = best_role(job_matches)
    role_name = top_role["role"] if top_role else "General"

    result = generate_interview_questions(text, role_name, skills)
    return result

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

    from services import get_chat_reply
    try:
        return get_chat_reply(question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate bot reply: {e}")

