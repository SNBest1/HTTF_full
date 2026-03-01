"""
POST /log_phrase — records a phrase the user selected/spoke,
tagged with current location and time-of-day context.
"""

from fastapi import APIRouter
from models.schemas import LogPhraseRequest, LogPhraseResponse
from db.database import insert_phrase
from services.context import get_current_hour, get_context_tag
from services.vector_store import embed_and_store

router = APIRouter()


@router.post("/log_phrase", response_model=LogPhraseResponse)
def log_phrase(req: LogPhraseRequest) -> LogPhraseResponse:
    hour = get_current_hour()
    row_id = insert_phrase(req.phrase, req.location, hour)
    context_tag = get_context_tag(req.location, hour)

    # Embed immediately so the phrase is available for vector suggestions
    # right away rather than waiting for the nightly 2 AM training run.
    try:
        embed_and_store(req.phrase, req.location, context_tag)
    except Exception as exc:
        print(f"[log_phrase] Immediate embed failed (non-fatal): {exc}")

    return LogPhraseResponse(
        id=row_id,
        phrase=req.phrase,
        location=req.location,
        hour_of_day=hour,
        context_tag=context_tag,
    )
