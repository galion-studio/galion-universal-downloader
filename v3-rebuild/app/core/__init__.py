"""Core components for Galion Universal Downloader."""

from app.core.download_engine import DownloadEngine
from app.core.queue_manager import QueueManager, queue_manager
from app.core.worker_pool import WorkerPool, worker_pool
from app.core.platform_router import PlatformRouter, platform_registry

__all__ = [
    "DownloadEngine",
    "QueueManager",
    "queue_manager",
    "WorkerPool",
    "worker_pool",
    "PlatformRouter",
    "platform_registry",
]
