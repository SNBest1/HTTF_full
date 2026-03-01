"""
reminder_tool — handles 'set_reminder' intent.

Writes the reminder into the SQLite reminders table and returns a confirmation payload.
"""

from models.schemas import AgentResponse
from db.database import insert_reminder


def handle(entities: dict, reply: str) -> AgentResponse:
    text = entities.get("text", "Reminder").strip()
    time_str = entities.get("time", "").strip()

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
