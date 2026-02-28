"""
LLM service — Ollama integration using the official Python SDK.
Builds a persona-aware system prompt and streams completions from phi3
(or any locally running model).

Setup prerequisite:
  brew install ollama && ollama serve
  ollama pull phi3
"""

import ollama

DEFAULT_MODEL = "phi3"


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
