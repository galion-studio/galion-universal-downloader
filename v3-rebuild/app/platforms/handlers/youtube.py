"""
YouTube Platform Handler

Supports:
- Videos (including shorts)
- Playlists
- Channels
- Live streams
- Quality selection up to 8K
- Subtitles in multiple languages
"""

import asyncio
import json
import re
from pathlib import Path
from typing import Optional, Callable

from loguru import logger

from app.core.platform_router import BasePlatformHandler, PlatformInfo
from app.config import settings


class YouTubeHandler(BasePlatformHandler):
    """Handler for YouTube video downloads."""

    id = "youtube"
    name = "YouTube"
    icon = "youtube"
    category = "video"

    requires_auth = False
    supports_quality_selection = True
    supports_subtitles = True
    supports_playlists = True
    supports_channels = True

    rate_limit_rpm = 30

    url_patterns = [
        r"(?:https?://)?(?:www\.)?youtube\.com/watch\?v=(?P<video_id>[\w-]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/shorts/(?P<video_id>[\w-]+)",
        r"(?:https?://)?youtu\.be/(?P<video_id>[\w-]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/playlist\?list=(?P<playlist_id>[\w-]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/@(?P<channel_handle>[\w-]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/channel/(?P<channel_id>[\w-]+)",
        r"(?:https?://)?(?:www\.)?youtube\.com/live/(?P<video_id>[\w-]+)",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Detect YouTube URL and determine content type."""
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                groups = match.groupdict()

                # Determine URL type
                if "playlist_id" in groups:
                    url_type = "playlist"
                elif "channel_handle" in groups or "channel_id" in groups:
                    url_type = "channel"
                elif "/shorts/" in url:
                    url_type = "short"
                elif "/live/" in url:
                    url_type = "live"
                else:
                    url_type = "video"

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
        """
        Download YouTube video using yt-dlp.

        Options:
            quality: "best", "1080p", "720p", "480p", "360p", "audio"
            format: "mp4", "webm", "mp3"
            subtitles: bool
            subtitle_langs: list of language codes
        """
        try:
            # Build yt-dlp command
            output_dir = settings.downloads_dir / "youtube"
            output_dir.mkdir(parents=True, exist_ok=True)

            # Output template
            output_template = str(output_dir / "%(title)s.%(ext)s")

            # Build format string based on quality
            quality = options.get("quality", "best")
            format_str = self._get_format_string(quality)

            # yt-dlp options
            ydl_opts = {
                "format": format_str,
                "outtmpl": output_template,
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "writesubtitles": options.get("subtitles", False),
                "subtitleslangs": options.get("subtitle_langs", ["en"]),
                "writethumbnail": True,
                "postprocessors": [],
            }

            # Add audio extraction if requested
            if quality == "audio" or options.get("format") == "mp3":
                ydl_opts["postprocessors"].append({
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                })

            # Run yt-dlp
            result = await self._run_ytdlp(url, ydl_opts, progress_callback)

            return result

        except Exception as e:
            logger.exception(f"YouTube download error: {e}")
            return {"success": False, "error": str(e)}

    async def get_info(self, url: str) -> dict:
        """Get video information without downloading."""
        try:
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "skip_download": True,
            }

            # Run yt-dlp with extract only
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
                return {"success": False, "error": stderr.decode()}

            info = json.loads(stdout.decode())

            return {
                "success": True,
                "title": info.get("title"),
                "description": info.get("description"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "view_count": info.get("view_count"),
                "uploader": info.get("uploader"),
                "upload_date": info.get("upload_date"),
                "formats": [
                    {
                        "format_id": f.get("format_id"),
                        "ext": f.get("ext"),
                        "resolution": f.get("resolution"),
                        "filesize": f.get("filesize"),
                    }
                    for f in info.get("formats", [])[:10]
                ],
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _run_ytdlp(
        self,
        url: str,
        opts: dict,
        progress_callback: Optional[Callable] = None,
    ) -> dict:
        """Run yt-dlp subprocess and parse output."""
        # Build command args
        args = [settings.ytdlp_path]
        args.extend(["--format", opts.get("format", "best")])
        args.extend(["--output", opts.get("outtmpl", "%(title)s.%(ext)s")])
        args.append("--newline")  # For progress parsing
        args.append("--progress")

        if opts.get("writesubtitles"):
            args.append("--write-subs")
            langs = opts.get("subtitleslangs", ["en"])
            args.extend(["--sub-langs", ",".join(langs)])

        if opts.get("writethumbnail"):
            args.append("--write-thumbnail")

        args.append(url)

        # Run process
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        output_file = None
        last_progress = 0

        # Parse output for progress
        async for line in proc.stdout:
            line_str = line.decode().strip()

            # Parse progress
            if "[download]" in line_str:
                progress_match = re.search(r"(\d+\.?\d*)%", line_str)
                if progress_match:
                    progress = float(progress_match.group(1))
                    if progress_callback and progress > last_progress:
                        from app.core.download_engine import DownloadProgress
                        await progress_callback(DownloadProgress(
                            percent=progress,
                            status="downloading",
                        ))
                        last_progress = progress

            # Parse destination
            if "[download] Destination:" in line_str:
                output_file = line_str.split("Destination:")[-1].strip()

            # Parse merge
            if "[Merger]" in line_str or "has already been downloaded" in line_str:
                if not output_file:
                    match = re.search(r'"(.+?)"', line_str)
                    if match:
                        output_file = match.group(1)

        await proc.wait()

        if proc.returncode != 0:
            return {"success": False, "error": "yt-dlp failed"}

        return {
            "success": True,
            "file_path": output_file,
            "platform": self.id,
        }

    def _get_format_string(self, quality: str) -> str:
        """Get yt-dlp format string for quality."""
        formats = {
            "best": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "8k": "bestvideo[height<=4320]+bestaudio/best",
            "4k": "bestvideo[height<=2160]+bestaudio/best",
            "1080p": "bestvideo[height<=1080]+bestaudio/best",
            "720p": "bestvideo[height<=720]+bestaudio/best",
            "480p": "bestvideo[height<=480]+bestaudio/best",
            "360p": "bestvideo[height<=360]+bestaudio/best",
            "audio": "bestaudio/best",
        }
        return formats.get(quality, formats["best"])
