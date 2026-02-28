"""
POST /log_phrase — records a phrase the user selected/spoke,
tagged with current location and time-of-day context.
"""

from fastapi import APIRouter
from models.schemas import LogPhraseRequest, LogPhraseResponse
from db.database import insert_phrase
from services.context import get_current_hour, get_context_tag

router = APIRouter()


@router.post("/log_phrase", response_model=LogPhraseResponse)
def log_phrase(req: LogPhraseRequest) -> LogPhraseResponse:
    hour = get_current_hour()
    row_id = insert_phrase(req.phrase, req.location, hour)
    context_tag = get_context_tag(req.location, hour)
    return LogPhraseResponse(
        id=row_id,
        phrase=req.phrase,
        location=req.location,
        hour_of_day=hour,
        context_tag=context_tag,
    )
