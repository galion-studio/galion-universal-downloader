"""API route modules."""

from app.api.routes import downloads, health, platforms, queue, files, transcribe, keys

__all__ = [
    "downloads",
    "health",
    "platforms",
    "queue",
    "files",
    "transcribe",
    "keys",
]
