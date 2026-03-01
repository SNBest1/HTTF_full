"""
reminder_tool — handles 'set_reminder' intent.

Writes the reminder into the SQLite reminders table and returns a confirmation payload.
"""

import re

from models.schemas import AgentResponse
from db.database import insert_reminder

_TIME_RE = [
    # "9:30 AM", "9:30 PM", "09:30 am"
    (re.compile(r'(\d{1,2}):(\d{2})\s*(AM|PM)', re.IGNORECASE),
     lambda m: f"{int(m.group(1))}:{m.group(2)} {m.group(3).upper()}"),
    # "9am", "9 PM", "11am"
    (re.compile(r'(\d{1,2})\s*(AM|PM)', re.IGNORECASE),
     lambda m: f"{int(m.group(1))}:00 {m.group(2).upper()}"),
    # "14:30", "9:00" (24-hour or bare HH:MM)
    (re.compile(r'\b(\d{1,2}):(\d{2})\b'),
     lambda m: _from_24h(int(m.group(1)), int(m.group(2)))),
]


def _from_24h(h: int, m: int) -> str:
    if h == 0:
        return f"12:{m:02d} AM"
    if h < 12:
        return f"{h}:{m:02d} AM"
    if h == 12:
        return f"12:{m:02d} PM"
    return f"{h - 12}:{m:02d} PM"


def _normalize_time(raw: str) -> str:
    """Return a clean 'H:MM AM/PM' string, or '' if nothing recognizable."""
    if not raw:
        return ""
    for pattern, fmt in _TIME_RE:
        match = pattern.search(raw)
        if match:
            return fmt(match)
    return ""  # gibberish → store empty → UI shows "Anytime"


def handle(entities: dict, reply: str) -> AgentResponse:
    text = str(entities.get("text", "Reminder")).strip()
    time_str = _normalize_time(str(entities.get("time", "")).strip())

    row_id = insert_reminder(text=text, time=time_str)

    return AgentResponse(
        reply=reply,
        action_type="set_reminder",
        action_payload={
            "id": row_id,
            "text": text,
            "time": time_str,
        },
    )
