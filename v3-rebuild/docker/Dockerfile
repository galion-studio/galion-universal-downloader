# Galion Universal Downloader v3 - CPU Dockerfile
# Use this for development and non-GPU deployments

FROM python:3.11-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials
    build-essential \
    # FFmpeg for media processing
    ffmpeg \
    # For browser automation (optional)
    chromium \
    chromium-driver \
    # Utilities
    curl \
    wget \
    git \
    # Clean up
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install yt-dlp
RUN pip install --no-cache-dir yt-dlp

# Create app user
RUN useradd --create-home --shell /bin/bash galion
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=galion:galion . .

# Create directories
RUN mkdir -p /app/downloads /app/data && \
    chown -R galion:galion /app

# Switch to non-root user
USER galion

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
