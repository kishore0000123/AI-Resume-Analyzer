import re

# ---------------------------------------------------------------------------
# Comprehensive skills database (100+ skills across multiple tech domains)
# ---------------------------------------------------------------------------
SKILLS_DB = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "kotlin", "swift", "php", "ruby", "scala", "r", "matlab", "perl",

    # Frontend
    "react", "vue", "angular", "next.js", "nuxt", "svelte", "html", "css",
    "sass", "tailwind", "bootstrap", "jquery", "webpack", "vite", "redux",

    # Backend
    "node", "node.js", "fastapi", "django", "flask", "spring", "express",
    "laravel", "rails", "asp.net", "graphql", "rest api", "grpc",

    # Databases
    "mongodb", "postgresql", "mysql", "sqlite", "redis", "cassandra",
    "dynamodb", "elasticsearch", "firebase", "supabase", "sql", "nosql",

    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "ci/cd", "jenkins", "github actions", "linux", "nginx", "apache",

    # AI / ML / Data
    "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
    "scikit-learn", "pandas", "numpy", "matplotlib", "opencv", "nlp",
    "computer vision", "data analysis", "data science", "llm", "openai",
    "langchain", "transformers", "hugging face",

    # Mobile
    "android", "ios", "react native", "flutter", "xamarin",

    # Tools & Practices
    "git", "github", "gitlab", "jira", "agile", "scrum", "figma", "adobe xd",
    "postman", "swagger", "linux", "bash", "powershell", "microservices",
    "test driven development", "tdd", "unit testing", "selenium", "cypress",
    "jest", "moat", "burp suite", "wireshark", "metasploit", "nmap",
    "risk assessment", "incident response", "vulnerability scanning",

    # Soft skills (keyword detection)
    "leadership", "communication", "teamwork", "problem solving",
    "project management", "critical thinking", "scrum master",
    "stakeholder management", "budgeting", "risk management",
}

# ---------------------------------------------------------------------------
# Job roles with required skills
# ---------------------------------------------------------------------------
JOB_ROLES = {
    "Frontend Developer": {
        "skills": ["react", "javascript", "typescript", "html", "css", "vue", "angular", "next.js", "tailwind"],
        "icon": "🎨",
    },
    "Backend Developer": {
        "skills": ["python", "node", "django", "fastapi", "flask", "express", "java", "go", "sql", "rest api"],
        "icon": "⚙️",
    },
    "Full Stack Developer": {
        "skills": ["react", "node", "javascript", "mongodb", "sql", "html", "css", "git"],
        "icon": "🔧",
    },
    "Data Scientist": {
        "skills": ["python", "machine learning", "pandas", "numpy", "scikit-learn", "tensorflow", "data analysis", "sql"],
        "icon": "📊",
    },
    "ML Engineer": {
        "skills": ["python", "machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "docker", "git"],
        "icon": "🤖",
    },
    "DevOps Engineer": {
        "skills": ["docker", "kubernetes", "aws", "ci/cd", "linux", "terraform", "ansible", "git", "bash"],
        "icon": "🚀",
    },
    "Mobile Developer": {
        "skills": ["react native", "flutter", "swift", "kotlin", "android", "ios", "javascript"],
        "icon": "📱",
    },
    "Cloud Architect": {
        "skills": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "microservices", "linux"],
        "icon": "☁️",
    },
    "Data Engineer": {
        "skills": ["python", "sql", "spark", "kafka", "aws", "postgresql", "mongodb", "data analysis"],
        "icon": "🔗",
    },
    "AI/LLM Engineer": {
        "skills": ["python", "openai", "langchain", "transformers", "llm", "fastapi", "nlp", "hugging face"],
        "icon": "✨",
    },
    "Cybersecurity Analyst": {
        "skills": ["linux", "wireshark", "metasploit", "nmap", "vulnerability scanning", "incident response", "python", "networking"],
        "icon": "🛡️",
    },
    "Project Manager": {
        "skills": ["agile", "scrum", "jira", "project management", "leadership", "communication", "stakeholder management", "budgeting"],
        "icon": "📋",
    },
    "QA Engineer": {
        "skills": ["selenium", "cypress", "jest", "unit testing", "tdd", "git", "jira", "javascript", "python"],
        "icon": "🧪",
    },
    "UI/UX Designer": {
        "skills": ["figma", "adobe xd", "sketch", "html", "css", "user research", "prototyping", "design thinking"],
        "icon": "🎨",
    },
}

