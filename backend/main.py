from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.database import engine, Base
from routes import emails, tasks, schedules, auth, settings
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Executive Secretary")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(emails.router, prefix="/emails", tags=["Emails"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(schedules.router, prefix="/schedules", tags=["Schedules"])
app.include_router(settings.router, prefix="/settings", tags=["Settings"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "AI Executive Secretary is running"}