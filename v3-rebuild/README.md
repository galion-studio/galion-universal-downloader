# Galion Universal Downloader v3

A universal content downloader with 36+ platform support, resumable downloads, and GPU-accelerated AI transcription.

Built with **FastAPI** for RunPod deployment.

## Features

- 🎬 **36+ Platforms**: YouTube, TikTok, Instagram, Twitter, Reddit, GitHub, CivitAI, HuggingFace, and more
- ⏸️ **Resumable Downloads**: HTTP Range support with SHA-256 checksum verification
- 🔄 **Queue System**: Redis-based job queue with priority and retry logic
- 🎙️ **AI Transcription**: GPU-accelerated Whisper transcription (SRT, VTT, TXT)
- 🔐 **Secure API Keys**: AES-256-GCM encrypted credential storage
- 📡 **Real-time Updates**: WebSocket progress streaming
- 🐳 **Docker Ready**: CPU and GPU Dockerfiles included
- 🚀 **RunPod Optimized**: Ready for serverless GPU deployment

## Quick Start

### Local Development

```bash
# Clone and navigate
cd galion-universal-downloader/v3-rebuild

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run with SQLite (no external dependencies)
uvicorn app.main:app --reload
```

### Docker

```bash
# Build and run
cd docker
docker-compose up -d

# View logs
docker-compose logs -f galion
```

### RunPod Deployment

```bash
# Build GPU image
docker build -f docker/Dockerfile.gpu -t galion-downloader:gpu .

# Push to registry
docker tag galion-downloader:gpu your-registry/galion-downloader:gpu
docker push your-registry/galion-downloader:gpu
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/downloads` | Create download job |
| `GET` | `/api/v1/downloads` | List downloads |
| `GET` | `/api/v1/downloads/{id}` | Get download status |
| `DELETE` | `/api/v1/downloads/{id}` | Cancel/delete download |
| `POST` | `/api/v1/parse` | Parse URL and detect platform |
| `GET` | `/api/v1/platforms` | List supported platforms |
| `GET` | `/api/v1/queue` | Queue statistics |
| `GET` | `/api/v1/files` | Browse downloads |
| `POST` | `/api/v1/transcribe` | Create transcription job |
| `GET` | `/api/v1/health` | Health check |

## WebSocket

Connect to `/ws` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

// Subscribe to job progress
ws.send(JSON.stringify({
  type: 'subscribe',
  job_ids: ['job-uuid-here']
}));

// Receive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.percent);
};
```

## Configuration

Key environment variables:

```env
# Core
GALION_ENV=production
GALION_SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/galion

# Redis
REDIS_URL=redis://localhost:6379/0

# Storage
DOWNLOADS_DIR=/app/downloads

# GPU/AI
WHISPER_MODEL=tiny.en
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16
```

See `.env.example` for all options.

## Supported Platforms

| Category | Platforms |
|----------|-----------|
| **Video** | YouTube, Vimeo, Dailymotion, Twitch |
| **Social** | TikTok, Instagram, Twitter/X, Reddit, Pinterest |
| **AI/ML** | CivitAI, HuggingFace, GitHub |
| **News** | 200+ news sites (BBC, CNN, NYT, etc.) |
| **Archives** | Archive.org, Wayback Machine |
| **Messaging** | Telegram |
| **Generic** | Direct files, 1000+ sites via yt-dlp |

## Project Structure

```
v3-rebuild/
├── app/
│   ├── api/           # FastAPI routes
│   ├── core/          # Download engine, queue, workers
│   ├── models/        # SQLAlchemy models
│   ├── platforms/     # Platform handlers
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Transcription, etc.
│   ├── config.py      # Settings
│   └── main.py        # Application entry
├── docker/            # Docker files
├── requirements.txt   # Dependencies
└── .env.example       # Environment template
```

## License

MIT License - see LICENSE file.

---

Built by **Galion Studio** 🚀
