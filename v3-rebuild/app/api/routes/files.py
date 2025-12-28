"""File serving endpoints."""

import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
import aiofiles
import zipfile
import io

from app.config import settings
from app.schemas.common import SuccessResponse

router = APIRouter()


@router.get("/files")
async def list_files(
    path: str = Query("", description="Subdirectory path"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    """
    Browse downloads directory.

    Returns files and folders at the specified path.
    """
    base_path = settings.downloads_dir
    target_path = base_path / path if path else base_path

    # Security: ensure path is within downloads directory
    try:
        target_path = target_path.resolve()
        base_path = base_path.resolve()
        if not str(target_path).startswith(str(base_path)):
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid path")

    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")

    if target_path.is_file():
        # Return file info
        stat = target_path.stat()
        return {
            "type": "file",
            "name": target_path.name,
            "path": str(target_path.relative_to(base_path)),
            "size": stat.st_size,
            "modified": stat.st_mtime,
        }

    # List directory contents
    items = []
    for item in sorted(target_path.iterdir()):
        stat = item.stat()
        items.append({
            "type": "directory" if item.is_dir() else "file",
            "name": item.name,
            "path": str(item.relative_to(base_path)),
            "size": stat.st_size if item.is_file() else None,
            "modified": stat.st_mtime,
        })

    # Paginate
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    items = items[start:end]

    return {
        "type": "directory",
        "path": path or "/",
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/files/{file_path:path}")
async def download_file(file_path: str):
    """
    Download a file.
    """
    base_path = settings.downloads_dir.resolve()
    target_path = (settings.downloads_dir / file_path).resolve()

    # Security check
    if not str(target_path).startswith(str(base_path)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not target_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if target_path.is_dir():
        raise HTTPException(status_code=400, detail="Cannot download directory")

    return FileResponse(
        path=target_path,
        filename=target_path.name,
        media_type="application/octet-stream",
    )


@router.get("/files/{file_path:path}/zip")
async def download_as_zip(file_path: str):
    """
    Download a file or directory as ZIP.
    """
    base_path = settings.downloads_dir.resolve()
    target_path = (settings.downloads_dir / file_path).resolve()

    # Security check
    if not str(target_path).startswith(str(base_path)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")

    # Create ZIP in memory
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        if target_path.is_file():
            zf.write(target_path, target_path.name)
        else:
            # Zip directory
            for root, dirs, files in os.walk(target_path):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(target_path)
                    zf.write(file_path, arcname)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{target_path.name}.zip"'
        }
    )


@router.delete("/files/{file_path:path}", response_model=SuccessResponse)
async def delete_file(file_path: str):
    """
    Delete a file or directory.
    """
    base_path = settings.downloads_dir.resolve()
    target_path = (settings.downloads_dir / file_path).resolve()

    # Security check
    if not str(target_path).startswith(str(base_path)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")

    import shutil

    if target_path.is_dir():
        shutil.rmtree(target_path)
        return SuccessResponse(message=f"Directory deleted: {file_path}")
    else:
        target_path.unlink()
        return SuccessResponse(message=f"File deleted: {file_path}")
