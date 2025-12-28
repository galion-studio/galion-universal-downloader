#!/bin/bash
set -e

echo "🚀 Starting Galion Universal Downloader v3"
echo "================================================"

# Check for GPU
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
    export WHISPER_DEVICE="cuda"
else
    echo "⚠️  No GPU detected, using CPU mode"
    export WHISPER_DEVICE="cpu"
    export WHISPER_COMPUTE_TYPE="int8"
fi

# Create directories if they don't exist
mkdir -p /app/downloads /app/data /app/logs

# Wait for PostgreSQL if DATABASE_URL is set
if [[ -n "$DATABASE_URL" ]] && [[ "$DATABASE_URL" == postgresql* ]]; then
    echo "⏳ Waiting for PostgreSQL..."

    # Extract host from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_PORT=${DB_PORT:-5432}

    for i in {1..30}; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
            echo "✅ PostgreSQL is ready"
            break
        fi
        echo "   Waiting for PostgreSQL... ($i/30)"
        sleep 1
    done
fi

# Wait for Redis if REDIS_URL is set
if [[ -n "$REDIS_URL" ]]; then
    echo "⏳ Waiting for Redis..."

    # Extract host from REDIS_URL
    REDIS_HOST=$(echo $REDIS_URL | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
    REDIS_PORT=$(echo $REDIS_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    REDIS_PORT=${REDIS_PORT:-6379}

    for i in {1..30}; do
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
            echo "✅ Redis is ready"
            break
        fi
        echo "   Waiting for Redis... ($i/30)"
        sleep 1
    done
fi

echo "================================================"
echo "📁 Downloads directory: /app/downloads"
echo "🔧 Environment: ${GALION_ENV:-development}"
echo "🌐 API prefix: ${GALION_API_PREFIX:-/api/v1}"
echo "🎙️  Whisper model: ${WHISPER_MODEL:-tiny.en}"
echo "🖥️  Whisper device: ${WHISPER_DEVICE:-cuda}"
echo "================================================"

# Run migrations if needed
if [[ "$RUN_MIGRATIONS" == "true" ]]; then
    echo "🔄 Running database migrations..."
    python -m alembic upgrade head
fi

# Execute the main command
exec "$@"
