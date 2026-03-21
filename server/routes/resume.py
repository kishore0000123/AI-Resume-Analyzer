from fastapi import APIRouter, UploadFile, File, HTTPException
from services.extractor import extract_text_from_bytes
from services.analyzer import extract_skills, score_resume, match_jobs
from services.ai_helper import get_suggestions, optimize_resume
from services.db import get_db
import datetime

router = APIRouter()


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
        raise HTTPException(status_code=422, detail="Could not extract readable text from the PDF.")

    return {"filename": file.filename, "text": text, "word_count": len(text.split())}


@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    """Full analysis: extract text → skills → score → job matches."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    try:
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract readable text from the PDF.")

    skills = extract_skills(text)
    score_data = score_resume(text, skills)
    job_matches = match_jobs(skills)

    result = {
        "filename": file.filename,
        "text": text,
        "skills": skills,
        "score": score_data,
        "job_matches": job_matches[:6],  # Top 6 matches
    }

    # Persist to MongoDB if available
    db = get_db()
    if db is not None:
        try:
            record = {**result, "created_at": datetime.datetime.utcnow()}
            record.pop("text", None)  # Don't store full text
            db["resumes"].insert_one(record)
        except Exception:
            pass  # Non-critical — don't fail request if DB save fails

    return result


@router.post("/suggest")
async def suggest_improvements(file: UploadFile = File(...)):
    """Generate AI-powered resume improvement suggestions."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    try:
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    skills = extract_skills(text)
    score_data = score_resume(text, skills)
    suggestions = get_suggestions(text, skills, score_data["total"])

    return {
        "suggestions": suggestions,
        "score": score_data["total"],
        "skills_count": len(skills),
    }


@router.post("/optimize")
async def optimize_resume_endpoint(file: UploadFile = File(...)):
    """AI-powered resume rewriting (requires OpenAI API key)."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    try:
        text = extract_text_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    optimized = optimize_resume(text)

    return {"original_length": len(text), "optimized": optimized}
