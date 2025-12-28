"""
Async Worker Pool

Manages parallel download workers with:
- Configurable concurrency
- Worker health monitoring
- Graceful shutdown
- Automatic restart on failure
"""

import asyncio
from typing import Optional, Callable, Any
from datetime import datetime

from loguru import logger

from app.config import settings
from app.core.queue_manager import queue_manager
from app.core.download_engine import download_engine


class Worker:
    """Individual worker for processing download jobs."""

    def __init__(self, worker_id: int, worker_pool: "WorkerPool"):
        self.id = worker_id
        self.name = f"worker-{worker_id}"
        self.pool = worker_pool
        self.running = False
        self.current_job: Optional[str] = None
        self.jobs_completed = 0
        self.jobs_failed = 0
        self.started_at: Optional[datetime] = None
        self._task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        """Start the worker."""
        if self.running:
            return

        self.running = True
        self.started_at = datetime.utcnow()
        self._task = asyncio.create_task(self._run())
        logger.info(f"{self.name} started")

    async def stop(self) -> None:
        """Stop the worker gracefully."""
        self.running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        logger.info(f"{self.name} stopped (completed: {self.jobs_completed}, failed: {self.jobs_failed})")

    async def _run(self) -> None:
        """Main worker loop."""
        while self.running:
            try:
                # Get next job from queue
                job = await queue_manager.dequeue()

                if not job:
                    # No jobs available, wait and retry
                    await asyncio.sleep(1)
                    continue

                self.current_job = job["id"]
                logger.info(f"{self.name} processing job {job['id'][:8]}")

                try:
                    # Process the job
                    result = await self._process_job(job)

                    if result.get("success"):
                        await queue_manager.complete(job["id"], result)
                        self.jobs_completed += 1
                    else:
                        await queue_manager.fail(job["id"], result.get("error", "Unknown error"))
                        self.jobs_failed += 1

                except Exception as e:
                    logger.exception(f"{self.name} error processing job {job['id'][:8]}: {e}")
                    await queue_manager.fail(job["id"], str(e))
                    self.jobs_failed += 1

                finally:
                    self.current_job = None

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.exception(f"{self.name} unexpected error: {e}")
                await asyncio.sleep(5)  # Backoff on unexpected errors

    async def _process_job(self, job: dict) -> dict:
        """
        Process a single download job.

        This is the main job processing logic.
        """
        from app.core.platform_router import platform_registry
        from pathlib import Path

        url = job["url"]
        platform_id = job.get("platform_id", "generic")
        options = job.get("options", {})

        # Get platform handler
        handler = platform_registry.get_handler(platform_id)

        if not handler:
            # Use generic handler
            handler = platform_registry.get_handler("generic")

        if not handler:
            return {"success": False, "error": f"No handler for platform: {platform_id}"}

        # Progress callback
        async def on_progress(progress):
            await queue_manager.update_progress(
                job["id"],
                progress.percent,
                progress.speed,
                progress.eta,
            )
            # Notify WebSocket subscribers
            if self.pool.progress_callback:
                await self.pool.progress_callback(job["id"], progress.to_dict())

        try:
            # Execute download via platform handler
            result = await handler.download(url, options, on_progress)
            return result

        except Exception as e:
            logger.error(f"Handler error for {platform_id}: {e}")
            return {"success": False, "error": str(e)}

    @property
    def status(self) -> dict:
        """Get worker status."""
        return {
            "id": self.id,
            "name": self.name,
            "running": self.running,
            "current_job": self.current_job,
            "jobs_completed": self.jobs_completed,
            "jobs_failed": self.jobs_failed,
            "uptime": (datetime.utcnow() - self.started_at).total_seconds() if self.started_at else 0,
        }


class WorkerPool:
    """
    Pool of async workers for parallel job processing.

    Manages multiple workers with health monitoring and graceful shutdown.
    """

    def __init__(self, num_workers: Optional[int] = None):
        self.num_workers = num_workers or settings.download_workers
        self.workers: list[Worker] = []
        self.running = False
        self.progress_callback: Optional[Callable] = None

    async def start(self) -> None:
        """Start all workers."""
        if self.running:
            logger.warning("Worker pool already running")
            return

        self.running = True

        # Create and start workers
        for i in range(self.num_workers):
            worker = Worker(i, self)
            self.workers.append(worker)
            await worker.start()

        logger.info(f"Worker pool started with {self.num_workers} workers")

    async def stop(self) -> None:
        """Stop all workers gracefully."""
        self.running = False

        # Stop all workers
        stop_tasks = [worker.stop() for worker in self.workers]
        await asyncio.gather(*stop_tasks, return_exceptions=True)

        self.workers.clear()
        logger.info("Worker pool stopped")

    async def scale(self, num_workers: int) -> None:
        """Scale the number of workers."""
        current = len(self.workers)

        if num_workers > current:
            # Add workers
            for i in range(current, num_workers):
                worker = Worker(i, self)
                self.workers.append(worker)
                if self.running:
                    await worker.start()
            logger.info(f"Scaled up to {num_workers} workers")

        elif num_workers < current:
            # Remove workers
            workers_to_remove = self.workers[num_workers:]
            self.workers = self.workers[:num_workers]

            for worker in workers_to_remove:
                await worker.stop()
            logger.info(f"Scaled down to {num_workers} workers")

        self.num_workers = num_workers

    def set_progress_callback(self, callback: Callable) -> None:
        """Set callback for progress updates (for WebSocket broadcasting)."""
        self.progress_callback = callback

    @property
    def status(self) -> dict:
        """Get pool status."""
        return {
            "running": self.running,
            "num_workers": self.num_workers,
            "active_workers": sum(1 for w in self.workers if w.running),
            "busy_workers": sum(1 for w in self.workers if w.current_job),
            "total_completed": sum(w.jobs_completed for w in self.workers),
            "total_failed": sum(w.jobs_failed for w in self.workers),
            "workers": [w.status for w in self.workers],
        }


# Singleton instance
worker_pool = WorkerPool()
