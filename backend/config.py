"""Environment configuration, filesystem paths, and shared constants.

Nothing in here talks to a network or a database — it's pure config,
imported by everything else.
"""
import os
from pathlib import Path

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
CHROMA_HOST = os.getenv("CHROMADB_HOST", "chromadb")
CHROMA_PORT = int(os.getenv("CHROMADB_PORT", "8000"))
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3.2")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

EXPORT_DIR = Path("/app/exports")
EXPORT_DIR.mkdir(exist_ok=True)

DATA_DIR = Path("/app/data")
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "conversations.db"

CURATED_MODEL_CATALOG = [
    {"name": "llama3.2", "size": "2.0 GB", "description": "Meta's general-purpose model — the default for this app"},
    {"name": "qwen3:8b", "size": "5.2 GB", "description": "Stronger reasoning, slower on small GPUs"},
    {"name": "mistral", "size": "4.1 GB", "description": "Mistral AI's well-rounded 7B model"},
    {"name": "gemma3:4b", "size": "3.3 GB", "description": "Google's compact, efficient model"},
    {"name": "phi3", "size": "2.3 GB", "description": "Microsoft's lightweight model, good on modest hardware"},
    {"name": "codellama", "size": "3.8 GB", "description": "Meta's model specialized for code generation"},
    {"name": "nomic-embed-text", "size": "274 MB", "description": "Embedding model — used internally for RAG and memory"},
]