# ---------------------------------------------------------------------------
# Resume section detectors
# ---------------------------------------------------------------------------
SECTION_PATTERNS = {
    "contact":      r"(email|phone|linkedin|github|portfolio|address|contact)",
    "education":    r"(education|university|college|degree|bachelor|master|phd|b\.tech|m\.tech|b\.sc|m\.sc)",
    "experience":   r"(experience|work history|employment|intern|internship|position|role|job)",
    "projects":     r"(project|built|developed|created|implemented)",
    "skills":       r"(skill|technology|tech stack|proficiency|expertise)",
    "achievements": r"(achievement|award|certificate|certification|honor|publication|hackathon)",
    "summary":      r"(summary|objective|profile|about me|overview)",
}


def extract_skills(text: str) -> list[str]:
    """Return list of matched skills found in the resume text."""
    text_lower = text.lower()
    found = []
    for skill in SKILLS_DB:
        # Use word-boundary matching for short skill names to avoid false positives
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return sorted(found)


def detect_sections(text: str) -> dict[str, bool]:
    """Detect which resume sections are present."""
    text_lower = text.lower()
    return {
        section: bool(re.search(pattern, text_lower))
        for section, pattern in SECTION_PATTERNS.items()
    }


def score_resume(text: str, skills: list[str]) -> dict:
    """
    Score resume on a 0–100 scale across 5 dimensions:
      1. Skills breadth       (30 pts)
      2. Section coverage     (25 pts)
      3. Resume length        (20 pts)
      4. Keyword density      (15 pts)
      5. Achievements/extras  (10 pts)
    """
    sections = detect_sections(text)
    word_count = len(text.split())

    # 1. Skills (30%)
    skill_score = min(len(skills) / 15, 1.0) * 100

    # 2. Experience (25%)
    experience_score = 100 if sections["experience"] else 0
    if sections["projects"] and not sections["experience"]:
        experience_score = 60
    elif sections["projects"]:
        experience_score = min(experience_score + 20, 100)

    # 3. Structure (15%) - based on sections and length
    section_count = sum(sections.values())
    base_structure = (section_count / len(SECTION_PATTERNS)) * 100
    if 400 <= word_count <= 1000:
        length_penalty = 0
    elif word_count < 400:
        length_penalty = (400 - word_count) / 400 * 50
    else:
        length_penalty = min((word_count - 1000) / 1000 * 50, 50)
    structure_score = max(base_structure - length_penalty, 0)

    # 4. Keywords (20%)
    keyword_density = len(skills) / max(word_count, 1) * 100
    keywords_score = min(keyword_density / 3, 1.0) * 100

    # 5. Achievements (10%)
    achievements_score = 100 if sections["achievements"] else 0

    total = round(
        skill_score * 0.3 +
        experience_score * 0.25 +
        keywords_score * 0.2 +
        structure_score * 0.15 +
        achievements_score * 0.1,
        1
    )
    total = min(max(total, 0), 100)

    missing_sections = [k for k, v in sections.items() if not v]
    weak_sections = []
    if "experience" in missing_sections:
        weak_sections.append("Work Experience")
    if "projects" in missing_sections:
        weak_sections.append("Projects")
    if "education" in missing_sections:
        weak_sections.append("Education")

    # Assuming a target role is not known, just general missing skills is hard.
    # Let's say if they have few skills, we suggest generic common ones.
    # We will compute "missing_skills" by looking at the top 10 most common skills.
    common_skills = ["javascript", "python", "react", "sql", "git", "html", "css", "docker", "aws", "node"]
    missing_skills = [s for s in common_skills if s not in skills][:5]

    low_keyword_match = bool(keyword_density < 3.0)

    suggestions = []
    if weak_sections:
        suggestions.append(f"Add missing sections: {', '.join(weak_sections)}.")
    if missing_skills:
        suggestions.append(f"Consider adding common industry skills if you know them: {', '.join(missing_skills)}.")
    if low_keyword_match:
        suggestions.append("Your resume has a low keyword density. Add more relevant tech keywords.")
    if word_count < 400:
        suggestions.append(f"Resume is too short ({word_count} words). Aim for 400-800 words.")
    elif word_count > 1000:
        suggestions.append(f"Resume is very long ({word_count} words). Try to be more concise.")

    return {
        "total": total,
        "breakdown": {
            "skills": round(skill_score * 0.3, 1),
            "sections": round(experience_score * 0.25, 1),
            "length": round(structure_score * 0.15, 1),
            "keyword_density": round(keywords_score * 0.2, 1),
            "achievements": round(achievements_score * 0.1, 1),
        },
        "sections_found": sections,
        "word_count": word_count,
        "missing_skills": missing_skills,
        "weak_sections": weak_sections,
        "low_keyword_match": low_keyword_match,
        "suggestions": suggestions,
    }


