"""
Authentication and API Key Manager

Handles:
- AES-256-GCM encryption for API keys
- Cookie management
- Proxy rotation
"""

import os
import base64
from typing import Optional, Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from loguru import logger

from app.config import settings


class AuthManager:
    """
    Manages authentication credentials and encryption.

    Uses AES-256-GCM for secure API key storage.
    """

    def __init__(self):
        self._key: Optional[bytes] = None
        self._initialized = False

    def _get_encryption_key(self) -> bytes:
        """
        Derive encryption key from secret.

        Uses PBKDF2 with SHA256 to derive a 256-bit key.
        """
        if self._key:
            return self._key

        # Use secret key from settings
        secret = settings.galion_secret_key.encode()

        # Fixed salt (in production, use a stored salt)
        salt = b"galion_downloader_v3_salt"

        # Derive key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=salt,
            iterations=100000,
        )

        self._key = kdf.derive(secret)
        self._initialized = True

        return self._key

    async def encrypt_key(self, plaintext: str) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypt an API key using AES-256-GCM.

        Returns:
            Tuple of (ciphertext, nonce, tag)
        """
        key = self._get_encryption_key()
        aesgcm = AESGCM(key)

        # Generate random nonce
        nonce = os.urandom(12)

        # Encrypt
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)

        # GCM tag is appended to ciphertext, extract last 16 bytes
        tag = ciphertext[-16:]
        ciphertext = ciphertext[:-16]

        return ciphertext, nonce, tag

    async def decrypt_key(
        self,
        ciphertext: bytes,
        nonce: bytes,
        tag: bytes,
    ) -> str:
        """
        Decrypt an API key using AES-256-GCM.

        Returns:
            Decrypted plaintext string
        """
        key = self._get_encryption_key()
        aesgcm = AESGCM(key)

        # Reconstruct ciphertext with tag
        ciphertext_with_tag = ciphertext + tag

        # Decrypt
        plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, None)

        return plaintext.decode()

    def mask_key(self, key: str, visible_chars: int = 4) -> str:
        """
        Create a masked preview of an API key.

        Example: "sk-abc123xyz" -> "sk-a...xyz"
        """
        if len(key) <= visible_chars * 2:
            return "*" * len(key)

        prefix = key[:visible_chars]
        suffix = key[-visible_chars:]

        return f"{prefix}...{suffix}"


# Singleton instance
auth_manager = AuthManager()
