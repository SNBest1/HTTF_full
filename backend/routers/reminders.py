"""
GET /reminders — returns all reminders from SQLite, most recent first.
"""

from fastapi import APIRouter

from models.schemas import ReminderItem, RemindersResponse
from db.database import get_reminders

router = APIRouter()


@router.get("/reminders", response_model=RemindersResponse)
def list_reminders() -> RemindersResponse:
    rows = get_reminders()
    return RemindersResponse(
        reminders=[
            ReminderItem(
                id=row["id"],
                text=row["text"],
                time=row["time"],
                created_at=row["created_at"],
            )
            for row in rows
        ]
    )
