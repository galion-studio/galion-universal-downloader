"""
Generic Platform Handler

Fallback handler for:
- Direct file downloads (images, videos, documents)
- Sites supported by yt-dlp (1000+)
- Any URL not matched by specific handlers
"""

import asyncio
import re
from pathlib import Path
from typing import Optional, Callable
from urllib.parse import urlparse, unquote

from loguru import logger

from app.core.platform_router import BasePlatformHandler, PlatformInfo
from app.core.download_engine import download_engine, DownloadProgress
from app.config import settings


class GenericHandler(BasePlatformHandler):
    """
    Generic fallback handler.

    Handles direct file downloads and passes unknown video URLs to yt-dlp.
    """

    id = "generic"
    name = "Direct Download"
    icon = "download"
    category = "general"

    requires_auth = False
    supports_quality_selection = False
    supports_subtitles = False
    supports_playlists = False
    supports_channels = False

    rate_limit_rpm = 120

    # Matches any URL (lowest priority)
    url_patterns = [
        r"^https?://",
    ]

    # File extensions for direct download
    DIRECT_EXTENSIONS = {
        # Images
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico",
        # Videos
        ".mp4", ".webm", ".mkv", ".avi", ".mov", ".flv", ".wmv", ".m4v",
        # Audio
        ".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma",
        # Documents
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        # Archives
        ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2",
        # Code/Data
        ".json", ".xml", ".csv", ".txt", ".md",
        # AI Models
        ".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".onnx",
    }

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Generic handler accepts all HTTP(S) URLs."""
        if url.startswith(("http://", "https://")):
            # Determine if it's a direct file or potential video
            parsed = urlparse(url)
            path = parsed.path.lower()

            # Check for direct file extension
            for ext in cls.DIRECT_EXTENSIONS:
                if path.endswith(ext):
                    return PlatformInfo(
                        id=cls.id,
                        name=cls.name,
                        category="file",
                        icon="file",
                        url_type="direct",
                        metadata={"extension": ext},
                    )

            # Default to video (try yt-dlp)
            return PlatformInfo(
                id=cls.id,
                name=cls.name,
                category="general",
                icon="download",
                url_type="unknown",
            )

        return None

    async def download(
        self,
        url: str,
        options: dict,
        progress_callback: Optional[Callable] = None,
    ) -> dict:
        """
        Download content - either direct file or via yt-dlp.
        """
        try:
            # Check if direct download
            parsed = urlparse(url)
            path = parsed.path.lower()

            is_direct = any(path.endswith(ext) for ext in self.DIRECT_EXTENSIONS)

            if is_direct:
                return await self._direct_download(url, options, progress_callback)
            else:
                return await self._ytdlp_download(url, options, progress_callback)

        except Exception as e:
            logger.exception(f"Generic download error: {e}")
            return {"success": False, "error": str(e)}

    async def _direct_download(
        self,
        url: str,
        options: dict,
        progress_callback: Optional[Callable] = None,
    ) -> dict:
        """Download file directly via HTTP."""
        try:
            # Determine output directory based on content type
            parsed = urlparse(url)
            filename = unquote(parsed.path.split("/")[-1])

            # Categorize by extension
            ext = Path(filename).suffix.lower()
            if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"}:
                category = "images"
            elif ext in {".mp4", ".webm", ".mkv", ".avi", ".mov"}:
                category = "videos"
            elif ext in {".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"}:
                category = "audio"
            elif ext in {".safetensors", ".ckpt", ".pt", ".pth", ".bin"}:
                category = "models"
            elif ext in {".pdf", ".doc", ".docx", ".xls", ".xlsx"}:
                category = "documents"
            else:
                category = "files"

            output_dir = settings.downloads_dir / category
            output_dir.mkdir(parents=True, exist_ok=True)

            dest_path = output_dir / filename

            # Use download engine
            result = await download_engine.download_file(
                url=url,
                dest_path=dest_path,
                progress_callback=progress_callback,
            )

            return {
                "success": result.success,
                "file_path": str(result.file_path) if result.file_path else None,
                "file_size": result.file_size,
                "checksum": result.checksum,
                "error": result.error,
                "platform": self.id,
            }

        except Exception as e:
            logger.exception(f"Direct download error: {e}")
            return {"success": False, "error": str(e)}

    async def _ytdlp_download(
        self,
        url: str,
        options: dict,
        progress_callback: Optional[Callable] = None,
    ) -> dict:
        """Download via yt-dlp (supports 1000+ sites)."""
        try:
            output_dir = settings.downloads_dir / "generic"
            output_dir.mkdir(parents=True, exist_ok=True)

            output_template = str(output_dir / "%(title)s.%(ext)s")

            # Build yt-dlp args
            args = [
                settings.ytdlp_path,
                "--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                "--output", output_template,
                "--newline",
                "--progress",
                url,
            ]

            # Run process
            proc = await asyncio.create_subprocess_exec(
                *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )

            output_file = None
            last_progress = 0

            async for line in proc.stdout:
                line_str = line.decode().strip()

                # Parse progress
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

                # Parse destination
                if "[download] Destination:" in line_str:
                    output_file = line_str.split("Destination:")[-1].strip()

            await proc.wait()

            if proc.returncode != 0:
                return {"success": False, "error": "yt-dlp failed"}

            return {
                "success": True,
                "file_path": output_file,
                "platform": self.id,
            }

        except Exception as e:
            logger.exception(f"yt-dlp download error: {e}")
            return {"success": False, "error": str(e)}

    async def get_info(self, url: str) -> dict:
        """Get URL information."""
        try:
            # For direct files, do HEAD request
            parsed = urlparse(url)
            path = parsed.path.lower()

            is_direct = any(path.endswith(ext) for ext in self.DIRECT_EXTENSIONS)

            if is_direct:
                info = await download_engine.get_remote_info(url)
                return {
                    "success": True,
                    "type": "direct",
                    "filename": info.get("filename"),
                    "size": info.get("size"),
                    "content_type": info.get("content_type"),
                    "resumable": info.get("accepts_ranges"),
                }

            # For potential videos, use yt-dlp
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
                # Not a video, treat as generic file
                info = await download_engine.get_remote_info(url)
                return {
                    "success": True,
                    "type": "file",
                    "filename": info.get("filename"),
                    "size": info.get("size"),
                    "content_type": info.get("content_type"),
                }

            import json
            video_info = json.loads(stdout.decode())

            return {
                "success": True,
                "type": "video",
                "title": video_info.get("title"),
                "duration": video_info.get("duration"),
                "thumbnail": video_info.get("thumbnail"),
                "extractor": video_info.get("extractor"),
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
