"""
Resume Analyzer Services Package

Core modules:
  - extractor: PDF text extraction
  - analyzer: Skill detection, scoring, job matching
  - ai_helper: AI suggestions and resume optimization
  - db: MongoDB persistence layer
"""

# Text extraction
from .extractor import extract_text_from_bytes

# Analysis functions
from .analyzer import extract_skills, score_resume, match_jobs, best_role, detect_sections, get_role_suggestions

# AI helpers
from .ai_helper import get_suggestions, optimize_resume, get_chat_reply

# Database
from .db import get_db

# Public API
__all__ = [
    # Extraction
    "extract_text_from_bytes",
    # Analysis
    "extract_skills",
    "score_resume",
    "match_jobs",
    "best_role",
    "detect_sections",
    "get_role_suggestions",
    # AI
    "get_suggestions",
    "optimize_resume",
    "get_chat_reply",
    # Database
    "get_db",
]
