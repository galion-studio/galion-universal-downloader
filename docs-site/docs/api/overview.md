---
sidebar_position: 1
---

# 🚀 API Reference

<div align="center">

### **Build Amazing Things with the Galion API** 

*One API to download them all. Simple. Powerful. Free.*

</div>

---

## 🎯 Quick Overview

The Galion API is your gateway to downloading content from **36+ platforms** with a single, unified interface. Whether you're building a download manager, archival tool, or automation script — we've got you covered.

```
┌─────────────────────────────────────────────────────────────────┐
│                    🏴‍☠️ GALION API v2.0                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your App  ──►  POST /api/download  ──►  Downloaded Content     │
│                                                                 │
│  That's it. Really. It's that simple.                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Base URL & Connection

### Local Development
```
http://localhost:4444/api
```

### WebSocket (Real-time Updates)
```
ws://localhost:4444
```

### Docker
```bash
# API available at the same port when running in Docker
docker-compose up -d
# Access: http://localhost:4444/api
```

---

## 🔐 Authentication

**Good news!** Most endpoints work **without authentication**. 

However, some platforms work better (or only work) with API keys:

| Platform | API Key Required? | Why You'd Want One |
|----------|-------------------|-------------------|
| **CivitAI** | Optional | Access NSFW content, higher rate limits |
| **GitHub** | Optional | Higher rate limits (5000 vs 60 requests/hour) |
| **Telegram** | Optional | Access private channels |
| **HuggingFace** | Optional | Private repos, gated models |

### Setting Up API Keys

```bash
# Save an API key for a platform
curl -X POST http://localhost:4444/api/keys/civitai \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-super-secret-key"}'
```

---

## 📡 Core Endpoints

### 🟢 GET `/api/status`

**What it does:** Returns server health, version, and what's available.

**When to use:** Health checks, initial setup verification, dashboard stats.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl http://localhost:4444/api/status
```

**Response:**
```json
{
  "status": "online",
  "version": "2.0.0",
  "platforms": [
    {
      "id": "youtube",
      "name": "YouTube",
      "patterns": ["youtube.com", "youtu.be"],
      "features": ["videos", "playlists", "channels", "shorts"]
    },
    {
      "id": "civitai",
      "name": "CivitAI",
      "patterns": ["civitai.com"],
      "features": ["models", "images", "articles", "profiles"]
    }
    // ... 34+ more platforms
  ],
  "downloads": {
    "total": 1337,
    "today": 42,
    "thisWeek": 256
  },
  "configuredKeys": ["civitai", "github"]
}
```

</details>

---

### 🟢 GET `/api/platforms`

**What it does:** Lists all supported platforms with their capabilities.

**When to use:** Building platform selectors, showing supported sites to users.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl http://localhost:4444/api/platforms
```

**Response:**
```json
[
  {
    "id": "youtube",
    "name": "YouTube",
    "icon": "🎬",
    "patterns": ["youtube.com", "youtu.be", "youtube.com/shorts"],
    "features": ["videos", "playlists", "channels", "shorts", "live"],
    "authentication": "optional",
    "maxQuality": "8K",
    "formats": ["mp4", "webm", "mp3", "m4a"]
  },
  {
    "id": "civitai",
    "name": "CivitAI",
    "icon": "🎨",
    "patterns": ["civitai.com"],
    "features": ["models", "loras", "images", "articles", "profiles"],
    "authentication": "optional",
    "fileTypes": [".safetensors", ".ckpt", ".pt"]
  },
  {
    "id": "github",
    "name": "GitHub",
    "icon": "💻",
    "patterns": ["github.com"],
    "features": ["repos", "releases", "gists", "raw-files"],
    "authentication": "optional",
    "rateLimit": "60/hour (5000 with token)"
  }
  // ... and many more!
]
```

</details>

---

## 📥 Download Endpoints

### 🟡 POST `/api/download`

**What it does:** The heart of Galion — downloads content from any supported URL.

**When to use:** Downloading anything! Videos, images, models, repos, you name it.

> 💡 **Pro Tip:** This endpoint uses **streaming responses** (NDJSON) so you can show real-time progress to your users!

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl -X POST http://localhost:4444/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://civitai.com/models/12345",
    "options": {
      "downloadFiles": true
    }
  }'
```

