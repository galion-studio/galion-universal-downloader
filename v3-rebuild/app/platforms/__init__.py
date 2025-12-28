"""Platform handlers for Galion Universal Downloader."""

from app.platforms.base import BasePlatformHandler, PlatformInfo
from app.platforms.registry import platform_registry

__all__ = [
    "BasePlatformHandler",
    "PlatformInfo",
    "platform_registry",
]
