"""Health check endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.api.deps import get_db
from app.core.queue_manager import queue_manager
from app.core.worker_pool import worker_pool
from app.config import settings
from app import __version__

router = APIRouter()

# Track startup time
_startup_time = datetime.utcnow()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint.

    Returns service status and component health.
    """
    # Check database
    db_healthy = True
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_healthy = False

    # Check Redis
    redis_healthy = queue_manager.is_connected

    # Calculate uptime
    uptime = (datetime.utcnow() - _startup_time).total_seconds()

    return {
        "status": "healthy" if db_healthy and redis_healthy else "degraded",
        "version": __version__,
        "environment": settings.galion_env,
        "database": db_healthy,
        "redis": redis_healthy,
        "workers": len([w for w in worker_pool.workers if w.running]),
        "uptime": uptime,
    }


@router.get("/status")
async def system_status():
    """
    Detailed system status.

    Returns system information and supported platforms.
    """
    from app.core.platform_router import platform_registry

    platforms = platform_registry.get_all_platforms()

    return {
        "version": __version__,
        "environment": settings.galion_env,
        "debug": settings.galion_debug,
        "workers": worker_pool.status,
        "queue": await queue_manager.get_stats() if queue_manager.is_connected else {"connected": False},
        "platforms": {
            "total": len(platforms),
            "categories": list(set(p["category"] for p in platforms)),
        },
        "storage": {
            "downloads_dir": str(settings.downloads_dir),
            "max_storage_gb": settings.max_storage_gb,
        },
    }
