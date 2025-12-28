"""
Redis-based Queue Manager

Manages download job queue with:
- Priority queuing (0-10 levels)
- Job persistence and recovery
- Deduplication by URL hash
- Real-time statistics
- Dead letter queue for failed jobs
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional, Any
from uuid import uuid4
import hashlib

from redis import asyncio as aioredis
from loguru import logger

from app.config import settings


class QueueManager:
    """
    Redis-based job queue manager.

    Uses Redis sorted sets for priority queuing and hashes for job data.

    Redis Key Structure:
        galion:queue:pending   - Sorted set of pending job IDs (score = priority + timestamp)
        galion:queue:active    - Set of currently processing job IDs
        galion:queue:completed - List of recently completed job IDs (auto-expire)
        galion:queue:failed    - List of failed job IDs (dead letter queue)
        galion:jobs:{job_id}   - Hash containing job data
        galion:urls:{url_hash} - Set for URL deduplication
        galion:stats           - Hash of queue statistics
    """

    # Redis key prefixes
    PREFIX = "galion"
    QUEUE_PENDING = f"{PREFIX}:queue:pending"
    QUEUE_ACTIVE = f"{PREFIX}:queue:active"
    QUEUE_COMPLETED = f"{PREFIX}:queue:completed"
    QUEUE_FAILED = f"{PREFIX}:queue:failed"
    JOBS_PREFIX = f"{PREFIX}:jobs"
    URLS_PREFIX = f"{PREFIX}:urls"
    STATS_KEY = f"{PREFIX}:stats"

    # TTLs
    COMPLETED_TTL = 3600 * 24  # 24 hours
    JOB_TTL = 3600 * 24 * 7  # 7 days

    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None
        self._connected = False
        self._paused = False

    @property
    def is_connected(self) -> bool:
        return self._connected and self._redis is not None

    @property
    def is_paused(self) -> bool:
        return self._paused

    async def connect(self) -> None:
        """Connect to Redis."""
        try:
            self._redis = await aioredis.from_url(
                settings.redis_url,
                password=settings.redis_password,
                encoding="utf-8",
                decode_responses=True,
            )
            # Test connection
            await self._redis.ping()
            self._connected = True
            logger.info(f"Connected to Redis: {settings.redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._connected = False
            raise

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._redis:
            await self._redis.close()
            self._redis = None
            self._connected = False
            logger.info("Disconnected from Redis")

    def _job_key(self, job_id: str) -> str:
        """Get Redis key for a job."""
        return f"{self.JOBS_PREFIX}:{job_id}"

    def _url_hash(self, url: str) -> str:
        """Generate hash for URL deduplication."""
        return hashlib.sha256(url.encode()).hexdigest()[:16]

    async def enqueue(
        self,
        url: str,
        platform_id: Optional[str] = None,
        options: Optional[dict] = None,
        priority: int = 5,
        deduplicate: bool = True,
    ) -> Optional[str]:
        """
        Add a download job to the queue.

        Args:
            url: URL to download
            platform_id: Detected platform ID
            options: Download options
            priority: Priority level (0-10, higher = more priority)
            deduplicate: Check for existing jobs with same URL

        Returns:
            Job ID if created, None if duplicate
        """
        if not self.is_connected:
            logger.warning("Queue not connected, cannot enqueue")
            return None

        # Deduplication check
        if deduplicate:
            url_hash = self._url_hash(url)
            existing = await self._redis.get(f"{self.URLS_PREFIX}:{url_hash}")
            if existing:
                logger.info(f"Duplicate URL detected, existing job: {existing}")
                return None

        # Create job
        job_id = str(uuid4())
        now = datetime.utcnow()

        job_data = {
            "id": job_id,
            "url": url,
            "url_hash": self._url_hash(url),
            "platform_id": platform_id or "unknown",
            "options": json.dumps(options or {}),
            "status": "pending",
            "priority": priority,
            "created_at": now.isoformat(),
            "progress": 0,
            "error": "",
        }

        # Store job data
        await self._redis.hset(self._job_key(job_id), mapping=job_data)
        await self._redis.expire(self._job_key(job_id), self.JOB_TTL)

        # Add to pending queue with priority score
        # Score = (10 - priority) * 1e12 + timestamp for priority + FIFO
        score = (10 - priority) * 1e12 + now.timestamp()
        await self._redis.zadd(self.QUEUE_PENDING, {job_id: score})

        # Store URL hash for deduplication
        if deduplicate:
            await self._redis.setex(
                f"{self.URLS_PREFIX}:{url_hash}",
                self.JOB_TTL,
                job_id,
            )

        # Update stats
        await self._redis.hincrby(self.STATS_KEY, "total_queued", 1)

        logger.info(f"Job {job_id} enqueued with priority {priority}")
        return job_id

    async def dequeue(self) -> Optional[dict]:
        """
        Get the next job from the queue.

        Returns:
            Job data dict or None if queue is empty/paused
        """
        if not self.is_connected or self._paused:
            return None

        # Get highest priority job (lowest score)
        result = await self._redis.zpopmin(self.QUEUE_PENDING, count=1)

        if not result:
            return None

        job_id, _ = result[0]

        # Move to active queue
        await self._redis.sadd(self.QUEUE_ACTIVE, job_id)

        # Get job data
        job_data = await self._redis.hgetall(self._job_key(job_id))

        if not job_data:
            logger.warning(f"Job {job_id} not found in storage")
            await self._redis.srem(self.QUEUE_ACTIVE, job_id)
            return None

        # Update status
        await self._redis.hset(
            self._job_key(job_id),
            mapping={
                "status": "processing",
                "started_at": datetime.utcnow().isoformat(),
            }
        )

        # Parse options
        job_data["options"] = json.loads(job_data.get("options", "{}"))

        return job_data

    async def complete(self, job_id: str, result: dict) -> None:
        """Mark a job as completed."""
        if not self.is_connected:
            return

        # Remove from active
        await self._redis.srem(self.QUEUE_ACTIVE, job_id)

        # Update job data
        await self._redis.hset(
            self._job_key(job_id),
            mapping={
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat(),
                "result": json.dumps(result),
            }
        )

        # Add to completed list (with TTL)
        await self._redis.lpush(self.QUEUE_COMPLETED, job_id)
        await self._redis.ltrim(self.QUEUE_COMPLETED, 0, 999)  # Keep last 1000

        # Update stats
        await self._redis.hincrby(self.STATS_KEY, "total_completed", 1)

        logger.info(f"Job {job_id} completed")

    async def fail(self, job_id: str, error: str, retry: bool = True) -> None:
        """Mark a job as failed."""
        if not self.is_connected:
            return

        # Remove from active
        await self._redis.srem(self.QUEUE_ACTIVE, job_id)

        # Get current retry count
        job_data = await self._redis.hgetall(self._job_key(job_id))
        retry_count = int(job_data.get("retry_count", 0))
        max_retries = int(job_data.get("max_retries", 3))

        if retry and retry_count < max_retries:
            # Re-queue with lower priority
            priority = max(0, int(job_data.get("priority", 5)) - 1)
            retry_count += 1

            await self._redis.hset(
                self._job_key(job_id),
                mapping={
                    "status": "pending",
                    "retry_count": retry_count,
                    "last_error": error,
                    "priority": priority,
                }
            )

            # Add back to pending queue
            score = (10 - priority) * 1e12 + datetime.utcnow().timestamp()
            await self._redis.zadd(self.QUEUE_PENDING, {job_id: score})

            logger.info(f"Job {job_id} retry {retry_count}/{max_retries}")
        else:
            # Move to failed (dead letter queue)
            await self._redis.hset(
                self._job_key(job_id),
                mapping={
                    "status": "failed",
                    "failed_at": datetime.utcnow().isoformat(),
                    "error": error,
                }
            )

            await self._redis.lpush(self.QUEUE_FAILED, job_id)
            await self._redis.hincrby(self.STATS_KEY, "total_failed", 1)

            logger.error(f"Job {job_id} failed permanently: {error}")

    async def get_job(self, job_id: str) -> Optional[dict]:
        """Get job data by ID."""
        if not self.is_connected:
            return None

        job_data = await self._redis.hgetall(self._job_key(job_id))
        if not job_data:
            return None

        job_data["options"] = json.loads(job_data.get("options", "{}"))
        return job_data

    async def update_progress(self, job_id: str, progress: float, speed: float = 0, eta: int = 0) -> None:
        """Update job progress."""
        if not self.is_connected:
            return

        await self._redis.hset(
            self._job_key(job_id),
            mapping={
                "progress": progress,
                "speed": speed,
                "eta": eta,
            }
        )

    async def get_stats(self) -> dict:
        """Get queue statistics."""
        if not self.is_connected:
            return {"connected": False}

        pending_count = await self._redis.zcard(self.QUEUE_PENDING)
        active_count = await self._redis.scard(self.QUEUE_ACTIVE)
        completed_count = await self._redis.llen(self.QUEUE_COMPLETED)
        failed_count = await self._redis.llen(self.QUEUE_FAILED)

        stats = await self._redis.hgetall(self.STATS_KEY)

        return {
            "connected": True,
            "paused": self._paused,
            "pending": pending_count,
            "active": active_count,
            "completed": completed_count,
            "failed": failed_count,
            "total_queued": int(stats.get("total_queued", 0)),
            "total_completed": int(stats.get("total_completed", 0)),
            "total_failed": int(stats.get("total_failed", 0)),
        }

    async def pause(self) -> None:
        """Pause queue processing."""
        self._paused = True
        logger.info("Queue paused")

    async def resume(self) -> None:
        """Resume queue processing."""
        self._paused = False
        logger.info("Queue resumed")

    async def clear_completed(self) -> int:
        """Clear completed jobs from queue."""
        if not self.is_connected:
            return 0

        count = await self._redis.llen(self.QUEUE_COMPLETED)
        await self._redis.delete(self.QUEUE_COMPLETED)
        logger.info(f"Cleared {count} completed jobs")
        return count


# Singleton instance
queue_manager = QueueManager()
