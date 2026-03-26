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


def _chat_fallback_reply(question: str) -> dict:
    """Rule-based mentor bot reply for resume Q&A."""
    q = (question or "").lower().strip()

    if "how to build" in q or "build resume" in q or "start resume" in q:
        return {
            "reply": (
                "1) Add your name and contact details\n"
                "2) Add a short summary\n"
                "3) Add technical skills\n"
                "4) Add 2-3 strong projects\n"
                "5) Add education and certifications\n"
                "6) Keep it one page and ATS-friendly."
            ),
            "action": "summary",
            "mode": "offline",
        }

    if "fresher" in q or "student" in q or "beginner" in q or "no experience" in q:
        return {
            "reply": (
                "Great. As a fresher, focus on projects, skills, and certifications first.\n\n"
                "Do you want a step-by-step fresher resume flow?"
            ),
            "action": None,
            "mode": "offline",
        }

    if "yes" in q or "start" in q:
        return {
            "reply": (
                "Awesome. Step 1: Add basic details (name, email, phone).\n"
                "Step 2: Write a 2-3 line summary.\n"
                "Step 3: Add skills and 2 projects with outcomes."
            ),
            "action": "summary",
            "mode": "offline",
        }

    if "project" in q:
        return {
            "reply": "Project format: Problem -> Solution -> Tech stack -> Result. Keep 2-4 impact bullets per project.",
            "action": "projects",
            "mode": "offline",
        }

    if "skill" in q or "tech stack" in q:
        return {
            "reply": "Group skills by category: Languages, Frameworks, Databases, Tools. Keep only interview-ready skills.",
            "action": "skills",
            "mode": "offline",
        }

    if "ats" in q or "keyword" in q:
        return {
            "reply": "ATS tips: use role keywords, clear section headings, no tables/images, and export as PDF.",
            "action": None,
            "mode": "offline",
        }

    return {
        "reply": "Ask me: How to build resume, Fresher tips, Project section help, or ATS tips.",
        "action": None,
        "mode": "offline",
    }


_INTERVIEW_BANKS = {
    "Frontend Developer": {
        "technical": [
            "Explain the difference between `==` and `===` in JavaScript.",
            "What is the virtual DOM in React and how does it improve performance?",
            "How would you optimise a React app that re-renders too frequently?",
            "Describe CSS specificity and how it resolves style conflicts.",
            "What are React Hooks and why were they introduced?",
        ],
        "behavioral": [
            "Tell me about a UI challenge you solved creatively.",
            "How do you stay updated with fast-changing frontend tools?",
            "Describe a time you improved the performance of a web page.",
        ],
    },
    "Backend Developer": {
        "technical": [
            "What is the difference between REST and GraphQL?",
            "How do you handle database transactions and ensure data consistency?",
            "Explain the concept of middleware in FastAPI or Express.",
            "What strategies do you use to scale a backend service?",
            "How would you design rate limiting for a public API?",
        ],
        "behavioral": [
            "Tell me about an API you designed from scratch.",
            "How do you handle breaking changes in a live API?",
            "Describe a time you debugged a tricky production issue.",
        ],
    },
    "Data Scientist": {
        "technical": [
            "What is the bias-variance tradeoff in machine learning?",
            "How do you handle class imbalance in a classification problem?",
            "Explain the difference between bagging and boosting.",
            "What evaluation metrics would you use for a recommendation system?",
            "How would you detect and handle outliers in a dataset?",
        ],
        "behavioral": [
            "Describe a project where your model had unexpected results.",
            "How do you communicate complex technical results to non-technical stakeholders?",
            "Tell me about a time you had to work with messy, incomplete data.",
        ],
    },
    "ML Engineer": {
        "technical": [
            "How do you serve a machine learning model in production?",
            "What is model drift and how do you detect it?",
            "Explain the difference between batch and online learning.",
            "How would you implement a simple recommendation engine?",
            "What tools do you use for experiment tracking in ML?",
        ],
        "behavioral": [
            "Describe how you chose a model architecture for a real project.",
            "How do you collaborate with data engineers and product managers?",
            "Tell me about a time your model failed in production and how you fixed it.",
        ],
    },
    "DevOps Engineer": {
        "technical": [
            "What is the difference between Docker and a virtual machine?",
            "How do you implement a zero-downtime deployment?",
            "Explain Kubernetes pod scheduling and resource limits.",
            "What is Infrastructure as Code and what tools do you use for it?",
            "How do you set up a CI/CD pipeline for a microservices app?",
        ],
        "behavioral": [
            "Describe a critical outage you helped resolve.",
            "How do you balance speed of delivery with system reliability?",
            "Tell me about a time you automated a manual process significantly.",
        ],
    },
    "Full Stack Developer": {
        "technical": [
            "How do you manage state across a React frontend and Node.js backend?",
            "What is CORS and how do you configure it properly?",
            "Explain the HTTP request lifecycle from browser to database.",
            "How do you implement authentication with JWT tokens?",
            "What strategies do you use to keep APIs secure?",
        ],
        "behavioral": [
            "Tell me about a full-stack feature you built end-to-end.",
            "How do you prioritise frontend vs backend work in a sprint?",
            "Describe a complex bug that crossed both layers of the stack.",
        ],
    },
}

