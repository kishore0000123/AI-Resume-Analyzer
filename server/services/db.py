import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

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
        _db = _client["resume_analyzer"]
        print("MongoDB connected")
    except Exception as e:
        print(f"Warning: MongoDB unavailable ({e}). Running without persistence.")
        _db = None

    return _db
