from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.orm_models import Task, Schedule
from services.calendar_service import find_free_slot
from datetime import datetime

async def run_scheduler_agent(task_id: int, db: AsyncSession):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()

    if not task:
        return {"error": "Task not found"}

    if task.status.value != "approved":
        return {"error": "Task is not approved yet"}

    existing = await db.execute(
        select(Schedule).where(Schedule.task_id == task_id)
    )
    existing_schedule = existing.scalars().first()

    if existing_schedule:
        return {
            "message": "Already scheduled",
            "start_time": existing_schedule.start_time,
            "end_time": existing_schedule.end_time
        }

    start_time, end_time = await find_free_slot(task.estimated_minutes, db)

    schedule = Schedule(
        task_id=task.id,
        start_time=start_time,
        end_time=end_time,
        is_rescheduled=False
    )

    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    return {
        "task_id": task_id,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "scheduled": True
    }