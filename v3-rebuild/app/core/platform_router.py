"""
Platform Router and Registry

Detects platforms from URLs and routes downloads to appropriate handlers.

Supports 36+ platforms including:
- Video: YouTube, TikTok, Vimeo, Dailymotion, Twitch
- Social: Instagram, Twitter, Reddit, Pinterest, Facebook
- AI/ML: CivitAI, HuggingFace, GitHub
- News: 200+ news sites
- Archives: Archive.org, Wayback Machine
- Special: Telegram, Tor/Onion sites
"""

import re
from typing import Optional, Type
from dataclasses import dataclass, field

from loguru import logger


@dataclass
class PlatformInfo:
    """Information about a detected platform."""
    id: str
    name: str
    category: str
    icon: str = ""
    confidence: float = 1.0
    url_type: str = "unknown"  # video, playlist, channel, profile, etc.
    metadata: dict = field(default_factory=dict)


class BasePlatformHandler:
    """
    Base class for platform handlers.

    All platform handlers should inherit from this class and implement
    the required methods.
    """

    # Platform identification
    id: str = "generic"
    name: str = "Generic"
    icon: str = "download"
    category: str = "general"

    # Capabilities
    requires_auth: bool = False
    supports_quality_selection: bool = True
    supports_subtitles: bool = False
    supports_playlists: bool = False
    supports_channels: bool = False

    # Rate limiting
    rate_limit_rpm: int = 60

    # URL patterns (regex)
    url_patterns: list[str] = []

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """
        Check if this handler can process the given URL.

        Returns PlatformInfo if URL matches, None otherwise.
        """
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                return PlatformInfo(
                    id=cls.id,
                    name=cls.name,
                    category=cls.category,
                    icon=cls.icon,
                    metadata=match.groupdict() if match.lastgroup else {},
                )
        return None

    async def download(
        self,
        url: str,
        options: dict,
        progress_callback=None,
    ) -> dict:
        """
        Download content from the URL.

        Args:
            url: URL to download
            options: Download options (quality, format, etc.)
            progress_callback: Async callback for progress updates

        Returns:
            dict with success status and result/error
        """
        raise NotImplementedError("Subclasses must implement download()")

    async def get_info(self, url: str) -> dict:
        """
        Get information about the content without downloading.

        Returns:
            dict with title, thumbnail, duration, etc.
        """
        raise NotImplementedError("Subclasses must implement get_info()")

    async def validate_api_key(self, key: str) -> dict:
        """
        Validate an API key for this platform.

        Returns:
            dict with valid (bool), error (str), and details
        """
        return {"valid": True, "error": None}


class PlatformRegistry:
    """
    Registry of all platform handlers.

    Manages platform detection and handler lookup.
    """

    def __init__(self):
        self._handlers: dict[str, Type[BasePlatformHandler]] = {}
        self._detection_order: list[str] = []

    def register(
        self,
        handler_class: Type[BasePlatformHandler],
        priority: int = 50,
    ) -> None:
        """
        Register a platform handler.

        Args:
            handler_class: Handler class to register
            priority: Detection priority (lower = checked first)
        """
        self._handlers[handler_class.id] = handler_class

        # Insert in priority order
        if handler_class.id not in self._detection_order:
            self._detection_order.append(handler_class.id)
            self._detection_order.sort(
                key=lambda x: self._get_priority(x, priority)
            )

        logger.debug(f"Registered platform handler: {handler_class.id}")

    def _get_priority(self, platform_id: str, default: int) -> int:
        """Get detection priority for a platform."""
        # Special platforms checked first
        priorities = {
            "onion": 10,
            "archive": 15,
            "news": 20,
            "youtube": 30,
            "instagram": 35,
            "tiktok": 35,
            "twitter": 35,
            "generic": 100,  # Always last
        }
        return priorities.get(platform_id, default)

    def detect(self, url: str) -> Optional[PlatformInfo]:
        """
        Detect platform from URL.

        Returns PlatformInfo for the first matching handler.
        """
        for platform_id in self._detection_order:
            handler = self._handlers.get(platform_id)
            if handler:
                info = handler.can_handle(url)
                if info:
                    logger.debug(f"Detected platform: {info.id} for {url[:50]}")
                    return info

        return None

    def get_handler(self, platform_id: str) -> Optional[BasePlatformHandler]:
        """Get handler instance by platform ID."""
        handler_class = self._handlers.get(platform_id)
        if handler_class:
            return handler_class()
        return None

    def get_all_platforms(self) -> list[dict]:
        """Get information about all registered platforms."""
        platforms = []
        for platform_id, handler_class in self._handlers.items():
            platforms.append({
                "id": handler_class.id,
                "name": handler_class.name,
                "icon": handler_class.icon,
                "category": handler_class.category,
                "requires_auth": handler_class.requires_auth,
                "supports_quality_selection": handler_class.supports_quality_selection,
                "supports_subtitles": handler_class.supports_subtitles,
                "supports_playlists": handler_class.supports_playlists,
                "supports_channels": handler_class.supports_channels,
            })
        return platforms

    def load_all_platforms(self) -> int:
        """
        Load all platform handlers.

        Returns number of handlers loaded.
        """
        # Import all platform handlers
        from app.platforms.handlers import (
            youtube,
            instagram,
            tiktok,
            twitter,
            reddit,
            github,
            civitai,
            huggingface,
            telegram,
            news,
            archive,
            generic,
        )

        # Register handlers
        handlers = [
            youtube.YouTubeHandler,
            instagram.InstagramHandler,
            tiktok.TikTokHandler,
            twitter.TwitterHandler,
            reddit.RedditHandler,
            github.GitHubHandler,
            civitai.CivitAIHandler,
            huggingface.HuggingFaceHandler,
            telegram.TelegramHandler,
            news.NewsHandler,
            archive.ArchiveHandler,
            generic.GenericHandler,  # Always register last
        ]

        for handler in handlers:
            self.register(handler)

        logger.info(f"Loaded {len(self._handlers)} platform handlers")
        return len(self._handlers)


# Singleton registry
platform_registry = PlatformRegistry()
