"""Platform-related schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class PlatformResponse(BaseModel):
    """Platform information response."""
    id: str = Field(..., description="Platform ID")
    name: str = Field(..., description="Display name")
    icon: str = Field(..., description="Icon identifier")
    category: str = Field(..., description="Platform category")
    description: Optional[str] = Field(None, description="Platform description")

    # Capabilities
    requires_auth: bool = Field(False, description="Requires authentication")
    supports_quality_selection: bool = Field(True, description="Supports quality selection")
    supports_subtitles: bool = Field(False, description="Supports subtitles")
    supports_playlists: bool = Field(False, description="Supports playlists")
    supports_channels: bool = Field(False, description="Supports channels")

    # Status
    enabled: bool = Field(True, description="Whether platform is enabled")
    rate_limit_rpm: int = Field(60, description="Rate limit (requests per minute)")

    # Stats
    total_downloads: int = Field(0, description="Total downloads")
    success_rate: float = Field(100.0, description="Success rate percentage")

    class Config:
        from_attributes = True


class PlatformListResponse(BaseModel):
    """List of platforms."""
    platforms: list[PlatformResponse]
    total: int = Field(..., description="Total platforms count")


class ApiKeyCreate(BaseModel):
    """Request to set an API key."""
    key: str = Field(..., min_length=1, description="API key value")


class ApiKeyResponse(BaseModel):
    """API key information (masked)."""
    platform_id: str = Field(..., description="Platform ID")
    key_preview: str = Field(..., description="Masked key preview")
    is_valid: bool = Field(..., description="Whether key is valid")
    last_validated: Optional[str] = Field(None, description="Last validation time")
    last_used: Optional[str] = Field(None, description="Last usage time")


class ApiKeyValidationResponse(BaseModel):
    """API key validation result."""
    valid: bool = Field(..., description="Whether key is valid")
    platform_id: str = Field(..., description="Platform ID")
    username: Optional[str] = Field(None, description="Associated username")
    error: Optional[str] = Field(None, description="Validation error")
