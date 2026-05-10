"""
LLM service — Ollama integration using the official Python SDK.
Builds a persona-aware system prompt and streams completions from phi3
(or any locally running model).

Setup prerequisite:
  brew install ollama && ollama serve
  ollama pull phi3
"""

import ast
import re

import ollama

import json as _json
from pathlib import Path as _Path

_cfg = _json.loads((_Path(__file__).parent.parent / "user_config.json").read_text())
DEFAULT_MODEL: str = _cfg.get("llm_model", "phi3")

from services.utils import extract_json_from_llm


def parse_llm_suggestions(raw: str, max_items: int = 5) -> list[str]:
    parsed = extract_json_from_llm(raw)
    if isinstance(parsed, list):
        items = [str(s).strip() for s in parsed if str(s).strip()]
        if items:
            return items[:max_items]

    # Lenient pass: ast.literal_eval tolerates mixed/single quotes and
    # missing-comma-between-strings (treats them as adjacent-string concat).
    cleaned = re.sub(r"```(?:json|python)?\s*", "", raw).replace("```", "").strip()
    bracket = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if bracket:
        try:
            literal = ast.literal_eval(bracket.group())
            if isinstance(literal, (list, tuple)):
                items = [str(s).strip() for s in literal if str(s).strip()]
                if items:
                    return items[:max_items]
        except (ValueError, SyntaxError):
            pass

    # Last resort: pull every quoted string out of the raw output, ignoring
    # bare brackets/punctuation that the line-splitter used to surface as items.
    print(f"[llm] JSON/literal parse failed, extracting quoted strings. Raw: {raw[:200]!r}")
    items: list[str] = []
    for double, single in re.findall(
        r'"((?:[^"\\]|\\.)*)"|\'((?:[^\'\\]|\\.)*)\'', raw
    ):
        text = (double or single).strip()
        text = text.replace('\\"', '"').replace("\\'", "'")
        if text and len(text) > 1:
            items.append(text)
    return items[:max_items]


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
