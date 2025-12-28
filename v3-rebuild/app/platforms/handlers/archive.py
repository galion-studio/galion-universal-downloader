"""
Archive Platform Handler

Supports:
- Archive.org (Internet Archive)
- Wayback Machine snapshots
- Archive.today
"""

import asyncio
import re
from pathlib import Path
from typing import Optional, Callable
from urllib.parse import urlparse, quote

import httpx
from loguru import logger

from app.core.platform_router import BasePlatformHandler, PlatformInfo
from app.core.download_engine import download_engine
from app.config import settings


class ArchiveHandler(BasePlatformHandler):
    """Handler for archive site downloads."""

    id = "archive"
    name = "Internet Archive"
    icon = "archive"
    category = "archive"

    requires_auth = False
    supports_quality_selection = False
    supports_subtitles = False
    supports_playlists = False
    supports_channels = False

    rate_limit_rpm = 30

    url_patterns = [
        r"(?:https?://)?web\.archive\.org/web/(?P<timestamp>\d+)/(?P<url>.+)",
        r"(?:https?://)?archive\.org/details/(?P<item_id>[\w-]+)",
        r"(?:https?://)?archive\.org/download/(?P<item_id>[\w-]+)/(?P<file>.+)",
        r"(?:https?://)?archive\.today/(?P<hash>[\w]+)",
        r"(?:https?://)?archive\.is/(?P<hash>[\w]+)",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Detect archive URL."""
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                groups = match.groupdict()

                if "timestamp" in groups:
                    url_type = "wayback"
                elif "item_id" in groups:
                    url_type = "item"
                else:
                    url_type = "snapshot"

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
        """Download archive content."""
        try:
            info = self.can_handle(url)
            if not info:
                return {"success": False, "error": "Invalid archive URL"}

            output_dir = settings.downloads_dir / "archive"
            output_dir.mkdir(parents=True, exist_ok=True)

            metadata = info.metadata

            if info.url_type == "item":
                return await self._download_item(metadata, output_dir, progress_callback)
            elif info.url_type == "wayback":
                return await self._download_wayback(url, metadata, output_dir, progress_callback)
            else:
                return await self._download_snapshot(url, output_dir, progress_callback)

        except Exception as e:
            logger.exception(f"Archive download error: {e}")
            return {"success": False, "error": str(e)}

    async def _download_item(
        self,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download Internet Archive item."""
        item_id = metadata.get("item_id")

        # Get item metadata
        api_url = f"https://archive.org/metadata/{item_id}"

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url)

            if response.status_code != 200:
                return {"success": False, "error": "Item not found"}

            item_data = response.json()

        files = item_data.get("files", [])

        # Find main file (largest or first non-metadata)
        main_file = None
        for f in files:
            name = f.get("name", "")
            if not name.endswith((".xml", ".sqlite", "_meta.txt")):
                if main_file is None or int(f.get("size", 0)) > int(main_file.get("size", 0)):
                    main_file = f

        if not main_file:
            return {"success": False, "error": "No downloadable files"}

        filename = main_file.get("name")
        download_url = f"https://archive.org/download/{item_id}/{quote(filename)}"

        dest_path = output_dir / filename

        result = await download_engine.download_file(
            url=download_url,
            dest_path=dest_path,
            progress_callback=progress_callback,
        )

        return {
            "success": result.success,
            "file_path": str(result.file_path) if result.file_path else None,
            "file_size": result.file_size,
            "item_title": item_data.get("metadata", {}).get("title"),
            "error": result.error,
            "platform": self.id,
        }

    async def _download_wayback(
        self,
        url: str,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download Wayback Machine snapshot."""
        timestamp = metadata.get("timestamp")
        original_url = metadata.get("url")

        # Use the if_ modifier for original files
        download_url = f"https://web.archive.org/web/{timestamp}if_/{original_url}"

        # Generate filename from URL
        parsed = urlparse(original_url)
        path = parsed.path or "index"
        if path == "/":
            path = "index"
        filename = f"wayback_{timestamp}_{parsed.netloc}_{Path(path).stem}.html"

        dest_path = output_dir / filename

        result = await download_engine.download_file(
            url=download_url,
            dest_path=dest_path,
            progress_callback=progress_callback,
        )

        return {
            "success": result.success,
            "file_path": str(result.file_path) if result.file_path else None,
            "original_url": original_url,
            "timestamp": timestamp,
            "error": result.error,
            "platform": self.id,
        }

    async def _download_snapshot(
        self,
        url: str,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download archive.today/archive.is snapshot."""
        # Fetch the HTML directly
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={"User-Agent": "Mozilla/5.0"},
                follow_redirects=True,
            )

            if response.status_code != 200:
                return {"success": False, "error": f"Failed to fetch: {response.status_code}"}

            content = response.text

        # Generate filename
        parsed = urlparse(url)
        hash_part = parsed.path.strip("/")
        filename = f"archive_snapshot_{hash_part}.html"

        dest_path = output_dir / filename
        dest_path.write_text(content, encoding="utf-8")

        return {
            "success": True,
            "file_path": str(dest_path),
            "platform": self.id,
        }

    async def get_info(self, url: str) -> dict:
        """Get archive content info."""
        info = self.can_handle(url)
        if not info:
            return {"success": False, "error": "Invalid archive URL"}

        metadata = info.metadata

        if info.url_type == "item" and "item_id" in metadata:
            api_url = f"https://archive.org/metadata/{metadata['item_id']}"

            async with httpx.AsyncClient() as client:
                response = await client.get(api_url)

                if response.status_code == 200:
                    data = response.json()
                    meta = data.get("metadata", {})
                    return {
                        "success": True,
                        "title": meta.get("title"),
                        "description": meta.get("description"),
                        "creator": meta.get("creator"),
                        "date": meta.get("date"),
                        "files": len(data.get("files", [])),
                    }

        return {
            "success": True,
            "type": info.url_type,
            "metadata": metadata,
        }
