"""
Platform handlers for all supported platforms.

Each handler implements the BasePlatformHandler interface
for a specific platform or category of platforms.
"""

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

__all__ = [
    "youtube",
    "instagram",
    "tiktok",
    "twitter",
    "reddit",
    "github",
    "civitai",
    "huggingface",
    "telegram",
    "news",
    "archive",
    "generic",
]
