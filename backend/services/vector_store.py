"""
Vector store service — ChromaDB 1.x persistent client with sentence-transformer
embeddings for semantic similarity search.

Critical design notes:
- Module-level singletons: client, collection, and SentenceTransformer loaded once at startup.
- n_results guard: ChromaDB raises if n_results > collection size — always clamp first.
- Duplicate prevention: uses MD5 hash of phrase as document ID + where-filter check.
"""

import hashlib
from pathlib import Path
from typing import Optional

import chromadb
from chromadb import Collection
from sentence_transformers import SentenceTransformer

COLLECTION_NAME = "aac_phrases"
CHROMA_PATH = str(Path(__file__).parent.parent / "chroma_db")
EMBED_MODEL = "all-MiniLM-L6-v2"

_client: Optional[chromadb.PersistentClient] = None
_collection: Optional[Collection] = None
_embedder: Optional[SentenceTransformer] = None


def init_vector_store() -> None:
    """
    Initialise ChromaDB persistent client and load sentence-transformer model.
    Called once during FastAPI lifespan startup.
    """
    global _client, _collection, _embedder
    _client = chromadb.PersistentClient(path=CHROMA_PATH)
    _collection = _client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    _embedder = SentenceTransformer(EMBED_MODEL)
    count = _collection.count()
    print(f"[vector_store] Initialised. Collection '{COLLECTION_NAME}' has {count} documents.")


def _phrase_id(phrase: str) -> str:
    """Deterministic document ID from phrase text (MD5 hex digest)."""
    return hashlib.md5(phrase.encode()).hexdigest()


def embed_and_store(phrase: str, location: str, context_tag: str) -> bool:
    """
    Embed a phrase and upsert it into ChromaDB.
    Returns True if it was newly added, False if it already existed.
    """
    if _collection is None or _embedder is None:
        raise RuntimeError("Vector store not initialised. Call init_vector_store() first.")

    doc_id = _phrase_id(phrase)

    # Check for duplicate via get (cheaper than a query)
    existing = _collection.get(ids=[doc_id])
    if existing["ids"]:
        return False  # Already stored

    embedding = _embedder.encode(phrase).tolist()
    _collection.add(
        ids=[doc_id],
        embeddings=[embedding],
        documents=[phrase],
        metadatas=[{"location": location, "context_tag": context_tag}],
    )
    return True


def query_similar(
    query_text: str,
    location: Optional[str] = None,
    n_results: int = 5,
) -> list[str]:
    """
    Find the n most semantically similar phrases to query_text.
    Optionally filter by location metadata.
    Returns a list of matching phrase strings.
    """
    if _collection is None or _embedder is None:
        raise RuntimeError("Vector store not initialised. Call init_vector_store() first.")

    count = _collection.count()
    if count == 0:
        return []

    # Query for more candidates than needed so Python-side location filtering
    # always has enough results.  Never pass where_filter to ChromaDB —
    # ChromaDB raises InvalidArgumentError when location-matching docs <
    # n_results (because HNSW pre-fetches n_results before applying the filter).
    safe_n = min(n_results * 2, count)

    embedding = _embedder.encode(query_text).tolist()

    results = _collection.query(
        query_embeddings=[embedding],
        n_results=safe_n,
        where=None,
        include=["documents", "metadatas"],
    )

    docs_and_meta = list(zip(
        results.get("documents", [[]])[0],
        results.get("metadatas", [[]])[0],
    ))

    if location:
        # Prefer location-matched phrases; fall back to globally-ranked results
        # when the current location has fewer than 3 matching docs.
        location_docs = [doc for doc, meta in docs_and_meta
                         if meta.get("location") == location]
        if len(location_docs) >= 3:
            return location_docs[:n_results]
        other_docs = [doc for doc, meta in docs_and_meta
                      if meta.get("location") != location]
        return (location_docs + other_docs)[:n_results]

    return [doc for doc, _ in docs_and_meta][:n_results]


def get_collection_count() -> int:
    """Return number of documents currently in the collection."""
    if _collection is None:
        return 0
    return _collection.count()
