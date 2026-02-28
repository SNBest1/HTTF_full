"""
Pydantic request/response models for all API endpoints.
Using Pydantic v2 syntax throughout (model_config, field defaults).
"""

from pydantic import BaseModel, Field
from typing import Literal


# ── Phrases ──────────────────────────────────────────────────────────────────

class LogPhraseRequest(BaseModel):
    phrase: str = Field(..., min_length=1, description="The spoken/selected phrase")
    location: str = Field(default="Home", description="Current user location")


class LogPhraseResponse(BaseModel):
    id: int
    phrase: str
    location: str
    hour_of_day: int
    context_tag: str


# ── Suggestions ───────────────────────────────────────────────────────────────

class SuggestionsResponse(BaseModel):
    predictions: list[str]
    source: Literal["vector", "llm", "vocab", "empty"]


# ── LLM ──────────────────────────────────────────────────────────────────────

class LLMSuggestRequest(BaseModel):
    location: str = Field(default="Home")
    partial_input: str = Field(default="", description="Partial phrase typed so far")


class LLMSuggestResponse(BaseModel):
    suggestions: list[str]
    model: str


# ── TTS ───────────────────────────────────────────────────────────────────────

class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1)
    mode: Literal["offline", "elevenlabs"] | None = Field(
        default=None,
        description="Override tts_mode from user_config.json",
    )


# ── Autocomplete ──────────────────────────────────────────────────────────────

class AutocompleteRequest(BaseModel):
    suggested_phrase: str = Field(..., min_length=1)


class AutocompleteResponse(BaseModel):
    logged: bool
    action: Literal["accepted", "dismissed"]


# ── Analytics ────────────────────────────────────────────────────────────────

class HeatmapEntry(BaseModel):
    hour: int
    location: str
    count: int


class HeatmapResponse(BaseModel):
    data: list[HeatmapEntry]


class SummaryResponse(BaseModel):
    total_phrases: int
    total_suggestions: int
    acceptance_rate: float
    top_phrases: list[str]
    top_locations: dict[str, int]


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    phrases_logged: int
