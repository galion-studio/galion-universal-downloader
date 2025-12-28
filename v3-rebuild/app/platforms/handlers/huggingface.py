"""
HuggingFace Platform Handler

Supports:
- Models
- Datasets
- Spaces
- Individual files
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


class HuggingFaceHandler(BasePlatformHandler):
    """Handler for HuggingFace content downloads."""

    id = "huggingface"
    name = "HuggingFace"
    icon = "huggingface"
    category = "ai"

    requires_auth = False  # Token optional for public repos
    supports_quality_selection = False
    supports_subtitles = False
    supports_playlists = False
    supports_channels = True

    rate_limit_rpm = 60

    API_BASE = "https://huggingface.co/api"

    url_patterns = [
        r"(?:https?://)?huggingface\.co/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/resolve/(?P<revision>[\w.-]+)/(?P<path>.+)",
        r"(?:https?://)?huggingface\.co/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/blob/(?P<revision>[\w.-]+)/(?P<path>.+)",
        r"(?:https?://)?huggingface\.co/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/tree/(?P<revision>[\w.-]+)",
        r"(?:https?://)?huggingface\.co/datasets/(?P<owner>[\w-]+)/(?P<dataset>[\w.-]+)",
        r"(?:https?://)?huggingface\.co/spaces/(?P<owner>[\w-]+)/(?P<space>[\w.-]+)",
        r"(?:https?://)?huggingface\.co/(?P<owner>[\w-]+)/(?P<repo>[\w.-]+)/?$",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Detect HuggingFace URL and content type."""
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                groups = match.groupdict()

                if "dataset" in groups:
                    url_type = "dataset"
                elif "space" in groups:
                    url_type = "space"
                elif "path" in groups:
                    url_type = "file"
                else:
                    url_type = "model"

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
        """Download HuggingFace content."""
        try:
            info = self.can_handle(url)
            if not info:
                return {"success": False, "error": "Invalid HuggingFace URL"}

            output_dir = settings.downloads_dir / "huggingface"
            output_dir.mkdir(parents=True, exist_ok=True)

            metadata = info.metadata

            if info.url_type == "file":
                return await self._download_file(url, metadata, output_dir, progress_callback)
            elif info.url_type == "model":
                return await self._download_model(metadata, output_dir, options, progress_callback)
            else:
                return {"success": False, "error": f"Unsupported content type: {info.url_type}"}

        except Exception as e:
            logger.exception(f"HuggingFace download error: {e}")
            return {"success": False, "error": str(e)}

    async def _download_file(
        self,
        url: str,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download a single file."""
        owner = metadata.get("owner")
        repo = metadata.get("repo")
        revision = metadata.get("revision", "main")
        path = metadata.get("path", "")

        # Convert blob URL to resolve URL
        if "/blob/" in url:
            url = url.replace("/blob/", "/resolve/")

        filename = path.split("/")[-1] if path else f"{repo}_file"

        # Create subfolder by repo
        repo_dir = output_dir / f"{owner}_{repo}"
        repo_dir.mkdir(parents=True, exist_ok=True)

        dest_path = repo_dir / filename

        headers = {}
        if settings.huggingface_token:
            headers["Authorization"] = f"Bearer {settings.huggingface_token}"

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

    async def _download_model(
        self,
        metadata: dict,
        output_dir: Path,
        options: dict,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download model files."""
        owner = metadata.get("owner")
        repo = metadata.get("repo")

        # Get model files from API
        api_url = f"{self.API_BASE}/models/{owner}/{repo}"

        headers = {}
        if settings.huggingface_token:
            headers["Authorization"] = f"Bearer {settings.huggingface_token}"

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, headers=headers)

            if response.status_code != 200:
                return {"success": False, "error": f"Model not found: {response.status_code}"}

            model_data = response.json()

        # Get file list
        files_url = f"{self.API_BASE}/models/{owner}/{repo}/tree/main"
        async with httpx.AsyncClient() as client:
            response = await client.get(files_url, headers=headers)

            if response.status_code != 200:
                return {"success": False, "error": "Could not list files"}

            files = response.json()

        # Filter for model files (safetensors, bin, ckpt)
        model_files = [
            f for f in files
            if f.get("path", "").endswith((".safetensors", ".bin", ".ckpt", ".pt", ".pth"))
        ]

        if not model_files:
            # Try downloading config/weights
            model_files = [f for f in files if f.get("type") == "file"][:5]

        if not model_files:
            return {"success": False, "error": "No downloadable files found"}

        # Download primary model file
        main_file = model_files[0]
        file_path = main_file.get("path")
        download_url = f"https://huggingface.co/{owner}/{repo}/resolve/main/{file_path}"

        return await self._download_file(
            download_url,
            {**metadata, "path": file_path},
            output_dir,
            progress_callback,
        )

    async def get_info(self, url: str) -> dict:
        """Get HuggingFace content info."""
        try:
            info = self.can_handle(url)
            if not info:
                return {"success": False, "error": "Invalid HuggingFace URL"}

            metadata = info.metadata

            if info.url_type in ("model", "file"):
                owner = metadata.get("owner")
                repo = metadata.get("repo")
                api_url = f"{self.API_BASE}/models/{owner}/{repo}"

                async with httpx.AsyncClient() as client:
                    response = await client.get(api_url)

                    if response.status_code == 200:
                        data = response.json()
                        return {
                            "success": True,
                            "id": data.get("id"),
                            "pipeline_tag": data.get("pipeline_tag"),
                            "tags": data.get("tags", [])[:10],
                            "downloads": data.get("downloads"),
                            "likes": data.get("likes"),
                        }

            return {
                "success": True,
                "type": info.url_type,
                "metadata": metadata,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def validate_api_key(self, key: str) -> dict:
        """Validate HuggingFace token."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.API_BASE}/whoami",
                    headers={"Authorization": f"Bearer {key}"},
                )

                if response.status_code == 200:
                    user = response.json()
                    return {
                        "valid": True,
                        "username": user.get("name"),
                    }
                else:
                    return {"valid": False, "error": "Invalid token"}

        except Exception as e:
            return {"valid": False, "error": str(e)}
