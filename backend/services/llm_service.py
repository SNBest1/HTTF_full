"""
LLM service — Ollama integration using the official Python SDK.
Builds a persona-aware system prompt and streams completions from phi3
(or any locally running model).

Setup prerequisite:
  brew install ollama && ollama serve
  ollama pull phi3
"""

import json
import re

import ollama

DEFAULT_MODEL = "phi3"


def parse_llm_suggestions(raw: str, max_items: int = 5) -> list[str]:
    """
    Robustly extract a list of suggestion strings from raw LLM output.

    phi3 (and other models) often wrap their response in markdown code fences
    or add preamble text, so bare json.loads() frequently fails.  This helper:
      1. Strips markdown code fences (```json ... ``` or ``` ... ```)
      2. Tries json.loads() on the cleaned text
      3. Falls back to a regex scan for the first [...] block in the raw output
      4. Last resort: splits by newline and strips bullet/dash prefixes
    """
    # 1. Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()

    # 2. Try direct parse on cleaned text
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return [str(s).strip() for s in parsed if str(s).strip()][:max_items]
    except Exception:
        pass

    # 3. Regex: find the first [...] block anywhere in the raw output
    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, list):
                return [str(s).strip() for s in parsed if str(s).strip()][:max_items]
        except Exception:
            pass

    # 4. Plain-text fallback: one suggestion per non-empty line
    lines = [
        re.sub(r"^[\s\-•\d.]+", "", line).strip()
        for line in raw.splitlines()
        if line.strip()
    ]
    return [l for l in lines if l][:max_items]


def build_system_prompt(location: str, context_tag: str) -> str:
    """
    Build a system prompt that gives the LLM context about who the user is
    and what kind of suggestions are needed.
    """
    return (
        "You are an AAC (Augmentative and Alternative Communication) assistant "
        "helping a non-verbal person communicate. "
        f"The user is currently at: {location} ({context_tag}). "
        "Based on the partial phrase given, suggest up to 3 complete phrases "
        "the user might want to say. "
        "Return ONLY a JSON array of strings, e.g.: "
        '[\"I need water please\", \"Can I have a break\", \"I need help\"]. '
        "Keep suggestions short, natural, and appropriate for the context. "
        "Do not include any explanation outside the JSON array."
    )


async def call_ollama(
    system_prompt: str,
    partial_input: str,
    model: str = DEFAULT_MODEL,
) -> str:
    """
    Call a locally running Ollama model and return the raw response text.
    Uses the async ollama client for FastAPI compatibility.
    """
    user_message = (
        f"Complete these phrases for me. Partial input: \"{partial_input}\""
        if partial_input.strip()
        else "Suggest 3 phrases I might want to say right now."
    )

    client = ollama.AsyncClient()
    response = await client.chat(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )
    return response.message.content
