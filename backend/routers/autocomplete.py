"""
POST /autocomplete/accepted  — logs that a suggestion was accepted
POST /autocomplete/dismissed — logs that a suggestion was dismissed

These feed the acceptance-rate analytics and can later be used for
reinforcement-style re-ranking of suggestions.
"""

from fastapi import APIRouter
from models.schemas import AutocompleteRequest, AutocompleteResponse
from db.database import insert_autocomplete_log

router = APIRouter(prefix="/autocomplete")


@router.post("/accepted", response_model=AutocompleteResponse)
def autocomplete_accepted(req: AutocompleteRequest) -> AutocompleteResponse:
    insert_autocomplete_log(req.suggested_phrase, was_accepted=True)
    return AutocompleteResponse(logged=True, action="accepted")


@router.post("/dismissed", response_model=AutocompleteResponse)
def autocomplete_dismissed(req: AutocompleteRequest) -> AutocompleteResponse:
    insert_autocomplete_log(req.suggested_phrase, was_accepted=False)
    return AutocompleteResponse(logged=True, action="dismissed")
