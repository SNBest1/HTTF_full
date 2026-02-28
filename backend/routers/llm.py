"""
POST /llm_suggest — direct LLM suggestion endpoint (bypasses vector store).
Useful for cold-start scenario or when the user wants fresh suggestions.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import LLMSuggestRequest, LLMSuggestResponse
from services.llm_service import build_system_prompt, call_ollama, DEFAULT_MODEL
from services.context import get_context_tag, get_current_hour
import json

router = APIRouter()


@router.post("/llm_suggest", response_model=LLMSuggestResponse)
async def llm_suggest(req: LLMSuggestRequest) -> LLMSuggestResponse:
    context_tag = get_context_tag(req.location, get_current_hour())
    system_prompt = build_system_prompt(req.location, context_tag)

    try:
        raw = await call_ollama(system_prompt=system_prompt, partial_input=req.partial_input)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama unavailable: {exc}. Ensure 'ollama serve' is running.",
        )

    # Parse JSON list from response
    suggestions: list[str] = []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            suggestions = [str(s) for s in parsed[:5]]
    except Exception:
        # Fallback: extract non-empty lines
        suggestions = [
            line.strip("- •\n").strip()
            for line in raw.splitlines()
            if line.strip()
        ][:5]

    return LLMSuggestResponse(suggestions=suggestions, model=DEFAULT_MODEL)
