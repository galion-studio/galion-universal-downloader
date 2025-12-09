# API Overview

The Galion Universal Downloader API provides a RESTful interface for downloading content from 36+ platforms.

## Base URL

```
http://localhost:4444/api
```

## Authentication

Most endpoints work without authentication. Some platforms require API keys configured in the Settings.

---

## Core Endpoints

### GET /api/status

Returns server status and available platforms.

**Response:**
```json
{
  "status": "online",
  "version": "2.0.0",
  "platforms": [...],
  "downloads": { "total": 100, "today": 5 },
  "configuredKeys": ["civitai", "github"]
}
```

### GET /api/platforms

Returns all registered platforms with their capabilities.

**Response:**
```json
[
  {
    "id": "civitai",
    "name": "CivitAI",
    "patterns": ["civitai.com"],
    "features": ["models", "images", "articles", "profiles"],
    "hasApiKey": true
  },
  ...
]
```

---

## Download Endpoints

### POST /api/download

Start a download with streaming progress.

**Request:**
```json
{
  "url": "https://civitai.com/models/12345",
  "options": {
    "downloadFiles": true
  }
}
```

**Response (streaming NDJSON):**
```json
{"type": "progress", "status": "Detecting platform...", "progress": 5}
{"type": "progress", "status": "Detected: civitai - model", "progress": 10}
{"type": "progress", "status": "Downloading...", "progress": 50}
{"type": "complete", "result": {"success": true, "outputDir": "..."}}
```

### POST /api/download/batch

Download multiple URLs at once.

**Request:**
```json
{
  "urls": [
    "https://civitai.com/models/123",
    "https://github.com/user/repo"
  ],
  "options": {}
}
```

### POST /api/download/gallery

Download gallery/batch content from a platform.

### POST /api/download/profile

Download all content from a user profile.

---

## Parse Endpoints

### POST /api/parse

Parse a URL and detect platform/content type.

**Request:**
```json
{
  "url": "https://github.com/user/repo/releases/tag/v1.0"
}
```

**Response:**
```json
{
  "platformId": "github",
  "contentType": "release",
  "url": "https://github.com/user/repo/releases/tag/v1.0",
  "owner": "user",
  "repo": "repo",
  "ref": "v1.0"
}
```

---

## History Endpoints

### GET /api/history

Get download history.

**Response:**
```json
[
  {
    "folder": "civitai_model_MyModel",
    "path": "C:\\Users\\...\\Downloads\\Galion\\civitai_model_MyModel",
    "createdAt": "2025-12-09T01:00:00.000Z",
    "size": 5242880,
    "metadata": {
      "title": "My Model",
      "platform": "civitai"
    }
  }
]
```

### DELETE /api/history/:folder

Delete a download from history (and disk).

### POST /api/open-folder

Open a folder in the system file explorer.

**Request:**
```json
{
  "path": "C:\\Users\\...\\Downloads\\Galion\\my-download"
}
```

---

## API Key Endpoints

### GET /api/keys

Get configured API keys (masked).

**Response:**
```json
{
  "civitai": true,
  "github": true,
  "telegram": false
}
```

### POST /api/keys/:platform

Set/update an API key for a platform.

**Request:**
```json
{
  "apiKey": "your-api-key-here"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "message": "API key saved"
}
```

### DELETE /api/keys/:platform

Delete an API key.

### POST /api/keys/:platform/verify

Verify an API key without saving it.

---

## Transcription Endpoints

### GET /api/transcribe/status

Get transcription service status.

**Response:**
```json
{
  "backend": "faster-whisper",
  "backendInstalled": true,
  "ffmpegInstalled": true,
  "defaultModel": "tiny.en",
  "currentModel": "tiny.en",
  "initialized": true
}
```

### POST /api/transcribe/init

Initialize the transcription service.

### GET /api/transcribe/models

Get available Whisper models.

**Response:**
```json
{
  "models": {
    "tiny.en": { "size": "75 MB", "speed": "fastest" },
    "base.en": { "size": "150 MB", "speed": "fast" },
    "small.en": { "size": "500 MB", "speed": "medium" }
  },
  "recommended": "tiny.en"
}
```

### POST /api/transcribe

Transcribe a video/audio file.

**Request:**
```json
{
  "filePath": "C:\\path\\to\\video.mp4",
  "language": "en",
  "model": "tiny.en",
  "formats": ["srt", "vtt", "txt"]
}
```

### GET /api/transcribe/install

Get installation instructions for transcription.

---

## File Scanner Endpoints

### POST /api/scan

Scan a directory and get file statistics.

### POST /api/scan/find

Find files matching a pattern.

### GET /api/scan/media?path=...

Find media files in a directory.

### GET /api/scan/models?path=...

Find AI model files (.safetensors, .ckpt, etc).

### GET /api/scan/needs-transcription?path=...

Find videos without subtitle files.

---

## WebSocket

Connect to `ws://localhost:4444` for real-time updates.

**Events:**
- `progress` - Download progress updates
- `complete` - Download completed
- `error` - Download error
- `batch-progress` - Batch download progress
- `transcription-progress` - Transcription progress

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid parameters)
- `404` - Not found
- `500` - Server error