_GENERAL_QUESTIONS = {
    "technical": [
        "Explain the difference between synchronous and asynchronous programming.",
        "What is version control and why is Git important in a team?",
        "How do you approach debugging an unfamiliar codebase?",
        "What is the difference between SQL and NoSQL databases?",
        "Describe the software development life cycle (SDLC).",
    ],
    "behavioral": [
        "Tell me about a challenging project you worked on and what you learned.",
        "How do you handle tight deadlines and competing priorities?",
        "Describe a time you disagreed with a teammate and how you resolved it.",
    ],
}


def _fallback_interview_questions(role: str) -> dict:
    """Return role-specific interview questions from the offline bank."""
    bank = _INTERVIEW_BANKS.get(role, _GENERAL_QUESTIONS)
    return {
        "questions": {
            "technical": bank["technical"],
            "behavioral": bank["behavioral"],
        },
        "mode": "offline",
        "role": role or "General",
    }


def generate_interview_questions(text: str, role: str, skills: list) -> dict:
    """
    Generate interview questions based on the resume.
    Returns { questions: { technical: [...], behavioral: [...] }, mode, role }.
    """
    skills_str = ", ".join(skills[:15]) if skills else "general tech skills"
    system = (
        "You are an expert technical interviewer. Generate concise, specific interview questions "
        "based on the candidate's resume. Return EXACTLY this format:\n"
        "TECHNICAL:\n1. ...\n2. ...\n3. ...\n4. ...\n5. ...\n\nBEHAVIORAL:\n1. ...\n2. ...\n3. ..."
    )
    user = (
        f"Candidate's best role: {role}\n"
        f"Detected skills: {skills_str}\n\n"
        f"Resume (first 1500 chars):\n{text[:1500]}\n\n"
        "Generate 5 technical and 3 behavioral interview questions."
    )

    result = _call_openai(system, user)
    if result and not result.startswith("ERROR:"):
        technical, behavioral = [], []
        section = None
        for line in result.split("\n"):
            line = line.strip()
            if not line:
                continue
            if "TECHNICAL" in line.upper():
                section = "technical"
                continue
            if "BEHAVIORAL" in line.upper():
                section = "behavioral"
                continue
            # Strip leading number/dot/dash
            q = line.lstrip("0123456789.-) ").strip()
            if q:
                if section == "technical" and len(technical) < 5:
                    technical.append(q)
                elif section == "behavioral" and len(behavioral) < 3:
                    behavioral.append(q)
        if technical or behavioral:
            return {
                "questions": {"technical": technical, "behavioral": behavioral},
                "mode": "ai",
                "role": role or "General",
            }

    return _fallback_interview_questions(role)


def get_chat_reply(question: str) -> dict:
    """Return chatbot reply. Uses OpenAI when available, otherwise fallback rules."""
    fallback = _chat_fallback_reply(question)

    system = (
        "You are a concise resume mentor bot. Give practical beginner-friendly advice in 2-6 short lines. "
        "Avoid long paragraphs."
    )
    user = f"User question: {question}"

    result = _call_openai(system, user)
    if result and not result.startswith("ERROR:"):
        return {
            "reply": result,
            "action": fallback.get("action"),
            "mode": "ai",
        }

    return fallback
