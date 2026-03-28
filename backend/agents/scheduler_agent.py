from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.orm_models import Task, Schedule, Email
from services.calendar_service import find_free_slot
from services.google_calendar_service import create_calendar_event
from datetime import datetime, timedelta

async def run_scheduler_agent(task_id: int, db: AsyncSession):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()

    if not task:
        return {"error": "Task not found"}

    if task.status.value != "approved":
        return {"error": "Task is not approved yet"}

    existing = await db.execute(select(Schedule).where(Schedule.task_id == task_id))
    existing_schedule = existing.scalars().first()
    if existing_schedule:
        return {
            "message": "Already scheduled",
            "start_time": existing_schedule.start_time,
            "end_time": existing_schedule.end_time,
            "meet_link": existing_schedule.meet_link,
        }

    email_result = await db.execute(select(Email).where(Email.id == task.email_id))
    email_record = email_result.scalars().first()

    attendee_email = None
    meet_link_from_email = None
    if email_record:
        sender = email_record.sender
        if "<" in sender:
            attendee_email = sender.split("<")[1].replace(">", "").strip()
        else:
            attendee_email = sender.strip()
        meet_link_from_email = email_record.meet_link

    if task.requested_datetime:
        start_time = task.requested_datetime
        end_time = start_time + timedelta(minutes=task.estimated_minutes)
    else:
        start_time, end_time = await find_free_slot(task.estimated_minutes, db)

    google_event = None
    meet_link = meet_link_from_email
    html_link = None
    google_event_id = None

    try:
        google_event = create_calendar_event(
            title=task.title,
            description=task.description,
            start_time=start_time,
            end_time=end_time,
            attendee_email=attendee_email,
            meet_link=meet_link_from_email,
        )
        if not meet_link:
            meet_link = google_event.get("meet_link")
        html_link = google_event.get("html_link")
        google_event_id = google_event.get("event_id")
    except Exception as e:
        print(f"Google Calendar error: {e}")

    schedule = Schedule(
        task_id=task.id,
        start_time=start_time,
        end_time=end_time,
        google_event_id=google_event_id,
        meet_link=meet_link,
        html_link=html_link,
        is_rescheduled=False
    )

    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    return {
        "task_id": task_id,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "meet_link": meet_link,
        "html_link": html_link,
        "scheduled": True
    }