def match_jobs(skills: list[str]) -> list[dict]:
    """Return job roles sorted by match percentage descending."""
    skills_set = {s.lower() for s in skills}
    results = []

    for role, data in JOB_ROLES.items():
        required = data["skills"]
        matched = [s for s in required if s in skills_set]
        missing = [s for s in required if s not in skills_set]
        pct = round((len(matched) / len(required)) * 100, 1)
        status = "strong" if pct >= 70 else ("moderate" if pct >= 40 else "weak")
        results.append({
            "role": role,
            "icon": data["icon"],
            "match_percent": pct,
            "matched_skills": matched,
            "missing_skills": missing,
            "status": status,
        })

    results.sort(key=lambda x: x["match_percent"], reverse=True)
    return results


def best_role(matches: list[dict]) -> dict | None:
    """Return the top-matching role entry if available."""
    if not matches:
        return None
    return matches[0]


def _tokenize_jd(text: str) -> set[str]:
    """Extract meaningful keywords from a JD text (words 2+ chars, alpha only)."""
    words = re.findall(r'[a-zA-Z][a-zA-Z0-9+#.]*', text.lower())
    stopwords = {
        "the", "and", "for", "with", "you", "our", "are", "will", "have",
        "this", "that", "from", "your", "can", "must", "about", "their",
        "be", "in", "of", "to", "a", "an", "is", "or", "we", "not", "as",
        "at", "by", "on", "us", "it", "its", "all", "any", "but", "has"
    }
    return {w for w in words if len(w) >= 2 and w not in stopwords}


from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def jd_match(resume_text: str, jd_text: str, resume_skills: list[str]) -> dict:
    """
    Compare resume against a job description using TF-IDF Cosine Similarity.
    Returns match_percent, matched_skills, missing_skills, jd_keywords.
    """
    resume_skills_set = {s.lower() for s in resume_skills}

    # Extract known skills from JD
    jd_text_lower = jd_text.lower()
    jd_skills = set()
    for skill in SKILLS_DB:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, jd_text_lower):
            jd_skills.add(skill)

    # Calculate overall similarity score using TF-IDF
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        vectors = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
        match_percent = round(similarity * 100, 1)
    except Exception:
        # Fallback if empty texts or vectorizer fails
        match_percent = 0

    jd_keywords = _tokenize_jd(jd_text)
    
    if not jd_skills and match_percent == 0:
        return {
            "match_percent": 0,
            "matched_skills": [],
            "missing_skills": [],
            "jd_keywords": [],
            "note": "No recognisable skills found and texts are completely dissimilar.",
        }

    matched = sorted(jd_skills & resume_skills_set)
    missing = sorted(jd_skills - resume_skills_set)

    return {
        "match_percent": match_percent,
        "matched_skills": matched,
        "missing_skills": missing,
        "jd_keywords": sorted(list(jd_skills))[:30],
        "note": "Matched using TF-IDF cosine similarity." if match_percent > 0 else None,
    }


def get_role_suggestions(role: str, current_skills: list[str] | None = None) -> dict:
    """Return role-specific skills, missing skills, project ideas, and ATS keywords."""
    current = {s.lower().strip() for s in (current_skills or []) if s and s.strip()}

    if role not in JOB_ROLES:
        return {
            "available": False,
            "message": "Role not found",
            "role": role,
            "available_roles": sorted(JOB_ROLES.keys()),
        }

    required = JOB_ROLES[role]["skills"]
    matched = [s for s in required if s in current]
    missing = [s for s in required if s not in current]

    project_templates = {
        "Frontend Developer": [
            "Build a responsive dashboard with React and Tailwind including charts and filters.",
            "Create a role-based auth UI with React Router and protected routes.",
        ],
        "Backend Developer": [
            "Design a FastAPI service with JWT auth, pagination, and role-based permissions.",
            "Build a REST API with caching and database indexing for performance.",
        ],
        "Data Scientist": [
            "Train and evaluate a prediction model with feature engineering and validation metrics.",
            "Build an end-to-end notebook that cleans data, visualizes patterns, and explains outcomes.",
        ],
    }

    projects = project_templates.get(role, [
        f"Build a portfolio project aligned to {role} responsibilities using {', '.join(required[:3])}.",
        f"Create a practical case study showing measurable outcomes for a {role} scenario.",
    ])

    return {
        "available": True,
        "role": role,
        "icon": JOB_ROLES[role]["icon"],
        "recommended_skills": required,
        "matched_skills": matched,
        "missing_skills": missing,
        "ats_keywords": required[:8],
        "project_ideas": projects,
    }
