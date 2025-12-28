"""
CivitAI Platform Handler

Supports:
- AI Models (checkpoints, LoRAs, embeddings)
- Model versions
- Articles
- Images
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


class CivitAIHandler(BasePlatformHandler):
    """Handler for CivitAI model downloads."""

    id = "civitai"
    name = "CivitAI"
    icon = "civitai"
    category = "ai"

    requires_auth = False  # API key optional but recommended
    supports_quality_selection = False
    supports_subtitles = False
    supports_playlists = False
    supports_channels = True  # User profiles

    rate_limit_rpm = 60

    API_BASE = "https://civitai.com/api/v1"

    url_patterns = [
        r"(?:https?://)?civitai\.com/models/(?P<model_id>\d+)(?:/[\w-]+)?(?:\?modelVersionId=(?P<version_id>\d+))?",
        r"(?:https?://)?civitai\.com/api/download/models/(?P<version_id>\d+)",
        r"(?:https?://)?civitai\.com/articles/(?P<article_id>\d+)",
        r"(?:https?://)?civitai\.com/images/(?P<image_id>\d+)",
        r"(?:https?://)?civitai\.com/user/(?P<username>[\w-]+)",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Detect CivitAI URL and content type."""
        for pattern in cls.url_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                groups = match.groupdict()

                if "article_id" in groups:
                    url_type = "article"
                elif "image_id" in groups:
                    url_type = "image"
                elif "username" in groups:
                    url_type = "user"
                elif "version_id" in groups and "model_id" not in groups:
                    url_type = "download"
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
        """Download CivitAI model or content."""
        try:
            info = self.can_handle(url)
            if not info:
                return {"success": False, "error": "Invalid CivitAI URL"}

            output_dir = settings.downloads_dir / "civitai"
            output_dir.mkdir(parents=True, exist_ok=True)

            metadata = info.metadata

            if info.url_type == "model":
                return await self._download_model(metadata, output_dir, progress_callback)
            elif info.url_type == "download":
                return await self._download_version(metadata, output_dir, progress_callback)
            elif info.url_type == "image":
                return await self._download_image(metadata, output_dir, progress_callback)
            else:
                return {"success": False, "error": f"Unsupported content type: {info.url_type}"}

        except Exception as e:
            logger.exception(f"CivitAI download error: {e}")
            return {"success": False, "error": str(e)}

    async def _download_model(
        self,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download a model by ID."""
        model_id = metadata.get("model_id")
        version_id = metadata.get("version_id")

        # Get model info from API
        api_url = f"{self.API_BASE}/models/{model_id}"

        headers = {}
        if settings.civitai_api_key:
            headers["Authorization"] = f"Bearer {settings.civitai_api_key}"

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, headers=headers)

            if response.status_code != 200:
                return {"success": False, "error": f"Model not found: {response.status_code}"}

            model_data = response.json()

        # Get version to download
        versions = model_data.get("modelVersions", [])
        if not versions:
            return {"success": False, "error": "No versions available"}

        # Find specific version or use latest
        if version_id:
            version = next((v for v in versions if str(v.get("id")) == str(version_id)), None)
        else:
            version = versions[0]  # Latest

        if not version:
            return {"success": False, "error": "Version not found"}

        # Get download URL
        files = version.get("files", [])
        if not files:
            return {"success": False, "error": "No files available"}

        # Get primary file
        primary_file = files[0]
        download_url = primary_file.get("downloadUrl")
        filename = primary_file.get("name", f"{model_data.get('name', 'model')}.safetensors")

        # Create subfolder by model type
        model_type = model_data.get("type", "model").lower()
        type_dir = output_dir / model_type
        type_dir.mkdir(parents=True, exist_ok=True)

        dest_path = type_dir / filename

        # Download with API key if available
        result = await download_engine.download_file(
            url=download_url,
            dest_path=dest_path,
            progress_callback=progress_callback,
            headers=headers,
        )

        return {
            "success": result.success,
            "file_path": str(result.file_path) if result.file_path else None,
            "file_size": result.file_size,
            "model_name": model_data.get("name"),
            "model_type": model_type,
            "version": version.get("name"),
            "error": result.error,
            "platform": self.id,
        }

    async def _download_version(
        self,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download a specific model version directly."""
        version_id = metadata.get("version_id")

        download_url = f"https://civitai.com/api/download/models/{version_id}"

        headers = {}
        if settings.civitai_api_key:
            headers["Authorization"] = f"Bearer {settings.civitai_api_key}"

        # Get filename from response headers
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.head(download_url, headers=headers)
            content_disp = response.headers.get("content-disposition", "")

            if "filename=" in content_disp:
                filename = content_disp.split("filename=")[1].strip('"\'')
            else:
                filename = f"model_{version_id}.safetensors"

        dest_path = output_dir / filename

        result = await download_engine.download_file(
            url=download_url,
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

    async def _download_image(
        self,
        metadata: dict,
        output_dir: Path,
        progress_callback: Optional[Callable],
    ) -> dict:
        """Download an image from CivitAI."""
        image_id = metadata.get("image_id")

        # Get image info
        api_url = f"{self.API_BASE}/images/{image_id}"

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url)

            if response.status_code != 200:
                return {"success": False, "error": "Image not found"}

            image_data = response.json()
            image_url = image_data.get("url")

            if not image_url:
                return {"success": False, "error": "No image URL"}

        filename = f"civitai_{image_id}.png"
        dest_path = output_dir / "images" / filename
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        result = await download_engine.download_file(
            url=image_url,
            dest_path=dest_path,
            progress_callback=progress_callback,
        )

        return {
            "success": result.success,
            "file_path": str(result.file_path) if result.file_path else None,
            "error": result.error,
            "platform": self.id,
        }

    async def get_info(self, url: str) -> dict:
        """Get CivitAI content info."""
        try:
            info = self.can_handle(url)
            if not info:
                return {"success": False, "error": "Invalid CivitAI URL"}

            metadata = info.metadata

            if info.url_type == "model" and "model_id" in metadata:
                api_url = f"{self.API_BASE}/models/{metadata['model_id']}"

                async with httpx.AsyncClient() as client:
                    response = await client.get(api_url)

                    if response.status_code == 200:
                        data = response.json()
                        return {
                            "success": True,
                            "name": data.get("name"),
                            "type": data.get("type"),
                            "description": data.get("description", "")[:500],
                            "creator": data.get("creator", {}).get("username"),
                            "stats": data.get("stats"),
                            "versions": len(data.get("modelVersions", [])),
                        }

            return {
                "success": True,
                "type": info.url_type,
                "metadata": metadata,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def validate_api_key(self, key: str) -> dict:
        """Validate CivitAI API key."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.API_BASE}/me",
                    headers={"Authorization": f"Bearer {key}"},
                )

                if response.status_code == 200:
                    user = response.json()
                    return {
                        "valid": True,
                        "username": user.get("username"),
                    }
                else:
                    return {"valid": False, "error": "Invalid API key"}

        except Exception as e:
            return {"valid": False, "error": str(e)}
