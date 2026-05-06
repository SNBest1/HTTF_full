import json
import re


def extract_json_from_llm(raw: str) -> object | None:
    """
    Strip markdown fences and extract the first valid JSON value from raw LLM output.
    Tries direct parse → first [...] block → first {...} block.
    Returns None if all attempts fail.
    """
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    for pattern in (r"\[.*?\]", r"\{.*\}"):
        m = re.search(pattern, raw, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except Exception:
                pass

    return None
