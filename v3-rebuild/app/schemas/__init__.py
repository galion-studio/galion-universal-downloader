"""Pydantic schemas for request/response validation."""

from app.schemas.download import (
    DownloadCreate,
    DownloadResponse,
    DownloadListResponse,
    DownloadStatus,
)
from app.schemas.platform import PlatformResponse, PlatformListResponse
from app.schemas.common import (
    ErrorResponse,
    SuccessResponse,
    PaginationParams,
    QueueStats,
)

__all__ = [
    "DownloadCreate",
    "DownloadResponse",
    "DownloadListResponse",
    "DownloadStatus",
    "PlatformResponse",
    "PlatformListResponse",
    "ErrorResponse",
    "SuccessResponse",
    "PaginationParams",
    "QueueStats",
]
