from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.orm_models import Email, Task
from models.schemas import PriorityEnum
from services.ai_service import process_email

async def run_email_agent(sender: str, subject: str, body: str, db: AsyncSession):
    email_record = Email(
        sender=sender,
        subject=subject,
        body=body,
        processed=False
    )
    db.add(email_record)
    await db.commit()
    await db.refresh(email_record)

    ai_result = process_email(sender, subject, body)

    tasks_created = []

    for task_data in ai_result.get("tasks", []):
        title = task_data.get("title", "").strip()

        existing = await db.execute(
            select(Task).where(
                Task.title == title,
                Task.email.has(sender=sender)
            )
        )
        if existing.scalars().first():
            continue

        priority_raw = task_data.get("priority", "medium").lower()
        if priority_raw not in ["high", "medium", "low"]:
            priority_raw = "medium"

        task = Task(
            email_id=email_record.id,
            title=title,
            description=task_data.get("description", ""),
            priority=PriorityEnum(priority_raw),
            estimated_minutes=task_data.get("estimated_minutes", 30)
        )
        db.add(task)
        tasks_created.append(task)

    email_record.processed = True
    await db.commit()

    for task in tasks_created:
        await db.refresh(task)

    return {
        "email_id": email_record.id,
        "summary": ai_result.get("summary", ""),
        "tasks_created": len(tasks_created)
    }