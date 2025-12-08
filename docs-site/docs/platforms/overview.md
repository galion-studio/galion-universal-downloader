---
sidebar_position: 1
---

# Supported Platforms

Galion Universal Downloader supports 6+ platforms and growing. Here's everything you need to know about each one.

## Platform Overview

| Platform | Status | Auth Required | Features |
|----------|--------|---------------|----------|
| 🎨 CivitAI | ✅ Full | Optional | Models, LoRAs, Embeddings |
| 🐙 GitHub | ✅ Full | Optional | Repos, Releases, Raw files |
| 🎬 YouTube | ✅ Full | No | Videos, Audio |
| 📱 Telegram | ✅ Full | Yes | Channel files, Media |
| 🤗 HuggingFace | ✅ Full | Optional | Models, Datasets, Spaces |
| 🌐 Generic | ✅ Full | No | Any direct URL |

---

## 🎨 CivitAI

### Supported URLs

```
https://civitai.com/models/12345
https://civitai.com/models/12345/model-name
https://civitai.com/api/download/models/12345
```

### Features

- ✅ Checkpoint downloads
- ✅ LoRA downloads
- ✅ Embedding downloads
- ✅ Textual Inversions
- ✅ Model metadata extraction
- ✅ Multiple version support

### API Key Benefits

With a CivitAI API key:
- Faster download speeds
- No rate limiting
- Access to member-only models

### Example

```typescript
// Auto-detects CivitAI
galion.download('https://civitai.com/models/12345')

// With metadata
galion.download('https://civitai.com/models/12345', {
  includeMetadata: true
})
```

---

## 🐙 GitHub

### Supported URLs

```
https://github.com/user/repo
https://github.com/user/repo/releases/latest
https://github.com/user/repo/archive/refs/heads/main.zip
https://raw.githubusercontent.com/user/repo/main/file.txt
```

### Features

- ✅ Full repository downloads
- ✅ Specific branch downloads
- ✅ Release asset downloads
- ✅ Raw file downloads
- ✅ Private repos (with token)

### API Key Benefits

With a GitHub token:
- Higher rate limits (5000/hour vs 60/hour)
- Access to private repositories
- Faster API responses

### Example

```typescript
// Download whole repo
galion.download('https://github.com/facebook/react')

// Download latest release
galion.download('https://github.com/user/repo/releases/latest')
```

---

## 🎬 YouTube

### Supported URLs

```
https://youtube.com/watch?v=abc123
https://www.youtube.com/watch?v=abc123
https://youtu.be/abc123
https://youtube.com/playlist?list=PLxyz
```

### Features

- ✅ Video downloads
- ✅ Audio extraction (MP3)
- ✅ Multiple quality options
- ✅ Playlist support
- ✅ Subtitles download

### Quality Options

```typescript
galion.download('https://youtube.com/watch?v=abc123', {
  quality: '1080p',  // '4k', '1080p', '720p', '480p', 'audio'
  format: 'mp4'      // 'mp4', 'webm', 'mp3'
})
```

---

## 📱 Telegram

### Supported URLs

```
https://t.me/channel_name/123
https://t.me/c/1234567890/123
https://t.me/username/123
```

### Features

- ✅ Channel file downloads
- ✅ Media downloads
- ✅ Document downloads
- ✅ Voice messages
- ✅ Video notes

### Requirements

Telegram requires authentication:

1. Get your API credentials from [my.telegram.org](https://my.telegram.org)
2. Add to settings in Galion
3. First-time login via phone number

---

## 🤗 HuggingFace

### Supported URLs

```
https://huggingface.co/owner/model
https://huggingface.co/owner/model/blob/main/file.safetensors
https://hf.co/owner/model
https://huggingface.co/datasets/owner/dataset
https://huggingface.co/spaces/owner/space
```

### Features

- ✅ Model downloads
- ✅ Dataset downloads
- ✅ Specific file downloads
- ✅ LFS file support
- ✅ Private model access (with token)

### API Key Benefits

With a HuggingFace token:
- Access to private/gated models
- No rate limiting
- Faster downloads

### Example

```typescript
// Download full model
galion.download('https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0')

// Download specific file
galion.download('https://huggingface.co/owner/model/blob/main/model.safetensors')
```

---

## 🌐 Generic URLs

### Supported URLs

Any direct download URL:

```
https://example.com/file.zip
https://cdn.website.com/downloads/app.exe
http://files.domain.org/document.pdf
```

### Features

- ✅ Direct file downloads
- ✅ Content-Type detection
- ✅ Resume support
- ✅ Redirect following
- ✅ Authentication headers

### Example

```typescript
galion.download('https://example.com/large-file.zip', {
  resume: true,
  headers: {
    'Authorization': 'Bearer token'
  }
})
```

---

## Adding New Platforms

Want to add support for a new platform? Here's how:

### 1. Create Platform Handler

```typescript
// src/platforms/NewPlatform.ts

export class NewPlatformHandler {
  static name = 'newplatform'
  
  static canHandle(url: string): boolean {
    return url.includes('newplatform.com')
  }
  
  static async getMetadata(url: string): Promise<Metadata> {
    // Fetch and return metadata
  }
  
  static async download(url: string): Promise<DownloadResult> {
    // Implement download logic
  }
}
```

### 2. Register Platform

```typescript
// src/platforms/index.ts

import { NewPlatformHandler } from './NewPlatform'

export const platforms = [
  // ... existing platforms
  NewPlatformHandler,
]
```

### 3. Submit PR

We welcome contributions! See our [Contributing Guide](../about/contributing).

---

## Platform Roadmap

Coming soon:

- 🎵 SoundCloud - Audio downloads
- 🐦 Twitter/X - Media downloads
- 📷 Instagram - Posts and stories
- 🔵 Reddit - Gallery downloads
- 📁 Google Drive - File downloads
- 📦 Dropbox - File downloads

---

**Have a platform request?** [Open an issue](https://github.com/galion-studio/galion-universal-downloader/issues) on GitHub!
