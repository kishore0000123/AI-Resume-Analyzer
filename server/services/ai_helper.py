import os

_openai_available = False

try:
    from openai import OpenAI
    _api_key = os.getenv("OPENAI_API_KEY", "")
    if _api_key and _api_key != "your_openai_api_key_here":
        _client = OpenAI(api_key=_api_key)
        _openai_available = True
        print(f"OpenAI initialized successfully (Key length: {len(_api_key)})")
    else:
        _client = None
        print("OpenAI NOT initialized: API key missing or placeholder.")
except ImportError:
    _client = None
    print("OpenAI NOT initialized: Package 'openai' not found.")


def _call_openai(system_prompt: str, user_prompt: str) -> str:
    if not _openai_available or _client is None:
        return None
    try:
        response = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1500,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        error_msg = str(e)
        print(f"OpenAI error: {error_msg}")
        return f"ERROR: {error_msg}"


def _get_basic_suggestions(skills: list) -> list[str]:
    """Rich rule-based fallback suggestions based on detected skills."""
    skill_set = {s.lower() for s in skills}

    suggestions = [
        "Add a strong professional summary at the top of your resume.",
        "Quantify achievements with numbers (e.g., 'Improved app performance by 40%').",
        "Use action verbs (Built, Led, Designed, Optimised) to start every bullet point.",
        "Tailor your resume keywords to match the job description for better ATS ranking.",
    ]

    if "javascript" in skill_set and "react" not in skill_set and "vue" not in skill_set:
        suggestions.append("Strengthen your frontend profile by adding React or Vue.js projects.")

    if "python" in skill_set and "fastapi" not in skill_set and "django" not in skill_set and "flask" not in skill_set:
        suggestions.append("Showcase backend depth by including a Python framework (FastAPI, Django, or Flask).")

    if "node" not in skill_set and "nodejs" not in skill_set:
        suggestions.append("Consider adding Node.js/Express experience to broaden your backend profile.")

    if "mongodb" not in skill_set and "sql" not in skill_set and "postgresql" not in skill_set and "mysql" not in skill_set:
        suggestions.append("Include a database project (MongoDB, PostgreSQL, or MySQL) to show data skills.")

    if "docker" not in skill_set and "kubernetes" not in skill_set:
        suggestions.append("Add containerisation knowledge (Docker) to stand out for modern cloud roles.")

    if "git" not in skill_set and "github" not in skill_set:
        suggestions.append("Mention version control (Git/GitHub) — it's expected in every technical role.")

    if len(skills) < 5:
        suggestions.append("Your resume is light on technical skills — list all tools, languages, and frameworks you know.")

    return suggestions[:7]


def get_suggestions(text: str, skills: list, score: float) -> dict:
    """
    Returns actionable improvement tips with a mode flag.
    Falls back to rule-based suggestions if OpenAI is unavailable.

    Returns:
        { "suggestions": [...], "mode": "ai" | "offline" }
    """
    system = "You are a resume expert. Provide 5 concise, actionable bullet-point suggestions."
    user = f"Improve this resume:\n{text[:2000]}"

    result = _call_openai(system, user)
    if result and not result.startswith("ERROR:"):
        lines = [l.strip() for l in result.split("\n") if l.strip()]
        suggestions = [l.lstrip("0123456789.-) ") for l in lines if l]
        return {"suggestions": suggestions[:6], "mode": "ai"}

    return {"suggestions": _get_basic_suggestions(skills), "mode": "offline"}


def optimize_resume(text: str, skills: list = None) -> dict:
    """
    Returns an AI-rewritten resume OR fallback rule-based tips as a structured dict.

    Returns:
        {
            "mode":      "ai" | "offline",
            "optimized": str  (AI mode — full rewritten text),
            "suggestions": list[str]  (offline mode — actionable tips),
        }
    """
    system = (
        "You are a professional resume writer. Rewrite the provided resume to be "
        "more impactful, ATS-friendly, and compelling. Use strong action verbs, "
        "quantify achievements, and ensure it follows best practices. "
        "Keep the same structure but make every bullet point more powerful."
    )
    user = f"Please optimize and rewrite this resume:\n\n{text[:3000]}"

    result = _call_openai(system, user)

    # ── AI success path ──────────────────────────────────────────
    if result and not result.startswith("ERROR:"):
        return {"mode": "ai", "optimized": result, "suggestions": []}

    # ── Fallback path (no API key or API error) ──────────────────
    fallback = _get_basic_suggestions(skills or [])
    return {"mode": "offline", "optimized": "", "suggestions": fallback}
