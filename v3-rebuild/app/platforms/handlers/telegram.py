"""
Telegram Platform Handler

Supports:
- Public channel posts
- Media files (requires bot token)
- Documents
"""

import asyncio
import re
from pathlib import Path
from typing import Optional, Callable

import httpx
from loguru import logger

from app.core.platform_router import BasePlatformHandler, PlatformInfo
from app.core.download_engine import download_engine, DownloadProgress
from app.config import settings


class TelegramHandler(BasePlatformHandler):
    """Handler for Telegram content downloads."""

    id = "telegram"
    name = "Telegram"
    icon = "telegram"
    category = "messaging"

    requires_auth = True  # Bot token required
    supports_quality_selection = False
    supports_subtitles = False
    supports_playlists = False
    supports_channels = True

    rate_limit_rpm = 30

    url_patterns = [
        r"(?:https?://)?t\.me/(?P<channel>[\w]+)/(?P<post_id>\d+)",
        r"(?:https?://)?telegram\.me/(?P<channel>[\w]+)/(?P<post_id>\d+)",
        r"(?:https?://)?t\.me/c/(?P<channel_id>\d+)/(?P<post_id>\d+)",
        r"(?:https?://)?t\.me/(?P<channel>[\w]+)/?$",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Detect Telegram URL."""
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                groups = match.groupdict()

                if "post_id" in groups:
                    url_type = "post"
                else:
                    url_type = "channel"

                return PlatformInfo(
                    id=cls.id,
                    name=cls.name,
                    category=cls.category,
                    icon=cls.icon,
                    url_type=url_type,
                    metadata={k: v for k, v in groups.items() if v},
                )
        return None

    async def download(
        self,
        url: str,
        options: dict,
        progress_callback: Optional[Callable] = None,
    ) -> dict:
        """Download Telegram content using yt-dlp."""
        try:
            output_dir = settings.downloads_dir / "telegram"
            output_dir.mkdir(parents=True, exist_ok=True)

            output_template = str(output_dir / "%(channel)s_%(id)s.%(ext)s")

            # Use yt-dlp for Telegram
            args = [
                settings.ytdlp_path,
                "--format", "best",
                "--output", output_template,
                "--newline",
                "--progress",
            ]

            args.append(url)

            proc = await asyncio.create_subprocess_exec(
                *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )

            output_file = None
            last_progress = 0

            async for line in proc.stdout:
                line_str = line.decode().strip()

                if "[download]" in line_str:
                    progress_match = re.search(r"(\d+\.?\d*)%", line_str)
                    if progress_match:
                        progress = float(progress_match.group(1))
                        if progress_callback and progress > last_progress:
                            await progress_callback(DownloadProgress(
                                percent=progress,
                                status="downloading",
                            ))
                            last_progress = progress

                if "[download] Destination:" in line_str:
                    output_file = line_str.split("Destination:")[-1].strip()

            await proc.wait()

            if proc.returncode != 0:
                return {"success": False, "error": "Telegram download failed"}

            return {
                "success": True,
                "file_path": output_file,
                "platform": self.id,
            }

        except Exception as e:
            logger.exception(f"Telegram download error: {e}")
            return {"success": False, "error": str(e)}

    async def get_info(self, url: str) -> dict:
        """Get Telegram content info."""
        info = self.can_handle(url)
        if not info:
            return {"success": False, "error": "Invalid Telegram URL"}

        return {
            "success": True,
            "type": info.url_type,
            "metadata": info.metadata,
        }
