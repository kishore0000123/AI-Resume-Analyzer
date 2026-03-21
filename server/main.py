from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Initialize environment FIRST
load_dotenv(override=True)
print(f"Main Entry: API Key configured? {'Yes' if os.getenv('OPENAI_API_KEY') else 'No'}")

from routes.resume import router

app = FastAPI(
    title="AI Resume Analyzer",
    description="Upload your resume PDF and get AI-powered analysis, scoring, and job matching.",
    version="1.0.0",
)

# Allow React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("FastAPI Application Starting...")

@app.get("/health")
def health_check():
    import os
    from services.ai_helper import _openai_available
    return {
        "status": "healthy",
        "openai_configured": _openai_available,
        "openai_key_length": len(os.getenv("OPENAI_API_KEY", ""))
    }

app.include_router(router)
