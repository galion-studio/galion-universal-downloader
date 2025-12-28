"""API key management endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.schemas.platform import ApiKeyCreate, ApiKeyResponse, ApiKeyValidationResponse
from app.schemas.common import SuccessResponse
from app.models.api_key import ApiKey
from app.core.platform_router import platform_registry
from app.core.auth_manager import auth_manager

router = APIRouter()


@router.get("/keys", response_model=list[ApiKeyResponse])
async def list_api_keys(db: AsyncSession = Depends(get_db)):
    """
    List all configured API keys (masked).
    """
    result = await db.execute(select(ApiKey))
    keys = result.scalars().all()

    return [
        ApiKeyResponse(
            platform_id=key.platform_id,
            key_preview=key.key_preview or "***",
            is_valid=key.is_valid,
            last_validated=key.last_validated.isoformat() if key.last_validated else None,
            last_used=key.last_used.isoformat() if key.last_used else None,
        )
        for key in keys
    ]


@router.post("/keys/{platform_id}", response_model=ApiKeyResponse)
async def set_api_key(
    platform_id: str,
    request: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Set or update an API key for a platform.
    """
    # Verify platform exists
    handler = platform_registry.get_handler(platform_id)
    if not handler:
        raise HTTPException(status_code=404, detail="Platform not found")

    # Encrypt key
    encrypted, nonce, tag = await auth_manager.encrypt_key(request.key)

    # Create preview (first 4 + last 4 chars)
    key = request.key
    if len(key) > 10:
        preview = f"{key[:4]}...{key[-4:]}"
    else:
        preview = f"{key[:2]}***"

    # Check if key exists
    result = await db.execute(
        select(ApiKey).where(ApiKey.platform_id == platform_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.encrypted_key = encrypted
        existing.key_nonce = nonce
        existing.key_tag = tag
        existing.key_preview = preview
        existing.is_valid = True
    else:
        from uuid import uuid4
        api_key = ApiKey(
            id=str(uuid4()),
            platform_id=platform_id,
            encrypted_key=encrypted,
            key_nonce=nonce,
            key_tag=tag,
            key_preview=preview,
        )
        db.add(api_key)

    await db.commit()

    return ApiKeyResponse(
        platform_id=platform_id,
        key_preview=preview,
        is_valid=True,
        last_validated=None,
        last_used=None,
    )


@router.delete("/keys/{platform_id}", response_model=SuccessResponse)
async def delete_api_key(
    platform_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an API key.
    """
    result = await db.execute(
        select(ApiKey).where(ApiKey.platform_id == platform_id)
    )
    key = result.scalar_one_or_none()

    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    await db.delete(key)
    await db.commit()

    return SuccessResponse(message=f"API key deleted for {platform_id}")


@router.post("/platforms/{platform_id}/validate", response_model=ApiKeyValidationResponse)
async def validate_api_key(
    platform_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Validate a platform's API key.
    """
    # Get key
    result = await db.execute(
        select(ApiKey).where(ApiKey.platform_id == platform_id)
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(status_code=404, detail="No API key configured")

    # Decrypt key
    key = await auth_manager.decrypt_key(
        api_key.encrypted_key,
        api_key.key_nonce,
        api_key.key_tag,
    )

    # Get handler and validate
    handler = platform_registry.get_handler(platform_id)
    if not handler:
        raise HTTPException(status_code=404, detail="Platform not found")

    validation = await handler.validate_api_key(key)

    # Update validation status
    from datetime import datetime
    api_key.is_valid = validation.get("valid", False)
    api_key.last_validated = datetime.utcnow()
    api_key.validation_error = validation.get("error")
    await db.commit()

    return ApiKeyValidationResponse(
        valid=validation.get("valid", False),
        platform_id=platform_id,
        username=validation.get("username"),
        error=validation.get("error"),
    )
