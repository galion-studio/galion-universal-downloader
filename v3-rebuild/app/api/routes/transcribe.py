"""Transcription endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.api.deps import get_db
from app.models.transcription import TranscriptionJob, TranscriptionStatus
from app.schemas.common import SuccessResponse
from app.config import settings

router = APIRouter()


class TranscriptionCreate(BaseModel):
    """Request to create transcription job."""
    download_id: Optional[str] = Field(None, description="Download ID to transcribe")
    source_path: Optional[str] = Field(None, description="Direct file path")
    model: str = Field("tiny.en", description="Whisper model to use")
    language: Optional[str] = Field(None, description="Language code (auto-detect if None)")
    task: str = Field("transcribe", pattern="^(transcribe|translate)$")
    output_formats: list[str] = Field(["srt", "txt"], description="Output formats")


class TranscriptionResponse(BaseModel):
    """Transcription job response."""
    id: str
    download_id: Optional[str]
    source_path: str
    model: str
    language: Optional[str]
    status: TranscriptionStatus
    progress: float
    output_paths: dict
    error_message: Optional[str]
    processing_time: Optional[float]

    class Config:
        from_attributes = True


@router.post("/transcribe", response_model=TranscriptionResponse)
async def create_transcription(
    request: TranscriptionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new transcription job.

    Requires either download_id or source_path.
    """
    if not request.download_id and not request.source_path:
        raise HTTPException(
            status_code=400,
            detail="Either download_id or source_path is required"
        )

    # Resolve source path
    if request.download_id:
        from app.models.download import Download
        result = await db.execute(
            select(Download).where(Download.id == request.download_id)
        )
        download = result.scalar_one_or_none()

        if not download:
            raise HTTPException(status_code=404, detail="Download not found")

        if not download.file_path:
            raise HTTPException(status_code=400, detail="Download has no file")

        source_path = download.file_path
    else:
        source_path = request.source_path

    # Create job
    from uuid import uuid4
    job = TranscriptionJob(
        id=str(uuid4()),
        download_id=request.download_id,
        source_path=source_path,
        model=request.model,
        language=request.language,
        task=request.task,
        output_formats=request.output_formats,
        status=TranscriptionStatus.PENDING,
    )

    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Queue transcription in background
    background_tasks.add_task(
        process_transcription,
        job.id,
    )

    return job


@router.get("/transcribe/{job_id}", response_model=TranscriptionResponse)
async def get_transcription(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get transcription job status."""
    result = await db.execute(
        select(TranscriptionJob).where(TranscriptionJob.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Transcription job not found")

    return job


@router.get("/transcribe/models", response_model=list[dict])
async def list_models():
    """List available Whisper models."""
    return [
        {
            "id": "tiny.en",
            "name": "Tiny (English)",
            "size": "39M",
            "vram": "~1GB",
            "speed": "~32x",
            "description": "Fastest, English only",
        },
        {
            "id": "tiny",
            "name": "Tiny (Multilingual)",
            "size": "39M",
            "vram": "~1GB",
            "speed": "~32x",
            "description": "Fastest multilingual",
        },
        {
            "id": "base.en",
            "name": "Base (English)",
            "size": "74M",
            "vram": "~1GB",
            "speed": "~16x",
            "description": "Fast, English only",
        },
        {
            "id": "base",
            "name": "Base (Multilingual)",
            "size": "74M",
            "vram": "~1GB",
            "speed": "~16x",
            "description": "Fast multilingual",
        },
        {
            "id": "small.en",
            "name": "Small (English)",
            "size": "244M",
            "vram": "~2GB",
            "speed": "~6x",
            "description": "Good accuracy, English",
        },
        {
            "id": "small",
            "name": "Small (Multilingual)",
            "size": "244M",
            "vram": "~2GB",
            "speed": "~6x",
            "description": "Good multilingual",
        },
        {
            "id": "medium.en",
            "name": "Medium (English)",
            "size": "769M",
            "vram": "~5GB",
            "speed": "~2x",
            "description": "High accuracy, English",
        },
        {
            "id": "medium",
            "name": "Medium (Multilingual)",
            "size": "769M",
            "vram": "~5GB",
            "speed": "~2x",
            "description": "High accuracy multilingual",
        },
        {
            "id": "large-v3",
            "name": "Large V3",
            "size": "1.55G",
            "vram": "~10GB",
            "speed": "~1x",
            "description": "Best accuracy, all languages",
        },
    ]


async def process_transcription(job_id: str):
    """Background task to process transcription."""
    from app.services.transcription import transcription_service
    await transcription_service.process_job(job_id)
