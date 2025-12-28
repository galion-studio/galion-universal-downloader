"""Download-related schemas."""

from datetime import datetime
from typing import Optional, Any
from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


class DownloadStatus(str, Enum):
    """Download status values."""
    PENDING = "pending"
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class DownloadOptions(BaseModel):
    """Download options."""
    quality: Optional[str] = Field("best", description="Quality setting")
    format: Optional[str] = Field(None, description="Output format")
    subtitles: bool = Field(False, description="Download subtitles")
    subtitle_langs: list[str] = Field(["en"], description="Subtitle languages")
    thumbnail: bool = Field(True, description="Download thumbnail")
    metadata: bool = Field(True, description="Extract metadata")


class DownloadCreate(BaseModel):
    """Request to create a download."""
    url: str = Field(..., description="URL to download")
    options: DownloadOptions = Field(default_factory=DownloadOptions)
    priority: int = Field(5, ge=0, le=10, description="Priority level (0-10)")


class DownloadBatchCreate(BaseModel):
    """Request to create multiple downloads."""
    urls: list[str] = Field(..., min_length=1, max_length=100, description="URLs to download")
    options: DownloadOptions = Field(default_factory=DownloadOptions)
    priority: int = Field(5, ge=0, le=10, description="Priority level")


class DownloadFileResponse(BaseModel):
    """Individual file in a download."""
    id: str
    filename: str
    path: str
    size: int
    content_type: Optional[str]
    file_type: Optional[str]
    status: DownloadStatus


class DownloadResponse(BaseModel):
    """Download job response."""
    id: str = Field(..., description="Download job ID")
    url: str = Field(..., description="Source URL")
    platform_id: Optional[str] = Field(None, description="Detected platform")
    status: DownloadStatus = Field(..., description="Current status")
    progress: float = Field(0.0, description="Progress percentage")
    speed: int = Field(0, description="Download speed (bytes/sec)")
    eta: int = Field(0, description="Estimated time remaining (seconds)")

    # File info
    title: Optional[str] = Field(None, description="Content title")
    filename: Optional[str] = Field(None, description="Output filename")
    file_path: Optional[str] = Field(None, description="Full file path")
    file_size: int = Field(0, description="File size in bytes")
    downloaded_bytes: int = Field(0, description="Downloaded bytes")
    checksum: Optional[str] = Field(None, description="SHA-256 checksum")

    # Error
    error_message: Optional[str] = Field(None, description="Error message if failed")
    error_type: Optional[str] = Field(None, description="Error type")
    retry_count: int = Field(0, description="Retry attempts")

    # Metadata
    options: dict = Field(default_factory=dict, description="Download options")
    metadata: dict = Field(default_factory=dict, description="Content metadata")

    # Timestamps
    created_at: datetime = Field(..., description="Creation time")
    started_at: Optional[datetime] = Field(None, description="Start time")
    completed_at: Optional[datetime] = Field(None, description="Completion time")

    # Related
    files: list[DownloadFileResponse] = Field(default_factory=list, description="Downloaded files")

    class Config:
        from_attributes = True


class DownloadListResponse(BaseModel):
    """Paginated list of downloads."""
    items: list[DownloadResponse]
    total: int = Field(..., description="Total items count")
    page: int = Field(..., description="Current page")
    limit: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total pages")


class DownloadProgress(BaseModel):
    """Real-time download progress."""
    job_id: str
    percent: float
    downloaded: int
    total: int
    speed: float
    eta: int
    status: DownloadStatus
