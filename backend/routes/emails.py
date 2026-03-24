from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.database import get_db
from models.orm_models import Email
from models.schemas import EmailIngest, EmailOut
from agents.email_agent import run_email_agent
from services.email_service import fetch_unread_emails
from typing import List

router = APIRouter()

@router.post("/ingest")
async def ingest_email(
    payload: EmailIngest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await run_email_agent(
        sender=payload.sender,
        subject=payload.subject,
        body=payload.body,
        db=db
    )
    return result

@router.get("/", response_model=List[EmailOut])
async def get_all_emails(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Email).order_by(Email.received_at.desc()))
    return result.scalars().all()

@router.get("/{email_id}", response_model=EmailOut)
async def get_email(email_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Email).where(Email.id == email_id))
    email = result.scalars().first()
    if not email:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@router.post("/poll")
async def poll_gmail(db: AsyncSession = Depends(get_db)):
    emails = fetch_unread_emails()
    results = []

    for e in emails:
        result = await run_email_agent(
            sender=e["sender"],
            subject=e["subject"],
            body=e["body"],
            db=db
        )
        results.append(result)

    return {"fetched": len(emails), "results": results}