**Streaming Response (NDJSON — one JSON per line):**
```json
{"type": "progress", "status": "Detecting platform...", "progress": 5}
{"type": "progress", "status": "Detected: civitai - model", "progress": 10, "platform": "civitai", "contentType": "model"}
{"type": "progress", "status": "Fetching content...", "progress": 20}
{"type": "progress", "status": "Downloading: model.safetensors", "progress": 50}
{"type": "progress", "status": "Downloading: preview.png", "progress": 75}
{"type": "progress", "status": "Complete!", "progress": 100}
{"type": "complete", "result": {
  "success": true,
  "platform": "civitai",
  "contentType": "model",
  "title": "Amazing AI Model",
  "outputDir": "C:/Users/You/Downloads/Galion/civitai_model_Amazing-AI-Model",
  "files": [
    {"name": "model.safetensors", "size": 2147483648, "downloaded": true},
    {"name": "preview.png", "size": 1048576, "downloaded": true}
  ],
  "metadata": {
    "modelId": 12345,
    "creator": "awesome_creator",
    "downloads": 50000,
    "rating": 4.9
  }
}}
```

</details>

#### Request Body Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ Yes | The URL to download from |
| `options.downloadFiles` | boolean | No | Download actual files (default: `true`) |
| `options.quality` | string | No | Video quality: `best`, `1080p`, `720p`, etc. |
| `options.format` | string | No | Output format: `mp4`, `mp3`, `webm`, etc. |
| `options.includeMetadata` | boolean | No | Save metadata JSON (default: `true`) |

---

### 🟡 POST `/api/download/batch`

**What it does:** Download multiple URLs in one request. Perfect for bulk operations!

**When to use:** Downloading entire playlists, multiple models, or any list of URLs.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl -X POST http://localhost:4444/api/download/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://civitai.com/models/111",
      "https://civitai.com/models/222",
      "https://github.com/user/awesome-repo"
    ],
    "options": {
      "downloadFiles": true
    }
  }'
```

**Response:**
```json
{
  "results": [
    {
      "url": "https://civitai.com/models/111",
      "success": true,
      "title": "Model One",
      "outputDir": "..."
    },
    {
      "url": "https://civitai.com/models/222",
      "success": true,
      "title": "Model Two",
      "outputDir": "..."
    },
    {
      "url": "https://github.com/user/awesome-repo",
      "success": true,
      "title": "awesome-repo",
      "outputDir": "..."
    }
  ],
  "success": 3,
  "failed": 0
}
```

</details>

---

### 🟡 POST `/api/download/gallery`

**What it does:** Download entire galleries or collections from a platform.

**When to use:** Downloading all images from an artist's page, all posts from a subreddit, etc.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl -X POST http://localhost:4444/api/download/gallery \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://civitai.com/user/awesome_artist/images",
    "options": {
      "limit": 100
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "platform": "civitai",
  "contentType": "gallery",
  "totalItems": 89,
  "downloaded": 89,
  "outputDir": "C:/Users/You/Downloads/Galion/civitai_gallery_awesome_artist",
  "items": [
    {"filename": "image_001.png", "url": "...", "downloaded": true},
    {"filename": "image_002.png", "url": "...", "downloaded": true}
    // ... more items
  ]
}
```

</details>

---

### 🟡 POST `/api/download/profile`

**What it does:** Download all content from a user's profile.

**When to use:** Archiving an entire creator's portfolio, backing up your own content.

---

### 🟡 POST `/api/download/file`

**What it does:** Direct file download with resume support.

**When to use:** Downloading specific files when you already have the direct URL.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl -X POST http://localhost:4444/api/download/file \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/large-file.zip",
    "filename": "my-custom-name.zip"
  }'
```

**Response:**
```json
{
  "success": true,
  "filename": "my-custom-name.zip",
  "size": 1073741824,
  "path": "C:/Users/You/Downloads/Galion/my-custom-name.zip",
  "downloadTime": 45.2,
  "speed": "23.7 MB/s"
}
```

</details>

---

## 🔍 Parse & Info Endpoints

### 🟡 POST `/api/parse`

**What it does:** Analyzes a URL without downloading — tells you what type of content it is.

**When to use:** Pre-flight checks, showing users what they're about to download, building preview cards.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl -X POST http://localhost:4444/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/user/repo/releases/tag/v2.0.0"}'
```

