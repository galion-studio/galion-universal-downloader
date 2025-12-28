"""
Transcription Service using Whisper

GPU-accelerated audio/video transcription using faster-whisper.
"""

import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional

from loguru import logger

from app.config import settings
from app.models.transcription import TranscriptionStatus


class TranscriptionService:
    """
    Whisper transcription service with GPU support.

    Uses faster-whisper for efficient inference.
    """

    def __init__(self):
        self._model = None
        self._model_name: Optional[str] = None
        self._initialized = False

    async def _get_model(self, model_name: str = None):
        """
        Get or load the Whisper model.

        Caches the model in memory for reuse.
        """
        model_name = model_name or settings.whisper_model

        if self._model and self._model_name == model_name:
            return self._model

        # Load in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        self._model = await loop.run_in_executor(
            None,
            self._load_model,
            model_name,
        )
        self._model_name = model_name
        self._initialized = True

        return self._model

    def _load_model(self, model_name: str):
        """Load Whisper model (blocking)."""
        try:
            from faster_whisper import WhisperModel

            logger.info(f"Loading Whisper model: {model_name}")

            model = WhisperModel(
                model_name,
                device=settings.whisper_device,
                compute_type=settings.whisper_compute_type,
            )

            logger.info(f"Whisper model {model_name} loaded")
            return model

        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise

    async def transcribe(
        self,
        audio_path: str,
        model: str = None,
        language: Optional[str] = None,
        task: str = "transcribe",
        output_formats: list[str] = None,
    ) -> dict:
        """
        Transcribe audio/video file.

        Args:
            audio_path: Path to audio/video file
            model: Whisper model to use
            language: Language code (auto-detect if None)
            task: "transcribe" or "translate"
            output_formats: List of output formats (srt, vtt, txt, json)

        Returns:
            dict with transcription results and output paths
        """
        output_formats = output_formats or ["srt", "txt"]

        try:
            # Get model
            whisper_model = await self._get_model(model)

            # Run transcription in thread pool
            loop = asyncio.get_event_loop()
            segments, info = await loop.run_in_executor(
                None,
                lambda: whisper_model.transcribe(
                    audio_path,
                    language=language,
                    task=task,
                    beam_size=5,
                    word_timestamps=True,
                ),
            )

            # Convert segments to list
            segments = list(segments)

            # Generate output files
            output_dir = Path(audio_path).parent
            base_name = Path(audio_path).stem
            output_paths = {}

            for fmt in output_formats:
                output_path = output_dir / f"{base_name}.{fmt}"

                if fmt == "srt":
                    content = self._format_srt(segments)
                elif fmt == "vtt":
                    content = self._format_vtt(segments)
                elif fmt == "txt":
                    content = self._format_txt(segments)
                elif fmt == "json":
                    import json
                    content = json.dumps({
                        "language": info.language,
                        "duration": info.duration,
                        "segments": [
                            {
                                "start": s.start,
                                "end": s.end,
                                "text": s.text,
                                "words": [
                                    {"word": w.word, "start": w.start, "end": w.end}
                                    for w in (s.words or [])
                                ],
                            }
                            for s in segments
                        ],
                    }, indent=2)
                else:
                    continue

                output_path.write_text(content, encoding="utf-8")
                output_paths[fmt] = str(output_path)

            return {
                "success": True,
                "language": info.language,
                "duration": info.duration,
                "segments": len(segments),
                "output_paths": output_paths,
            }

        except Exception as e:
            logger.exception(f"Transcription error: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    def _format_srt(self, segments) -> str:
        """Format segments as SRT subtitles."""
        lines = []
        for i, segment in enumerate(segments, 1):
            start = self._format_timestamp_srt(segment.start)
            end = self._format_timestamp_srt(segment.end)
            text = segment.text.strip()

            lines.append(f"{i}")
            lines.append(f"{start} --> {end}")
            lines.append(text)
            lines.append("")

        return "\n".join(lines)

    def _format_vtt(self, segments) -> str:
        """Format segments as WebVTT subtitles."""
        lines = ["WEBVTT", ""]

        for segment in segments:
            start = self._format_timestamp_vtt(segment.start)
            end = self._format_timestamp_vtt(segment.end)
            text = segment.text.strip()

            lines.append(f"{start} --> {end}")
            lines.append(text)
            lines.append("")

        return "\n".join(lines)

    def _format_txt(self, segments) -> str:
        """Format segments as plain text."""
        return " ".join(s.text.strip() for s in segments)

    def _format_timestamp_srt(self, seconds: float) -> str:
        """Format timestamp for SRT (HH:MM:SS,mmm)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    def _format_timestamp_vtt(self, seconds: float) -> str:
        """Format timestamp for VTT (HH:MM:SS.mmm)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"

    async def process_job(self, job_id: str):
        """
        Process a transcription job from the database.

        Called by background task.
        """
        from app.db.session import async_session_factory
        from app.models.transcription import TranscriptionJob
        from sqlalchemy import select

        async with async_session_factory() as db:
            # Get job
            result = await db.execute(
                select(TranscriptionJob).where(TranscriptionJob.id == job_id)
            )
            job = result.scalar_one_or_none()

            if not job:
                logger.error(f"Transcription job not found: {job_id}")
                return

            # Update status
            job.status = TranscriptionStatus.PROCESSING
            job.started_at = datetime.utcnow()
            await db.commit()

            try:
                # Run transcription
                result = await self.transcribe(
                    audio_path=job.source_path,
                    model=job.model,
                    language=job.language,
                    task=job.task,
                    output_formats=job.output_formats,
                )

                if result.get("success"):
                    job.status = TranscriptionStatus.COMPLETED
                    job.output_paths = result.get("output_paths", {})
                    job.duration = result.get("duration")
                else:
                    job.status = TranscriptionStatus.FAILED
                    job.error_message = result.get("error")

            except Exception as e:
                job.status = TranscriptionStatus.FAILED
                job.error_message = str(e)
                logger.exception(f"Transcription job {job_id} failed: {e}")

            finally:
                job.completed_at = datetime.utcnow()
                if job.started_at:
                    job.processing_time = (job.completed_at - job.started_at).total_seconds()
                await db.commit()

                logger.info(f"Transcription job {job_id} completed with status: {job.status}")


# Singleton instance
transcription_service = TranscriptionService()
