"""
Twitter/X Platform Handler

Supports:
- Tweets with media
- Videos
- GIFs
- Twitter Spaces (audio)
- Threads
"""

import asyncio
import re
from pathlib import Path
from typing import Optional, Callable

from loguru import logger

from app.core.platform_router import BasePlatformHandler, PlatformInfo
from app.core.download_engine import DownloadProgress
from app.config import settings


class TwitterHandler(BasePlatformHandler):
    """Handler for Twitter/X content downloads."""

    id = "twitter"
    name = "Twitter/X"
    icon = "twitter"
    category = "social"

    requires_auth = False  # Public tweets don't need auth
    supports_quality_selection = True
    supports_subtitles = False
    supports_playlists = False
    supports_channels = True

    rate_limit_rpm = 15  # Twitter is strict

    url_patterns = [
        r"(?:https?://)?(?:www\.)?(?:twitter|x)\.com/(?P<username>\w+)/status/(?P<tweet_id>\d+)",
        r"(?:https?://)?(?:www\.)?(?:twitter|x)\.com/i/spaces/(?P<space_id>[\w]+)",
        r"(?:https?://)?(?:www\.)?(?:twitter|x)\.com/(?P<username>\w+)/?$",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Detect Twitter URL and content type."""
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                groups = match.groupdict()

                if "tweet_id" in groups:
                    url_type = "tweet"
                elif "space_id" in groups:
                    url_type = "space"
                else:
                    url_type = "profile"

                return PlatformInfo(
                    id=cls.id,
                    name=cls.name,
                    category=cls.category,
                    icon=cls.icon,
                    url_type=url_type,
                    metadata=groups,
                )
        return None

    async def download(
        self,
        url: str,
        options: dict,
        progress_callback: Optional[Callable] = None,
    ) -> dict:
        """Download Twitter content using yt-dlp."""
        try:
            output_dir = settings.downloads_dir / "twitter"
            output_dir.mkdir(parents=True, exist_ok=True)

            output_template = str(output_dir / "%(uploader)s_%(id)s.%(ext)s")

            args = [
                settings.ytdlp_path,
                "--format", "best",
                "--output", output_template,
                "--newline",
                "--progress",
            ]

            # Add bearer token if available
            if settings.twitter_bearer_token:
                args.extend(["--add-header", f"Authorization: Bearer {settings.twitter_bearer_token}"])

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
                return {"success": False, "error": "Twitter download failed"}

            return {
                "success": True,
                "file_path": output_file,
                "platform": self.id,
            }

        except Exception as e:
            logger.exception(f"Twitter download error: {e}")
            return {"success": False, "error": str(e)}

    async def get_info(self, url: str) -> dict:
        """Get Twitter content info."""
        try:
            proc = await asyncio.create_subprocess_exec(
                settings.ytdlp_path,
                "--dump-json",
                "--no-download",
                url,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await proc.communicate()

            if proc.returncode != 0:
                return {"success": False, "error": "Could not fetch info"}

            import json
            info = json.loads(stdout.decode())

            return {
                "success": True,
                "title": info.get("title"),
                "uploader": info.get("uploader"),
                "description": info.get("description"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