**Response:**
```json
{
  "platformId": "github",
  "platformName": "GitHub",
  "contentType": "release",
  "url": "https://github.com/user/repo/releases/tag/v2.0.0",
  "parsed": {
    "owner": "user",
    "repo": "repo",
    "ref": "v2.0.0",
    "type": "release"
  },
  "supportedFeatures": ["download", "metadata", "assets"],
  "estimatedSize": "~50 MB (3 assets)"
}
```

</details>

---

## 📚 History & Management

### 🟢 GET `/api/history`

**What it does:** Returns your download history with metadata.

**When to use:** Building a download manager UI, showing recent downloads.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl http://localhost:4444/api/history
```

**Response:**
```json
[
  {
    "folder": "civitai_model_Amazing-Model",
    "path": "C:/Users/You/Downloads/Galion/civitai_model_Amazing-Model",
    "createdAt": "2025-12-09T15:30:00.000Z",
    "size": 2147483648,
    "metadata": {
      "title": "Amazing Model",
      "platform": "civitai",
      "contentType": "model",
      "creator": "awesome_creator"
    }
  },
  {
    "folder": "youtube_video_Cool-Video",
    "path": "C:/Users/You/Downloads/Galion/youtube_video_Cool-Video",
    "createdAt": "2025-12-09T14:00:00.000Z",
    "size": 524288000,
    "metadata": {
      "title": "Cool Video",
      "platform": "youtube",
      "contentType": "video",
      "duration": "12:34"
    }
  }
]
```

</details>

---

### 🔴 DELETE `/api/history/:folder`

**What it does:** Deletes a download from history AND from disk.

**⚠️ Warning:** This permanently deletes the files!

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl -X DELETE http://localhost:4444/api/history/civitai_model_Old-Model
```

**Response:**
```json
{
  "success": true,
  "deleted": "civitai_model_Old-Model"
}
```

</details>

---

### 🟡 POST `/api/open-folder`

**What it does:** Opens a folder in your system's file explorer.

**When to use:** "Show in Explorer/Finder" buttons in your UI.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl -X POST http://localhost:4444/api/open-folder \
  -H "Content-Type: application/json" \
  -d '{"path": "C:/Users/You/Downloads/Galion/my-download"}'
```

**Response:**
```json
{
  "success": true
}
```

</details>

---

### 🟡 POST `/api/download-zip`

**What it does:** Creates a ZIP archive of a download folder and streams it to you.

**When to use:** "Download as ZIP" functionality for sharing or backup.

---

## 🔑 API Key Management

### 🟢 GET `/api/keys`

**What it does:** Shows which platforms have API keys configured.

**Response:**
```json
{
  "civitai": true,
  "github": true,
  "telegram": false,
  "huggingface": false
}
```

---

### 🟡 POST `/api/keys/:platform`

**What it does:** Saves an API key for a platform (validates first).

<details>
<summary>📝 <strong>Example</strong></summary>

**Request:**
```bash
curl -X POST http://localhost:4444/api/keys/civitai \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-civitai-api-key"}'
```

**Response (Success):**
```json
{
  "success": true,
  "valid": true,
  "message": "API key saved",
  "user": {
    "username": "your_username",
    "tier": "supporter"
  }
}
```

**Response (Invalid Key):**
```json
{
  "success": false,
  "error": "Invalid API key - authentication failed"
}
```

</details>

---

### 🔴 DELETE `/api/keys/:platform`

**What it does:** Removes a saved API key.

---

### 🟡 POST `/api/keys/:platform/verify`

**What it does:** Tests an API key without saving it.

---

## 🎙️ Transcription Endpoints

Galion includes built-in AI transcription powered by **Whisper**!

### 🟢 GET `/api/transcribe/status`

**What it does:** Shows transcription service status.

<details>
<summary>📝 <strong>Example Response</strong></summary>

```json
{
  "backend": "faster-whisper",
  "backendInstalled": true,
  "ffmpegInstalled": true,
  "defaultModel": "tiny.en",
  "currentModel": "tiny.en",
  "initialized": true,
  "recommendation": "Install faster-whisper: pip install faster-whisper"
}
```

</details>

---

### 🟡 POST `/api/transcribe`

**What it does:** Transcribe a video or audio file to text/subtitles.

<details>
<summary>📝 <strong>Example Request & Response</strong></summary>

**Request:**
```bash
curl -X POST http://localhost:4444/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "C:/path/to/video.mp4",
    "language": "en",
    "model": "tiny.en",
    "formats": ["srt", "vtt", "txt"]
  }'
