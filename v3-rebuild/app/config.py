"""
Configuration management using Pydantic Settings.

Loads settings from environment variables and .env file.
Provides type-safe access to all configuration values.
"""

from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # === Core ===
    galion_env: str = Field(default="development", alias="GALION_ENV")
    galion_debug: bool = Field(default=False, alias="GALION_DEBUG")
    galion_secret_key: str = Field(
        default="development-secret-key-change-in-production",
        alias="GALION_SECRET_KEY",
    )
    galion_api_prefix: str = Field(default="/api/v1", alias="GALION_API_PREFIX")
    galion_host: str = Field(default="0.0.0.0", alias="GALION_HOST")
    galion_port: int = Field(default=8000, alias="GALION_PORT")

    # === Database ===
    database_url: str = Field(
        default="sqlite+aiosqlite:///./data/galion.db",
        alias="DATABASE_URL",
    )

    # === Redis ===
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    redis_password: Optional[str] = Field(default=None, alias="REDIS_PASSWORD")

    # === Storage ===
    downloads_dir: Path = Field(default=Path("./downloads"), alias="DOWNLOADS_DIR")
    data_dir: Path = Field(default=Path("./data"), alias="DATA_DIR")
    max_storage_gb: int = Field(default=100, alias="MAX_STORAGE_GB")
    cleanup_after_days: int = Field(default=7, alias="CLEANUP_AFTER_DAYS")

    # === Workers ===
    download_workers: int = Field(default=5, alias="DOWNLOAD_WORKERS")
    transcription_workers: int = Field(default=1, alias="TRANSCRIPTION_WORKERS")
    scraper_workers: int = Field(default=2, alias="SCRAPER_WORKERS")
    max_concurrent_per_platform: int = Field(default=3, alias="MAX_CONCURRENT_PER_PLATFORM")
    default_download_timeout: int = Field(default=300, alias="DEFAULT_DOWNLOAD_TIMEOUT")

    # === GPU / AI ===
    cuda_visible_devices: str = Field(default="0", alias="CUDA_VISIBLE_DEVICES")
    whisper_model: str = Field(default="tiny.en", alias="WHISPER_MODEL")
    whisper_compute_type: str = Field(default="float16", alias="WHISPER_COMPUTE_TYPE")
    whisper_device: str = Field(default="cuda", alias="WHISPER_DEVICE")

    # === Rate Limiting ===
    rate_limit_enabled: bool = Field(default=True, alias="RATE_LIMIT_ENABLED")
    rate_limit_default_rpm: int = Field(default=60, alias="RATE_LIMIT_DEFAULT_RPM")
    rate_limit_youtube_rpm: int = Field(default=30, alias="RATE_LIMIT_YOUTUBE_RPM")
    rate_limit_instagram_rpm: int = Field(default=10, alias="RATE_LIMIT_INSTAGRAM_RPM")
    rate_limit_twitter_rpm: int = Field(default=15, alias="RATE_LIMIT_TWITTER_RPM")

    # === External Tools ===
    ytdlp_path: str = Field(default="yt-dlp", alias="YTDLP_PATH")
    ffmpeg_path: str = Field(default="ffmpeg", alias="FFMPEG_PATH")
    tor_proxy: Optional[str] = Field(default=None, alias="TOR_PROXY")

    # === API Keys ===
    youtube_api_key: Optional[str] = Field(default=None, alias="YOUTUBE_API_KEY")
    instagram_session_id: Optional[str] = Field(default=None, alias="INSTAGRAM_SESSION_ID")
    twitter_bearer_token: Optional[str] = Field(default=None, alias="TWITTER_BEARER_TOKEN")
    github_token: Optional[str] = Field(default=None, alias="GITHUB_TOKEN")
    civitai_api_key: Optional[str] = Field(default=None, alias="CIVITAI_API_KEY")
    telegram_bot_token: Optional[str] = Field(default=None, alias="TELEGRAM_BOT_TOKEN")
    huggingface_token: Optional[str] = Field(default=None, alias="HUGGINGFACE_TOKEN")

    # === Monitoring ===
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: str = Field(default="json", alias="LOG_FORMAT")

    # === CORS ===
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        alias="CORS_ORIGINS",
    )
    cors_allow_credentials: bool = Field(default=True, alias="CORS_ALLOW_CREDENTIALS")

    @field_validator("downloads_dir", "data_dir", mode="before")
    @classmethod
    def ensure_path(cls, v):
        """Convert string paths to Path objects."""
        if isinstance(v, str):
            return Path(v)
        return v

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.galion_env.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.galion_env.lower() == "development"

    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def database_is_postgres(self) -> bool:
        """Check if using PostgreSQL database."""
        return "postgresql" in self.database_url.lower()

    def ensure_directories(self) -> None:
        """Create necessary directories if they don't exist."""
        self.downloads_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir.mkdir(parents=True, exist_ok=True)


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Uses LRU cache to avoid re-reading environment on every call.
    """
    return Settings()


# Convenience export
settings = get_settings()
