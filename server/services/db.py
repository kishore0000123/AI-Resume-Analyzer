import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Always load .env from the server directory, regardless of current working directory.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is not None:
        return _db

    uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/resume_analyzer")
    try:
        _client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        _client.server_info()  # Force connection test

        # Prefer the DB name from MONGODB_URI, fallback to resume_analyzer.
        default_db = _client.get_default_database()
        _db = default_db if default_db is not None else _client["resume_analyzer"]
        print(f"MongoDB connected (db={_db.name})")
    except Exception as e:
        print(f"Warning: MongoDB unavailable ({e}). Running without persistence.")
        _db = None

    return _db
