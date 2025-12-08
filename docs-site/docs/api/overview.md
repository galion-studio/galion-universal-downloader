---
sidebar_position: 1
---

# API Reference

Complete API documentation for Galion Universal Downloader.

## Overview

Galion provides several APIs for developers:

| API | Purpose | Auth Required |
|-----|---------|---------------|
| Download API | Download from any platform | No |
| Cognitive API | AI-powered features | Optional |
| Platform APIs | Platform-specific features | Varies |

## Base URL

```
# Local development
http://localhost:3000/api

# Production (future)
https://api.galion.app/v1
```

## Download API

### Start Download

```http
POST /api/download
```

**Request Body:**
```json
{
  "url": "https://civitai.com/models/12345",
  "options": {
    "filename": "custom-name.safetensors",
    "directory": "./downloads"
  }
}
```

**Response:**
```json
{
  "id": "dl_abc123",
  "status": "started",
  "filename": "model.safetensors",
  "platform": "civitai",
  "progress": 0
}
```

### Get Download Status

```http
GET /api/download/:id
```

**Response:**
```json
{
  "id": "dl_abc123",
  "status": "downloading",
  "progress": 45.5,
  "bytesDownloaded": 1234567890,
  "totalBytes": 2717908992,
  "speed": "15.2 MB/s"
}
```

### Cancel Download

```http
DELETE /api/download/:id
```

**Response:**
```json
{
  "id": "dl_abc123",
  "status": "cancelled"
}
```

## Batch Downloads

### Download Multiple Files

```http
POST /api/batch-download
```

**Request Body:**
```json
{
  "urls": [
    "https://civitai.com/models/12345",
    "https://github.com/user/repo",
    "https://huggingface.co/model/name"
  ]
}
```

**Response:**
```json
{
  "batchId": "batch_xyz789",
  "downloads": [
    { "id": "dl_001", "url": "...", "status": "queued" },
    { "id": "dl_002", "url": "...", "status": "queued" },
    { "id": "dl_003", "url": "...", "status": "queued" }
  ]
}
```

## Platform Detection

### Detect Platform

```http
POST /api/detect
```

**Request Body:**
```json
{
  "url": "https://civitai.com/models/12345"
}
```

**Response:**
```json
{
  "platform": "civitai",
  "supported": true,
  "metadata": {
    "modelId": "12345",
    "modelName": "Sample Model",
    "type": "checkpoint"
  }
}
```

## Cognitive API

### Semantic Search

```http
POST /api/cognitive/search
```

**Request Body:**
```json
{
  "query": "anime style models",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "file_001",
      "filename": "anime-style-v2.safetensors",
      "score": 0.95,
      "tags": ["anime", "style", "lora"]
    }
  ]
}
```

### Generate Knowledge Graph

```http
GET /api/cognitive/graph
```

**Response:**
```json
{
  "nodes": [
    { "id": "1", "label": "Model A", "type": "checkpoint" },
    { "id": "2", "label": "LoRA B", "type": "lora" }
  ],
  "edges": [
    { "from": "1", "to": "2", "relation": "compatible_with" }
  ]
}
```

## WebSocket API

### Real-time Download Progress

```javascript
const ws = new WebSocket('ws://localhost:3000/ws')

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    downloadId: 'dl_abc123'
  }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log(`Progress: ${data.progress}%`)
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "The provided URL is not valid",
    "details": {
      "url": "not-a-valid-url"
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_URL` | URL format is invalid |
| `PLATFORM_NOT_SUPPORTED` | Platform not recognized |
| `DOWNLOAD_FAILED` | Download could not complete |
| `RATE_LIMITED` | Too many requests |
| `FILE_NOT_FOUND` | Resource doesn't exist |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/download` | 100 | 1 hour |
| `/api/batch-download` | 10 | 1 hour |
| `/api/cognitive/*` | 50 | 1 hour |

## SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @galion/downloader
```

```typescript
import { GalionDownloader } from '@galion/downloader'

const galion = new GalionDownloader()
await galion.download('https://civitai.com/models/12345')
```

### Python (Coming Soon)

```bash
pip install galion
```

```python
from galion import Downloader

dl = Downloader()
dl.download("https://civitai.com/models/12345")
```

## Next Steps

- [Platform-specific APIs](./platforms) - Detailed platform documentation
- [Authentication](./authentication) - Set up API keys
- [Webhooks](./webhooks) - Receive download notifications
