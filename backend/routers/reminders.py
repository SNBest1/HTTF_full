"""
GET /reminders — returns all reminders from SQLite, most recent first.
DELETE /reminders/{reminder_id} — removes a reminder by id.
"""

from fastapi import APIRouter, HTTPException

from models.schemas import ReminderItem, RemindersResponse, DeleteReminderResponse
from db.database import get_reminders, delete_reminder

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


@router.delete("/reminders/{reminder_id}", response_model=DeleteReminderResponse)
def remove_reminder(reminder_id: int) -> DeleteReminderResponse:
    deleted = delete_reminder(reminder_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return DeleteReminderResponse(deleted=True, id=reminder_id)