```

**Streaming Response:**
```json
{"type": "progress", "status": "Extracting audio...", "progress": 10}
{"type": "progress", "status": "Transcribing...", "progress": 50}
{"type": "progress", "status": "Generating subtitles...", "progress": 90}
{"type": "complete", "success": true, "outputs": [
  "video.srt",
  "video.vtt",
  "video.txt"
]}
```

</details>

---

### 🟢 GET `/api/transcribe/models`

**What it does:** Lists available Whisper models.

**Response:**
```json
{
  "models": {
    "tiny.en": {"size": "75 MB", "speed": "fastest", "accuracy": "basic"},
    "base.en": {"size": "150 MB", "speed": "fast", "accuracy": "good"},
    "small.en": {"size": "500 MB", "speed": "medium", "accuracy": "great"},
    "medium.en": {"size": "1.5 GB", "speed": "slow", "accuracy": "excellent"},
    "large-v3": {"size": "3 GB", "speed": "slowest", "accuracy": "best"}
  },
  "recommended": "tiny.en",
  "current": "tiny.en"
}
```

---

### 🟡 POST `/api/transcribe/quick`

**What it does:** Quick transcription with default settings (tiny.en, English, SRT + VTT).

---

### 🟡 POST `/api/transcribe/batch`

**What it does:** Transcribe all videos in a directory that don't have subtitles yet.

---

## 🔍 File Scanner Endpoints

Powerful tools for analyzing your downloads and finding files.

### 🟡 POST `/api/scan`

**What it does:** Scans a directory and returns detailed statistics.

<details>
<summary>📝 <strong>Example Response</strong></summary>

```json
{
  "path": "C:/Users/You/Downloads/Galion",
  "totalFiles": 1234,
  "totalSize": 107374182400,
  "totalSizeFormatted": "100 GB",
  "byExtension": {
    ".safetensors": {"count": 50, "size": 107374182400},
    ".png": {"count": 500, "size": 536870912},
    ".mp4": {"count": 100, "size": 53687091200}
  },
  "byCategory": {
    "models": {"count": 50, "size": 107374182400},
    "images": {"count": 500, "size": 536870912},
    "videos": {"count": 100, "size": 53687091200}
  },
  "largestFiles": [
    {"name": "huge_model.safetensors", "size": 10737418240, "path": "..."}
  ]
}
```

</details>

---

### 🟢 GET `/api/scan/media?path=...`

**What it does:** Finds all media files (video/audio) in a directory.

---

### 🟢 GET `/api/scan/models?path=...`

**What it does:** Finds AI model files (.safetensors, .ckpt, .pt, etc.).

---

### 🟢 GET `/api/scan/needs-transcription?path=...`

**What it does:** Finds videos that don't have subtitle files yet.

---

## 📧 Email Scanner Endpoints

Scan and export emails from any IMAP provider.

### 🟢 GET `/api/email/providers`

**What it does:** Lists supported email providers with their IMAP settings.

---

### 🟡 POST `/api/email/detect`

**What it does:** Detects the email provider from an email address.

**Request:**
```json
{"email": "user@gmail.com"}
```

**Response:**
```json
{
  "email": "user@gmail.com",
  "provider": "gmail",
  "host": "imap.gmail.com",
  "port": 993,
  "instructions": "Enable 'Less secure app access' or use an App Password"
}
```

---

## 📄 Template & PDF Endpoints

Generate beautiful documents and templates.

### 🟢 GET `/api/templates`

**What it does:** Lists available document templates.

---

### 🟡 POST `/api/templates/research`

**What it does:** Generates a research paper template.

---

### 🟡 POST `/api/templates/visual`

**What it does:** Generates visual templates (posters, infographics, slides).

---

## 📊 Supported Formats

### 🟢 GET `/api/formats`

**What it does:** Returns all supported file formats.

<details>
<summary>📝 <strong>Full Response</strong></summary>

```json
{
  "video": [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v", ".mpeg", ".mpg", ".3gp", ".ts"],
  "audio": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".opus", ".aiff"],
  "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico", ".tiff", ".raw", ".psd"],
  "model": [".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".onnx", ".h5", ".pkl"],
  "subtitle": [".srt", ".vtt", ".ass", ".ssa", ".sub"],
  "document": [".pdf", ".doc", ".docx", ".txt", ".md", ".rtf"],
  "archive": [".zip", ".rar", ".7z", ".tar", ".gz"],
  "code": [".js", ".ts", ".py", ".java", ".cpp", ".html", ".css", ".json"],
  "videoCodecs": ["h264", "h265", "hevc", "vp8", "vp9", "av1", "mpeg4", "xvid"],
  "audioCodecs": ["aac", "mp3", "opus", "vorbis", "flac", "alac", "pcm", "ac3", "dts"],
  "containers": ["mp4", "mkv", "webm", "avi", "mov", "flv", "ts", "ogg"]
}
```

</details>

---

## 🔌 WebSocket API

For real-time progress updates, connect to the WebSocket server!

### Connection
```javascript
const ws = new WebSocket('ws://localhost:4444');

