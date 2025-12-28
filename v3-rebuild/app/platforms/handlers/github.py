"""
GitHub Platform Handler

Supports:
- Repository downloads (as ZIP)
- Release assets
- Raw files
- Gists
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


class GitHubHandler(BasePlatformHandler):
    """Handler for GitHub content downloads."""

    id = "github"
    name = "GitHub"
    icon = "github"
    category = "development"

    requires_auth = False  # Public repos don't need auth
    supports_quality_selection = False
    supports_subtitles = False
    supports_playlists = False
    supports_channels = True  # User/org profiles

    rate_limit_rpm = 60  # 60 for authenticated, 10 for anonymous

    url_patterns = [
        r"(?:https?://)?github\.com/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/releases/download/(?P<tag>[\w.-]+)/(?P<asset>[\w.-]+)",
        r"(?:https?://)?github\.com/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/releases/tag/(?P<tag>[\w.-]+)",
        r"(?:https?://)?github\.com/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/releases/?$",
        r"(?:https?://)?github\.com/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/archive/(?P<ref>[\w.-]+)\.(?P<format>zip|tar\.gz)",
        r"(?:https?://)?github\.com/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/raw/(?P<branch>[\w.-]+)/(?P<path>.+)",
        r"(?:https?://)?raw\.githubusercontent\.com/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/(?P<branch>[\w.-]+)/(?P<path>.+)",
        r"(?:https?://)?github\.com/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/?$",
        r"(?:https?://)?gist\.github\.com/(?P<owner>[\w-]+)/(?P<gist_id>[\w]+)",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Detect GitHub URL and content type."""
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                groups = match.groupdict()

                if "asset" in groups:
                    url_type = "release_asset"
                elif "tag" in groups:
                    url_type = "release"
                elif "path" in groups:
                    url_type = "raw_file"
                elif "gist_id" in groups:
                    url_type = "gist"
                elif "format" in groups:
                    url_type = "archive"
                else:
                    url_type = "repository"

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
        """Download GitHub content."""
        try:
            info = self.can_handle(url)
            if not info:
                return {"success": False, "error": "Invalid GitHub URL"}

            output_dir = settings.downloads_dir / "github"
            output_dir.mkdir(parents=True, exist_ok=True)

            metadata = info.metadata

            # Handle different URL types
            if info.url_type == "release_asset":
                return await self._download_release_asset(url, output_dir, progress_callback)

            elif info.url_type == "raw_file":
                return await self._download_raw_file(url, metadata, output_dir, progress_callback)

            elif info.url_type == "repository":
                return await self._download_repository(metadata, output_dir, progress_callback)

            elif info.url_type == "release":
                return await self._download_latest_release(metadata, output_dir, progress_callback)

            else:
                # Generic download
                return await self._download_release_asset(url, output_dir, progress_callback)

        except Exception as e:
            logger.exception(f"GitHub download error: {e}")
            return {"success": False, "error": str(e)}

    async def _download_release_asset(
        self,
        url: str,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download a release asset directly."""
        filename = url.split("/")[-1]
        dest_path = output_dir / filename

        headers = {}
        if settings.github_token:
            headers["Authorization"] = f"token {settings.github_token}"

        result = await download_engine.download_file(
            url=url,
            dest_path=dest_path,
            progress_callback=progress_callback,
            headers=headers,
        )

        return {
            "success": result.success,
            "file_path": str(result.file_path) if result.file_path else None,
            "file_size": result.file_size,
            "error": result.error,
            "platform": self.id,
        }

    async def _download_raw_file(
        self,
        url: str,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download a raw file from GitHub."""
        # Convert to raw URL if needed
        if "raw.githubusercontent.com" not in url:
            owner = metadata.get("owner")
            repo = metadata.get("repo")
            branch = metadata.get("branch", "main")
            path = metadata.get("path", "")
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"

        filename = url.split("/")[-1]
        dest_path = output_dir / filename

        headers = {}
        if settings.github_token:
            headers["Authorization"] = f"token {settings.github_token}"

        result = await download_engine.download_file(
            url=url,
            dest_path=dest_path,
            progress_callback=progress_callback,
            headers=headers,
        )

        return {
            "success": result.success,
            "file_path": str(result.file_path) if result.file_path else None,
            "file_size": result.file_size,
            "error": result.error,
            "platform": self.id,
        }

    async def _download_repository(
        self,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download repository as ZIP."""
        owner = metadata.get("owner")
        repo = metadata.get("repo")

        # Get default branch
        api_url = f"https://api.github.com/repos/{owner}/{repo}"

        headers = {"Accept": "application/vnd.github.v3+json"}
        if settings.github_token:
            headers["Authorization"] = f"token {settings.github_token}"

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, headers=headers)

            if response.status_code != 200:
                return {"success": False, "error": f"Failed to fetch repo info: {response.status_code}"}

            repo_info = response.json()
            default_branch = repo_info.get("default_branch", "main")

        # Download ZIP
        zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{default_branch}.zip"
        filename = f"{repo}-{default_branch}.zip"
        dest_path = output_dir / filename

        result = await download_engine.download_file(
            url=zip_url,
            dest_path=dest_path,
            progress_callback=progress_callback,
            headers=headers,
        )

        return {
            "success": result.success,
            "file_path": str(result.file_path) if result.file_path else None,
            "file_size": result.file_size,
            "error": result.error,
            "platform": self.id,
        }

    async def _download_latest_release(
        self,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download all assets from latest release."""
        owner = metadata.get("owner")
        repo = metadata.get("repo")

        api_url = f"https://api.github.com/repos/{owner}/{repo}/releases/latest"

        headers = {"Accept": "application/vnd.github.v3+json"}
        if settings.github_token:
            headers["Authorization"] = f"token {settings.github_token}"

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, headers=headers)

            if response.status_code != 200:
                return {"success": False, "error": f"No releases found: {response.status_code}"}

            release = response.json()
            assets = release.get("assets", [])

            if not assets:
                return {"success": False, "error": "No release assets found"}

            # Download first/main asset
            asset = assets[0]
            download_url = asset.get("browser_download_url")

            return await self._download_release_asset(download_url, output_dir, progress_callback)

    async def get_info(self, url: str) -> dict:
        """Get GitHub content info."""
        try:
            info = self.can_handle(url)
            if not info:
                return {"success": False, "error": "Invalid GitHub URL"}

            metadata = info.metadata

            if info.url_type == "repository":
                owner = metadata.get("owner")
                repo = metadata.get("repo")
                api_url = f"https://api.github.com/repos/{owner}/{repo}"

                async with httpx.AsyncClient() as client:
                    response = await client.get(api_url)
                    if response.status_code == 200:
                        data = response.json()
                        return {
                            "success": True,
                            "name": data.get("name"),
                            "description": data.get("description"),
                            "stars": data.get("stargazers_count"),
                            "language": data.get("language"),
                            "size": data.get("size"),
                        }

            return {
                "success": True,
                "type": info.url_type,
                "metadata": metadata,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
