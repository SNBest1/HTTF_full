"""
POST /llm_suggest — direct LLM suggestion endpoint (bypasses vector store).
Useful for cold-start scenario or when the user wants fresh suggestions.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import LLMSuggestRequest, LLMSuggestResponse
from services.llm_service import build_system_prompt, call_ollama, parse_llm_suggestions, DEFAULT_MODEL
from services.context import get_context_tag, get_current_hour

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

    return LLMSuggestResponse(suggestions=parse_llm_suggestions(raw), model=DEFAULT_MODEL)