ws.onopen = () => {
  console.log('🟢 Connected to Galion!');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'progress':
      console.log(`📥 ${data.status} - ${data.progress}%`);
      break;
    case 'complete':
      console.log('✅ Download complete!', data.result);
      break;
    case 'error':
      console.error('❌ Error:', data.message);
      break;
  }
};

ws.onclose = () => {
  console.log('🔴 Disconnected');
};
```

### Event Types

| Event | Description |
|-------|-------------|
| `progress` | Download progress update |
| `complete` | Download finished successfully |
| `error` | An error occurred |
| `batch-progress` | Progress for batch downloads |
| `transcription-progress` | Transcription progress |
| `model-download-progress` | Whisper model download progress |
| `scan-progress` | File scan progress |

---

## ❌ Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | ✅ Success |
| `400` | ⚠️ Bad Request — Check your parameters |
| `404` | 🔍 Not Found — Resource doesn't exist |
| `500` | 💥 Server Error — Something went wrong on our end |

### Common Errors

```json
// Missing URL
{"error": "URL is required"}

// Unsupported platform
{"error": "No platform found for URL: https://example.com"}

// Rate limited
{"error": "Rate limit exceeded. Please wait and try again."}

// Invalid API key
{"error": "Invalid API key - authentication failed"}

// File not found
{"error": "File not found: /path/to/file"}
```

---

## 🎨 Code Examples

### JavaScript/Node.js

```javascript
// Simple download
const response = await fetch('http://localhost:4444/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
  })
});

// Handle streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const lines = decoder.decode(value).split('\n').filter(Boolean);
  for (const line of lines) {
    const data = JSON.parse(line);
    console.log(`${data.status} - ${data.progress}%`);
  }
}
```

### Python

```python
import requests
import json

# Simple download
response = requests.post(
    'http://localhost:4444/api/download',
    json={'url': 'https://civitai.com/models/12345'},
    stream=True
)

# Handle streaming response
for line in response.iter_lines():
    if line:
        data = json.loads(line)
        print(f"{data.get('status', '')} - {data.get('progress', 0)}%")
```

### cURL

```bash
# Download a YouTube video
curl -X POST http://localhost:4444/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'

# Get download history
curl http://localhost:4444/api/history | jq

# Set CivitAI API key
curl -X POST http://localhost:4444/api/keys/civitai \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-key-here"}'
```

---

## 🚀 Rate Limits

**Galion itself has no rate limits!** However, the underlying platforms do:

| Platform | Rate Limit | With API Key |
|----------|------------|--------------|
| **GitHub** | 60/hour | 5,000/hour |
| **CivitAI** | ~100/hour | ~500/hour |
| **YouTube** | No fixed limit | N/A |
| **Instagram** | Be careful! | Use sessions |

> 💡 **Tip:** For heavy usage, always use API keys when available. Galion includes built-in rate limiting to be respectful to platforms.

---

## 🎯 Best Practices

1. **Always handle errors gracefully** — Platforms can be flaky!
2. **Use WebSocket for progress** — Better UX than polling
3. **Set API keys for heavy usage** — Better rate limits
4. **Use batch endpoints** — More efficient than individual requests
5. **Check `/api/parse` first** — Know what you're downloading before you download

---

## 🆘 Need Help?

- 📖 [Full Documentation](https://galion-studio.github.io/galion-universal-downloader/)
- 🐛 [Report a Bug](https://github.com/galion-studio/galion-universal-downloader/issues)
- 💬 [Discussions](https://github.com/galion-studio/galion-universal-downloader/discussions)
- 🌐 [Galion Studio](https://galion.studio)

---

<div align="center">

**Built with ❤️ by digital freedom advocates**

*"One API to download them all"*

🏴‍☠️

</div>
