"""FastAPI dependencies for injection."""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory
from app.core.queue_manager import queue_manager
from app.core.platform_router import platform_registry


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_queue_manager():
    """Get queue manager instance."""
    return queue_manager


def get_platform_registry():
    """Get platform registry instance."""
    return platform_registry
