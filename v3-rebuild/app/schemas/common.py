"""Common schemas used across the API."""

from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Error detail model."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict[str, Any]] = Field(None, description="Additional error details")


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: ErrorDetail
    request_id: Optional[str] = Field(None, description="Request tracking ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[dict[str, Any]] = None


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")


class QueueStats(BaseModel):
    """Queue statistics."""
    connected: bool = Field(..., description="Whether queue is connected")
    paused: bool = Field(False, description="Whether queue is paused")
    pending: int = Field(0, description="Pending jobs count")
    active: int = Field(0, description="Active jobs count")
    completed: int = Field(0, description="Completed jobs count")
    failed: int = Field(0, description="Failed jobs count")
    total_queued: int = Field(0, description="Total jobs ever queued")
    total_completed: int = Field(0, description="Total jobs ever completed")
    total_failed: int = Field(0, description="Total jobs ever failed")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Running environment")
    database: bool = Field(..., description="Database connection status")
    redis: bool = Field(..., description="Redis connection status")
    workers: int = Field(..., description="Active workers count")
    uptime: float = Field(..., description="Uptime in seconds")


class ParseURLRequest(BaseModel):
    """URL parsing request."""
    url: str = Field(..., description="URL to parse")


class ParseURLResponse(BaseModel):
    """URL parsing response."""
    platform_id: str = Field(..., description="Detected platform ID")
    platform_name: str = Field(..., description="Platform display name")
    url_type: str = Field(..., description="Content type (video, image, etc.)")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Extracted metadata")
    requires_auth: bool = Field(False, description="Whether authentication is required")
