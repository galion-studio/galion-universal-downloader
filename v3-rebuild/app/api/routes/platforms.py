"""Platform management endpoints."""

from fastapi import APIRouter, HTTPException

from app.schemas.platform import PlatformResponse, PlatformListResponse
from app.core.platform_router import platform_registry

router = APIRouter()


@router.get("/platforms", response_model=PlatformListResponse)
async def list_platforms():
    """
    List all supported platforms.

    Returns platforms grouped by category.
    """
    platforms = platform_registry.get_all_platforms()

    return PlatformListResponse(
        platforms=[PlatformResponse(**p) for p in platforms],
        total=len(platforms),
    )


@router.get("/platforms/{platform_id}", response_model=PlatformResponse)
async def get_platform(platform_id: str):
    """
    Get platform details by ID.
    """
    handler = platform_registry.get_handler(platform_id)

    if not handler:
        raise HTTPException(status_code=404, detail="Platform not found")

    return PlatformResponse(
        id=handler.id,
        name=handler.name,
        icon=handler.icon,
        category=handler.category,
        requires_auth=handler.requires_auth,
        supports_quality_selection=handler.supports_quality_selection,
        supports_subtitles=handler.supports_subtitles,
        supports_playlists=handler.supports_playlists,
        supports_channels=handler.supports_channels,
        rate_limit_rpm=handler.rate_limit_rpm,
    )
