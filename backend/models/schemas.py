"""
Pydantic request/response models for all API endpoints.
Using Pydantic v2 syntax throughout (model_config, field defaults).
"""

from pydantic import BaseModel, Field
from typing import Literal


# ── Phrases ──────────────────────────────────────────────────────────────────

class LogPhraseRequest(BaseModel):
    phrase: str = Field(..., min_length=1, max_length=500, description="The spoken/selected phrase")
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
    text: str = Field(..., min_length=1, max_length=1000)
    mode: Literal["offline", "elevenlabs"] | None = Field(
        default=None,
        description="Override tts_mode from user_config.json",
    )


# ── Autocomplete ──────────────────────────────────────────────────────────────

class AutocompleteRequest(BaseModel):
    suggested_phrase: str = Field(..., min_length=1, max_length=500)


class AutocompleteResponse(BaseModel):
    logged: bool
    action: Literal["accepted", "dismissed"]


# ── Analytics ────────────────────────────────────────────────────────────────

class HeatmapEntry(BaseModel):
    word: str
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


# ── Agent / Intent Router ─────────────────────────────────────────────────────

class AgentRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User's natural language message to the agent")
    location: str = Field(default="Home", description="Current user location for context")


class AgentResponse(BaseModel):
    reply: str = Field(..., description="Conversational reply string shown in the chat bubble")
    action_type: Literal["make_call", "order_food", "set_reminder", "general_chat"] = Field(
        ..., description="Classified intent action"
    )
    action_payload: dict = Field(
        default_factory=dict,
        description="Structured action data — shape varies by action_type",
    )


# ── Reminders ─────────────────────────────────────────────────────────────────

class ReminderItem(BaseModel):
    id: int
    text: str
    time: str
    created_at: str


class RemindersResponse(BaseModel):
    reminders: list[ReminderItem]


class DeleteReminderResponse(BaseModel):
    deleted: bool
    id: int


# ── Config ────────────────────────────────────────────────────────────────────

class ConfigResponse(BaseModel):
    locations: list[str]
    default_location: str
    tts_mode: str
