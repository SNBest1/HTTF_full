"""
Agent service — intent classification using Ollama phi3.

IntentClassifier.classify(message) sends a structured classification prompt
to phi3 and returns { "intent": str, "entities": dict }.

Supported intents (must match action_type in AgentResponse):
  - "make_call"     → entities: { "contact_name": str, "phone_number": str }
  - "order_food"    → entities: { "items": list[str] }
  - "set_reminder"  → entities: { "text": str, "time": str }
  - "general_chat"  → entities: {}
"""

import json
import re

import ollama

from services.llm_service import DEFAULT_MODEL

CLASSIFICATION_SYSTEM_PROMPT = (
    "You are an intent classifier for an AAC (Augmentative and Alternative Communication) "
    "personal assistant. Given a user message, classify the intent into exactly one of: "
    "'make_call', 'order_food', 'set_reminder', 'general_chat'. "
    "Also extract relevant entities. "
    "Respond ONLY with a JSON object in this exact format: "
    '{"intent": "<one of the four intents>", "entities": {<key-value pairs or empty>}}. '
    "Examples:\n"
    "  message: 'Call mom' → "
    '{"intent": "make_call", "entities": {"contact_name": "mom", "phone_number": ""}}\n'
    "  message: 'Order a pizza and a drink' → "
    '{"intent": "order_food", "entities": {"items": ["pizza", "drink"]}}\n'
    "  message: 'Remind me to take my medicine at 9am' → "
    '{"intent": "set_reminder", "entities": {"text": "take my medicine", "time": "9:00 AM"}}\n'
    "  message: 'How are you?' → "
    '{"intent": "general_chat", "entities": {}}'
)

REPLY_SYSTEM_PROMPT = (
    "You are a warm, concise personal assistant for an AAC user. "
    "Given a user message and the detected intent, write a short, friendly one-sentence "
    "confirmation reply. Keep it under 20 words. Do not use JSON — just plain text."
)

VALID_INTENTS = {"make_call", "order_food", "set_reminder", "general_chat"}


def _parse_classification_response(raw: str) -> dict:
    """
    Robustly extract a classification dict from raw LLM output.
    Mirrors the multi-fallback approach in parse_llm_suggestions().

    Returns a dict with keys 'intent' and 'entities'.
    Falls back to { 'intent': 'general_chat', 'entities': {} } on parse failure.
    """
    FALLBACK = {"intent": "general_chat", "entities": {}}

    # 1. Strip markdown fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()

    # 2. Direct JSON parse on cleaned text
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict) and "intent" in parsed:
            return parsed
    except Exception:
        pass

    # 3. Regex: find first {...} block in the raw output (greedy to capture full JSON object)
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, dict) and "intent" in parsed:
                return parsed
        except Exception:
            pass

    return FALLBACK


class IntentClassifier:
    """Stateless classifier — create once and call classify() repeatedly."""

    async def classify(self, message: str) -> dict:
        """
        Classify the user's message into one of four intents.
        Returns { 'intent': str, 'entities': dict }.
        """
        client = ollama.AsyncClient()
        response = await client.chat(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
        )
        raw = response.message.content
        result = _parse_classification_response(raw)

        # Sanitise: force intent into allowed set
        if result.get("intent") not in VALID_INTENTS:
            result["intent"] = "general_chat"
        if not isinstance(result.get("entities"), dict):
            result["entities"] = {}

        return result

    async def generate_reply(self, message: str, intent: str) -> str:
        """
        Generate a short conversational reply acknowledging what the agent is doing.
        For action intents, returns hardcoded confirmations (faster, no prompt echo).
        For general_chat, calls LLM with post-processing to prevent prompt echo.
        """
        FALLBACKS = {
            "make_call": "I'll connect that call for you.",
            "order_food": "Order placed! Food is on its way.",
            "set_reminder": "Got it, reminder is set!",
            "general_chat": "I'm here to help.",
        }
        # For action intents, skip the LLM entirely — use reliable confirmations
        if intent != "general_chat":
            return FALLBACKS[intent]

        # For general_chat, call LLM but sanitize the output
        try:
            client = ollama.AsyncClient()
            response = await client.chat(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": REPLY_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Message: '{message}'. Intent: '{intent}'."},
                ],
            )
            raw = response.message.content.strip()

            # Take only the first sentence to prevent multi-paragraph dumps
            first_sentence = re.split(r"[.!?]", raw)[0].strip()

            # Reject if too long (prompt echo) or contains system prompt leakage
            _LEAKAGE_KEYWORDS = ("AAC", "classify", "intent", "JSON", "ONLY", "entities")
            if (
                not first_sentence
                or len(first_sentence) > 150
                or any(kw in first_sentence for kw in _LEAKAGE_KEYWORDS)
            ):
                return FALLBACKS["general_chat"]

            return first_sentence
        except Exception:
            return FALLBACKS["general_chat"]
