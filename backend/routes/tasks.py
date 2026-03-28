from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.database import get_db
from models.orm_models import Task
from models.schemas import TaskOut, TaskUpdate
from agents.scheduler_agent import run_scheduler_agent
from agents.notification_agent import run_notification_agent
from typing import List

router = APIRouter()

@router.get("/", response_model=List[TaskOut])
async def get_all_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).order_by(Task.created_at.desc()))
    return result.scalars().all()

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: int,
    updates: TaskUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if updates.status:
        task.status = updates.status
    if updates.priority:
        task.priority = updates.priority
    if updates.title:
        task.title = updates.title
    if updates.description:
        task.description = updates.description
    if updates.estimated_minutes:
        task.estimated_minutes = updates.estimated_minutes

    await db.commit()
    await db.refresh(task)

    if task.status.value == "approved":
        background_tasks.add_task(run_scheduler_agent, task_id, db)

    if task.status.value == "completed":
        background_tasks.add_task(run_notification_agent, task_id, db)

    return task

@router.delete("/{task_id}")
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted"}

@router.get("/{task_id}/detail")
async def get_task_detail(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    from models.orm_models import Email, Schedule, Notification
    email_result = await db.execute(select(Email).where(Email.id == task.email_id))
    email = email_result.scalars().first()

    schedule_result = await db.execute(select(Schedule).where(Schedule.task_id == task_id))
    schedule = schedule_result.scalars().first()

    notif_result = await db.execute(select(Notification).where(Notification.task_id == task_id))
    notification = notif_result.scalars().first()

    return {
        "task": {
    "id": task.id,
    "email_id": task.email_id,
    "title": task.title,
    "description": task.description,
    "priority": task.priority,
    "status": task.status,
    "estimated_minutes": task.estimated_minutes,
    "created_at": task.created_at,
},
        "email": {
    "id": email.id if email else None,
    "sender": email.sender if email else None,
    "subject": email.subject if email else None,
    "body": email.body if email else None,
    "received_at": email.received_at if email else None,
} if email else None,
        "schedule": {
            "start_time": schedule.start_time if schedule else None,
            "end_time": schedule.end_time if schedule else None,
        } if schedule else None,
        "notification": {
            "sent_at": notification.sent_at if notification else None,
            "recipient": notification.recipient_email if notification else None,
        } if notification else None,
    }