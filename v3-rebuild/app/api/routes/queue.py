"""Queue management endpoints."""

from fastapi import APIRouter

from app.schemas.common import QueueStats, SuccessResponse
from app.core.queue_manager import queue_manager
from app.core.worker_pool import worker_pool

router = APIRouter()


@router.get("/queue", response_model=QueueStats)
async def get_queue_stats():
    """
    Get queue statistics.

    Returns current queue state and job counts.
    """
    stats = await queue_manager.get_stats()
    return QueueStats(**stats)


@router.post("/queue/pause", response_model=SuccessResponse)
async def pause_queue():
    """
    Pause queue processing.

    Active downloads will complete, but no new jobs will start.
    """
    await queue_manager.pause()
    return SuccessResponse(message="Queue paused")


@router.post("/queue/resume", response_model=SuccessResponse)
async def resume_queue():
    """
    Resume queue processing.
    """
    await queue_manager.resume()
    return SuccessResponse(message="Queue resumed")


@router.post("/queue/clear", response_model=SuccessResponse)
async def clear_completed():
    """
    Clear completed jobs from queue.
    """
    count = await queue_manager.clear_completed()
    return SuccessResponse(message=f"Cleared {count} completed jobs")


@router.get("/workers")
async def get_workers():
    """
    Get worker pool status.
    """
    return worker_pool.status


@router.post("/workers/scale")
async def scale_workers(num_workers: int):
    """
    Scale the number of workers.
    """
    await worker_pool.scale(num_workers)
    return SuccessResponse(
        message=f"Scaled to {num_workers} workers",
        data=worker_pool.status,
    )
