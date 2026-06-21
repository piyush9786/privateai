"""External service clients: ChromaDB and the Ollama-backed embedding model.

Both the document vault and the memory store live in the same ChromaDB
instance, as two separate collections.
"""
import chromadb
from langchain_ollama import OllamaEmbeddings

from config import CHROMA_HOST, CHROMA_PORT, EMBED_MODEL, OLLAMA_URL

chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
embeddings = OllamaEmbeddings(model=EMBED_MODEL, base_url=OLLAMA_URL)


def get_collection():
    return chroma_client.get_or_create_collection("privateai_docs")


def get_memory_collection():
    return chroma_client.get_or_create_collection("privateai_memories")


def embed_text(text: str):
    return embeddings.embed_query(text)
