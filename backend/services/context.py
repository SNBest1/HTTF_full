"""
Context tagging service — derives time-of-day labels and composes context tags
used for both logging and LLM prompt construction.
"""

from datetime import datetime


def get_time_of_day_label(hour: int | None = None) -> str:
    """
    Map an hour (0–23) to a human-readable time-of-day band.
    If hour is None, uses current local time.
    """
    if hour is None:
        hour = datetime.now().hour

    if 5 <= hour < 9:
        return "early_morning"
    elif 9 <= hour < 12:
        return "morning"
    elif 12 <= hour < 14:
        return "midday"
    elif 14 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def get_current_hour() -> int:
    """Return the current local hour (0–23)."""
    return datetime.now().hour


def get_context_tag(location: str, hour: int | None = None) -> str:
    """
    Compose a single context tag string like 'Home_morning'.
    Used as metadata when embedding phrases into ChromaDB.
    """
    time_label = get_time_of_day_label(hour)
    return f"{location}_{time_label}"
