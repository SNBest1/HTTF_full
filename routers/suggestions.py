"""
GET /suggestions — returns word/phrase predictions using:
  1. Bigram vocab (next-word predictions from partial input)
  2. ChromaDB semantic similarity (full phrase suggestions)
  3. LLM fallback (when ChromaDB has fewer than 5 phrases)
"""

from fastapi import APIRouter, Query
from models.schemas import SuggestionsResponse
from services.vocab import predict_next_words
from services.vector_store import query_similar, get_collection_count
from services.context import get_context_tag, get_current_hour

router = APIRouter()

VECTOR_MIN_PHRASES = 5  # Fall back to LLM below this threshold


@router.get("/suggestions", response_model=SuggestionsResponse)
async def get_suggestions(
    location: str = Query(default="Home"),
    partial: str = Query(default=""),
) -> SuggestionsResponse:
    predictions: list[str] = []
    source = "empty"

    # Layer 1 — bigram next-word predictions
    next_words = predict_next_words(partial, n=2)
    predictions.extend(next_words)

    collection_count = get_collection_count()

    if collection_count >= VECTOR_MIN_PHRASES:
        # Layer 2 — semantic similarity from ChromaDB
        query = partial if partial.strip() else f"I need something at {location}"
        similar = query_similar(query_text=query, location=location, n_results=5)
        # De-duplicate: don't add if already a next-word prediction
        for phrase in similar:
            if phrase not in predictions:
                predictions.append(phrase)
        source = "vector"
    else:
        # Layer 3 — LLM fallback
        try:
            from services.llm_service import call_ollama, build_system_prompt
            import json as _json

            context_tag = get_context_tag(location, get_current_hour())
            system_prompt = build_system_prompt(location, context_tag)
            raw = await call_ollama(system_prompt=system_prompt, partial_input=partial)

            # Try to parse JSON list from LLM output
            try:
                llm_suggestions = _json.loads(raw)
                if isinstance(llm_suggestions, list):
                    predictions.extend(str(s) for s in llm_suggestions[:3])
            except Exception:
                # LLM returned plain text — split by newline
                lines = [l.strip("- •\n").strip() for l in raw.splitlines() if l.strip()]
                predictions.extend(lines[:3])

            source = "llm"
        except Exception as exc:
            print(f"[suggestions] LLM fallback failed: {exc}")
            source = "empty"

    # If we have bigram predictions alongside vector/llm results, label as "vocab"
    if next_words and source == "vector":
        source = "vector"  # vector takes precedence in label
    elif next_words and source == "empty":
        source = "vocab"

    return SuggestionsResponse(predictions=predictions[:8], source=source)
