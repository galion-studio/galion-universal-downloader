"""
Galion Universal Downloader v3 - Main Application Entry Point

FastAPI application with:
- REST API endpoints for downloads, platforms, and queue management
- WebSocket support for real-time progress updates
- Background worker integration via Redis/ARQ
- GPU-accelerated AI transcription support
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.config import settings
from app.api.routes import downloads, health, platforms, queue, files, transcribe, keys
from app.api.websocket import websocket_router
from app.core.platform_router import platform_registry
from app.db.session import init_db, close_db
from app.core.queue_manager import queue_manager
from app.core.worker_pool import worker_pool


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    Handles startup and shutdown tasks:
    - Initialize database connections
    - Start Redis queue manager
    - Initialize worker pool
    - Load platform handlers
    - Cleanup on shutdown
    """
    logger.info(f"Starting Galion Universal Downloader v3 ({settings.galion_env})")

    # Ensure directories exist
    settings.ensure_directories()
    logger.info(f"Downloads directory: {settings.downloads_dir.absolute()}")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Initialize Redis queue
    try:
        await queue_manager.connect()
        logger.info("Redis queue manager connected")
    except Exception as e:
        logger.warning(f"Redis connection failed, running without queue: {e}")

    # Initialize worker pool
    try:
        await worker_pool.start()
        logger.info(f"Worker pool started with {settings.download_workers} workers")
    except Exception as e:
        logger.warning(f"Worker pool initialization failed: {e}")

    # Load platform handlers
    platform_count = platform_registry.load_all_platforms()
    logger.info(f"Loaded {platform_count} platform handlers")

    yield

    # Shutdown
    logger.info("Shutting down Galion Universal Downloader...")

    # Stop workers gracefully
    await worker_pool.stop()
    logger.info("Worker pool stopped")

    # Close Redis
    await queue_manager.disconnect()
    logger.info("Redis disconnected")

    # Close database
    await close_db()
    logger.info("Database closed")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns configured FastAPI instance with all routes and middleware.
    """
    app = FastAPI(
        title="Galion Universal Downloader",
        description=(
            "Universal content downloader with 36+ platform support, "
            "resumable downloads, and GPU-accelerated AI transcription."
        ),
        version="3.0.0",
        docs_url=f"{settings.galion_api_prefix}/docs" if settings.galion_debug else None,
        redoc_url=f"{settings.galion_api_prefix}/redoc" if settings.galion_debug else None,
        openapi_url=f"{settings.galion_api_prefix}/openapi.json" if settings.galion_debug else None,
        lifespan=lifespan,
    )

    # === CORS Middleware ===
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # === Global Exception Handler ===
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle uncaught exceptions globally."""
        logger.exception(f"Unhandled exception: {exc}")

        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "details": str(exc) if settings.galion_debug else None,
                }
            },
        )

    # === API Routes ===
    api_prefix = settings.galion_api_prefix

    # Health & status (no prefix for health check)
    app.include_router(health.router, prefix=api_prefix, tags=["Health"])

    # Core functionality
    app.include_router(downloads.router, prefix=api_prefix, tags=["Downloads"])
    app.include_router(platforms.router, prefix=api_prefix, tags=["Platforms"])
    app.include_router(queue.router, prefix=api_prefix, tags=["Queue"])
    app.include_router(files.router, prefix=api_prefix, tags=["Files"])
    app.include_router(transcribe.router, prefix=api_prefix, tags=["Transcription"])
    app.include_router(keys.router, prefix=api_prefix, tags=["API Keys"])

    # WebSocket
    app.include_router(websocket_router, tags=["WebSocket"])

    # === Root endpoint ===
    @app.get("/", include_in_schema=False)
    async def root():
        """Root endpoint with basic info."""
        return {
            "name": "Galion Universal Downloader",
            "version": "3.0.0",
            "status": "running",
            "docs": f"{settings.galion_api_prefix}/docs" if settings.galion_debug else None,
            "api": settings.galion_api_prefix,
        }

    return app


# Create application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.galion_host,
        port=settings.galion_port,
        reload=settings.is_development,
        workers=1 if settings.is_development else 4,
        log_level=settings.log_level.lower(),
    )
