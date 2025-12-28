"""
Instagram Platform Handler

Supports:
- Posts (images and videos)
- Reels
- Stories (requires authentication)
- IGTV
- Profile downloads
"""

import asyncio
import re
from pathlib import Path
from typing import Optional, Callable

from loguru import logger

from app.core.platform_router import BasePlatformHandler, PlatformInfo
from app.core.download_engine import DownloadProgress
from app.config import settings


class InstagramHandler(BasePlatformHandler):
    """Handler for Instagram content downloads."""

    id = "instagram"
    name = "Instagram"
    icon = "instagram"
    category = "social"

    requires_auth = True  # Most content requires login
    supports_quality_selection = True
    supports_subtitles = False
    supports_playlists = False
    supports_channels = True  # Profile downloads

    rate_limit_rpm = 10  # Instagram is strict

    url_patterns = [
        r"(?:https?://)?(?:www\.)?instagram\.com/p/(?P<post_id>[\w-]+)",
        r"(?:https?://)?(?:www\.)?instagram\.com/reel/(?P<reel_id>[\w-]+)",
        r"(?:https?://)?(?:www\.)?instagram\.com/stories/(?P<username>[\w.]+)/(?P<story_id>\d+)",
        r"(?:https?://)?(?:www\.)?instagram\.com/tv/(?P<igtv_id>[\w-]+)",
        r"(?:https?://)?(?:www\.)?instagram\.com/(?P<username>[\w.]+)/?$",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Detect Instagram URL and content type."""
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                groups = match.groupdict()

                if "post_id" in groups:
                    url_type = "post"
                elif "reel_id" in groups:
                    url_type = "reel"
                elif "story_id" in groups:
                    url_type = "story"
                elif "igtv_id" in groups:
                    url_type = "igtv"
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
        """Download Instagram content using yt-dlp."""
        try:
            output_dir = settings.downloads_dir / "instagram"
            output_dir.mkdir(parents=True, exist_ok=True)

            output_template = str(output_dir / "%(uploader)s_%(id)s.%(ext)s")

            # Build yt-dlp args
            args = [
                settings.ytdlp_path,
                "--format", "best",
                "--output", output_template,
                "--newline",
                "--progress",
            ]

            # Add cookies if available
            if settings.instagram_session_id:
                args.extend(["--cookies-from-browser", "chrome"])

            args.append(url)

            # Run yt-dlp
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
                return {"success": False, "error": "Download failed - may require authentication"}

            return {
                "success": True,
                "file_path": output_file,
                "platform": self.id,
            }

        except Exception as e:
            logger.exception(f"Instagram download error: {e}")
            return {"success": False, "error": str(e)}

    async def get_info(self, url: str) -> dict:
        """Get Instagram content info."""
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
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
