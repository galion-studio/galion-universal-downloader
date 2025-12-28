"""Download management endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from loguru import logger

from app.api.deps import get_db
from app.schemas.download import (
    DownloadCreate,
    DownloadBatchCreate,
    DownloadResponse,
    DownloadListResponse,
    DownloadStatus,
)
from app.schemas.common import ParseURLRequest, ParseURLResponse, SuccessResponse
from app.models.download import Download
from app.core.queue_manager import queue_manager
from app.core.platform_router import platform_registry

router = APIRouter()


@router.post("/downloads", response_model=DownloadResponse)
async def create_download(
    request: DownloadCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new download job.

    The job will be queued for processing by workers.
    """
    # Detect platform
    platform_info = platform_registry.detect(request.url)

    if not platform_info:
        # Use generic handler
        platform_id = "generic"
        platform_name = "Direct Download"
    else:
        platform_id = platform_info.id
        platform_name = platform_info.name

    # Create database record
    download = Download(
        url=request.url,
        platform_id=platform_id,
        status=DownloadStatus.PENDING,
        options=request.options.model_dump(),
        priority=request.priority,
    )

    db.add(download)
    await db.commit()
    await db.refresh(download)

    # Add to queue
    job_id = await queue_manager.enqueue(
        url=request.url,
        platform_id=platform_id,
        options=request.options.model_dump(),
        priority=request.priority,
    )

    if job_id:
        download.status = DownloadStatus.QUEUED
        await db.commit()

    logger.info(f"Created download {download.id} for {platform_name}")

    return download


@router.post("/downloads/batch", response_model=list[DownloadResponse])
async def create_batch_download(
    request: DownloadBatchCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create multiple download jobs.

    All URLs will be queued with the same options.
    """
    downloads = []

    for url in request.urls:
        platform_info = platform_registry.detect(url)
        platform_id = platform_info.id if platform_info else "generic"

        download = Download(
            url=url,
            platform_id=platform_id,
            status=DownloadStatus.PENDING,
            options=request.options.model_dump(),
            priority=request.priority,
        )

        db.add(download)
        downloads.append(download)

    await db.commit()

    # Queue all downloads
    for download in downloads:
        job_id = await queue_manager.enqueue(
            url=download.url,
            platform_id=download.platform_id,
            options=download.options,
            priority=download.priority,
        )

        if job_id:
            download.status = DownloadStatus.QUEUED

    await db.commit()

    # Refresh all
    for download in downloads:
        await db.refresh(download)

    logger.info(f"Created {len(downloads)} batch downloads")

    return downloads


@router.get("/downloads", response_model=DownloadListResponse)
async def list_downloads(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[DownloadStatus] = None,
    platform_id: Optional[str] = None,
):
    """
    List download jobs with pagination.

    Filter by status or platform.
    """
    # Build query
    query = select(Download).order_by(Download.created_at.desc())

    if status:
        query = query.where(Download.status == status)

    if platform_id:
        query = query.where(Download.platform_id == platform_id)

    # Count total
    count_query = select(func.count(Download.id))
    if status:
        count_query = count_query.where(Download.status == status)
    if platform_id:
        count_query = count_query.where(Download.platform_id == platform_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    downloads = result.scalars().all()

    return DownloadListResponse(
        items=downloads,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
    )


@router.get("/downloads/{download_id}", response_model=DownloadResponse)
async def get_download(
    download_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get download job by ID."""
    result = await db.execute(
        select(Download).where(Download.id == download_id)
    )
    download = result.scalar_one_or_none()

    if not download:
        raise HTTPException(status_code=404, detail="Download not found")

    return download


@router.delete("/downloads/{download_id}", response_model=SuccessResponse)
async def cancel_download(
    download_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Cancel or delete a download.

    Running downloads will be cancelled, completed downloads will be deleted.
    """
    result = await db.execute(
        select(Download).where(Download.id == download_id)
    )
    download = result.scalar_one_or_none()

    if not download:
        raise HTTPException(status_code=404, detail="Download not found")

    if download.status in (DownloadStatus.DOWNLOADING, DownloadStatus.PROCESSING):
        download.status = DownloadStatus.CANCELLED
        await db.commit()
        return SuccessResponse(message="Download cancelled")

    await db.delete(download)
    await db.commit()

    return SuccessResponse(message="Download deleted")


@router.post("/downloads/{download_id}/resume", response_model=DownloadResponse)
async def resume_download(
    download_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Resume a paused or failed download.
    """
    result = await db.execute(
        select(Download).where(Download.id == download_id)
    )
    download = result.scalar_one_or_none()

    if not download:
        raise HTTPException(status_code=404, detail="Download not found")

    if download.status not in (DownloadStatus.PAUSED, DownloadStatus.FAILED):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot resume download with status: {download.status}"
        )

    # Re-queue
    job_id = await queue_manager.enqueue(
        url=download.url,
        platform_id=download.platform_id,
        options=download.options,
        priority=download.priority,
        deduplicate=False,
    )

    if job_id:
        download.status = DownloadStatus.QUEUED
        download.retry_count += 1
        await db.commit()

    await db.refresh(download)
    return download


@router.post("/parse", response_model=ParseURLResponse)
async def parse_url(request: ParseURLRequest):
    """
    Parse a URL and detect the platform.

    Returns platform information without creating a download.
    """
    platform_info = platform_registry.detect(request.url)

    if not platform_info:
        return ParseURLResponse(
            platform_id="generic",
            platform_name="Direct Download",
            url_type="unknown",
            metadata={},
            requires_auth=False,
        )

    handler = platform_registry.get_handler(platform_info.id)

    return ParseURLResponse(
        platform_id=platform_info.id,
        platform_name=platform_info.name,
        url_type=platform_info.url_type,
        metadata=platform_info.metadata,
        requires_auth=handler.requires_auth if handler else False,
    )
