"""External service clients: ChromaDB and the Ollama-backed embedding model.

Both the document vault and the memory store live in the same ChromaDB
instance, as two separate collections.
"""
import chromadb
from langchain_ollama import OllamaEmbeddings

from config import CHROMA_HOST, CHROMA_PORT, EMBED_MODEL, OLLAMA_URL

# Lazy initialization to avoid connection errors at import time
chroma_client = None
embeddings = None


def get_chroma_client():
    """Get or create ChromaDB client (lazy initialization)."""
    global chroma_client
    if chroma_client is None:
        try:
            chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        except Exception:
            # Fallback to persistent local client if server is unavailable
            chroma_client = chromadb.PersistentClient(path="/app/chroma_data")
    return chroma_client


def get_embeddings():
    """Get or create embeddings model (lazy initialization)."""
    global embeddings
    if embeddings is None:
        embeddings = OllamaEmbeddings(model=EMBED_MODEL, base_url=OLLAMA_URL)
    return embeddings


def get_collection(user_id: str):
    return get_chroma_client().get_or_create_collection(f"privateai_docs_{user_id}")


def get_memory_collection(user_id: str):
    return get_chroma_client().get_or_create_collection(f"privateai_memories_{user_id}")


def embed_text(text: str):
    return get_embeddings().embed_query(text)
