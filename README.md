# AI Resume Analyzer

A full-stack resume analysis platform with an explainable scoring system. This application allows users to upload their resume (PDF), extracts relevant skills and keywords, and provides a detailed visual breakdown of their score alongside actionable insights.

## Project Goal
Instead of providing a single arbitrary score, this project aims to answer **"Why this score?"** by analyzing:
- Overall Section Coverage (Experience, Education, Projects, etc.)
- Relevant Tech Skills
- Keyword Density & ATS Readability
- Formatting & Brevity

## Key Features
- **PDF Parsing**: Robust text extraction from uploaded PDF resumes.
- **Skill Matching**: Cross-references resume text against a comprehensive tech-skills dictionary.
- **Explainable Scoring**:
  - Score Breakdown (Skills, Sections, Keywords, Experience).
  - Identification of **Weak Sections**.
  - Highlighting of **Missing Skills**.
- **Actionable Suggestions**: Rule-based feedback to help candidates improve their resume impact instantly.

## Architecture

This project is built with a decoupled frontend and backend:
- **Frontend (React)**: Clean, dashboard-style UI utilizing Vite and standard CSS. Focused primarily on the upload flow and results visualization.
- **Backend (FastAPI)**: Lightweight Python backend handling PDF parsing (`pdfminer.six`), skill extraction, and scoring logic.

### Core Structure
- `/client`: React application (Upload page `Home.jsx`, Results page `Dashboard.jsx`).
- `/server/main.py`: FastAPI entry point.
- `/server/routes/resume.py`: API routes for file upload and analysis.
- `/server/services/analyzer.py`: The core scoring engine and text analysis logic.

## Local Setup

### 1) Backend Setup
Open a terminal in the root folder:

```bash
cd server
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1
# Mac/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*The backend will run on `http://localhost:8000`*

### 2) Frontend Setup
Open another terminal:

```bash
cd client
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`*

## How to use
1. Start both servers.
2. Navigate to `http://localhost:5173` in your browser.
3. Drag and drop your PDF resume into the upload zone.
4. Click **"Analyze My Resume"**.
5. View the detailed dashboard for your score breakdown and actionable insights.

## License
MIT
