from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

def start_scheduler():
    logger.info("Scheduler ready — polling is manual via /emails/poll endpoint.")

def stop_scheduler():
    pass