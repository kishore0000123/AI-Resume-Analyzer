import os
from dotenv import load_dotenv
load_dotenv(override=True)
key = os.getenv("OPENAI_API_KEY", "NOT_FOUND")
print(f"Key Found: {key[:10]}... (Length: {len(key)})")
