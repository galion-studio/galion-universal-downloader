<p align="center">
  <img src="galion-v2/public/galion-logo.png" alt="Galion Logo" width="180" style="border-radius: 20px;" />
</p>

<h1 align="center">🏴‍☠️ GALION UNIVERSAL DOWNLOADER</h1>

<p align="center">
  <strong>Download anything. From anywhere. Effortlessly.</strong>
</p>

<p align="center">
  <em>"Your Only Limit Is Your Imagination"</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="#-open-source-philosophy"><img src="https://img.shields.io/badge/Open%20Source-Forever-brightgreen.svg" alt="Open Source"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="#-supported-platforms"><img src="https://img.shields.io/badge/Platforms-36%2B-purple.svg" alt="Platforms"></a>
  <a href="#-the-philosophy"><img src="https://img.shields.io/badge/🏴‍☠️-Information%20Freedom-black.svg" alt="Information Freedom"></a>
</p>

<p align="center">
  <a href="https://galion-studio.github.io/galion-universal-downloader/">📖 Documentation</a> •
  <a href="#-30-second-quickstart">🚀 Quick Start</a> •
  <a href="#-api-reference">📡 API</a> •
  <a href="CONTRIBUTING.md">🤝 Contribute</a> •
  <a href="https://galion.studio">🌐 Website</a>
</p>

---

## 🎯 What is Galion?

**Galion** is a **free, open-source, universal content downloader** that lets you download anything from anywhere on the internet with a simple, unified API.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   🔗 Paste ANY URL  ──►  📥 Download ANYTHING  ──►  💾 Own Your Data│
│                                                                     │
│   ✓ YouTube, TikTok, Instagram, Twitter/X, Reddit                  │
│   ✓ CivitAI, HuggingFace, GitHub, GitLab                           │
│   ✓ Archive.org, News sites, RSS feeds                              │
│   ✓ Tor/.onion sites, Telegram, Pastebin                           │
│   ✓ ... and 36+ more platforms!                                     │
│                                                                     │
│   [══════════════════════════════════════════] 100% FREE & OPEN    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Galion?

| Problem | Galion's Solution |
|---------|------------------|
| 😤 Every platform needs a different tool | 🎯 **One tool for everything** |
| 💰 Most downloaders are paid/freemium | 💚 **100% free, forever** |
| 🔒 Closed-source = who knows what it does? | 🔓 **Fully open source (MIT)** |
| 📊 Trackers and telemetry everywhere | 🛡️ **Zero tracking, zero telemetry** |
| 💀 Content disappears, platforms die | 📦 **Archive everything locally** |
| 🤖 No AI features | 🧠 **Built-in Whisper transcription** |

---

## 🏴‍☠️ The Philosophy

> *"In a world where information is increasingly controlled, access is monetized, and content disappears overnight — we are the archivists."*

We believe:
- 📖 **Knowledge should be accessible to everyone** — Not locked behind corporate walls
- 🌍 **Information transcends borders and paywalls** — What's public should stay public
- 🔓 **Digital freedom is a fundamental right** — You have the right to your data
- 🤝 **Open source is the foundation of trust** — No hidden agendas, no backdoors
- 🔥 **If they close one door, a thousand more will open** — Decentralization wins

**This project is MIT Licensed and will ALWAYS remain open source.**

```
"The galaxy is not for sale. Neither is information."
                                        — The Galion Crew 🏴‍☠️
```

---

## 🚀 30-Second Quickstart

### Option 1: Local Installation

```bash
# Clone the ship
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader

# Install supplies
npm install

# Set sail! 🏴‍☠️
npm start
```

**Open:** http://localhost:4444

### Option 2: Docker

```bash
docker-compose up -d
```

**Open:** http://localhost:4444

### Option 3: First Download

```bash
# Download a YouTube video
curl -X POST http://localhost:4444/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**That's it!** Downloads go to `~/Downloads/Galion/`

---

## ✨ Key Features

### 🌐 Universal URL Support
Paste **any URL** from 36+ platforms. Galion auto-detects the platform, content type, and downloads in the best quality available.

### 🤖 AI-Powered Features
- **Whisper Transcription** — Auto-generate subtitles (SRT, VTT, TXT) for any video
- **Smart Content Detection** — Automatically identifies media types
- **Adaptive Scraping Engine** — Switches strategies when one fails

### ⚡ High Performance
- **Resumable Downloads** — Never lose progress, even on 50GB files
- **Parallel Connections** — Utilize your full bandwidth
- **Queue Management** — Download thousands of files concurrently
- **Worker Pool** — Efficient multi-threaded processing

### 🛡️ Privacy First
- **100% Local** — Everything stays on your machine
- **No Tracking** — Zero telemetry, zero analytics
- **No Accounts** — Works without registration
- **Encrypted Storage** — API keys stored securely

### 🔧 Developer Friendly
- **REST API** — Simple JSON endpoints for everything
- **WebSocket** — Real-time progress updates
- **Streaming Responses** — NDJSON for live progress
- **Docker Ready** — Deploy anywhere

---

## 🌊 Supported Platforms

**36+ platforms and growing!**

### Video & Streaming
| Platform | Status | Features |
|----------|--------|----------|
| **YouTube** | ✅ Full | Videos, Shorts, Playlists, Channels, Live, 8K |
| **TikTok** | ✅ Full | Videos, Slideshows, Sounds, Profiles |
| **Vimeo** | ✅ Full | Videos, Showcases, Channels |
| **Twitch** | ✅ Generic | VODs, Clips, Highlights |

### Social Media
| Platform | Status | Features |
|----------|--------|----------|
| **Instagram** | ✅ Full | Posts, Reels, Stories*, IGTV, Profiles |
| **Twitter/X** | ✅ Full | Tweets, Videos, GIFs, Threads |
| **Reddit** | ✅ Full | Posts, Videos, Galleries, Comments |

### AI & Creative
| Platform | Status | Features |
|----------|--------|----------|
| **CivitAI** | ✅ Full | Models, LoRAs, Images, Articles, Profiles |
| **HuggingFace** | ✅ Full | Models, Datasets, Spaces |

### Developer
| Platform | Status | Features |
|----------|--------|----------|
| **GitHub** | ✅ Full | Repos, Releases, Gists, Raw Files |
| **GitLab** | ✅ Generic | Repos, Releases |

### Archives & News
| Platform | Status | Features |
|----------|--------|----------|
| **Archive.org** | ✅ Full | Wayback Machine, Books, Media |
| **200+ News Sites** | ✅ Full | Articles, Images |
| **arXiv** | ✅ Full | Research Papers |

### Special
| Platform | Status | Features |
|----------|--------|----------|
| **Telegram** | ✅ Full | Channels, Files, Media |
| **Tor/.onion** | ✅ Full | Any hidden service (requires Tor) |

<details>
<summary><strong>📋 See All 36+ Platforms</strong></summary>

| Category | Platforms |
|----------|-----------|
| **Video** | YouTube, TikTok, Vimeo, Twitch, Dailymotion, Kick, Rumble, Odysee, PeerTube, Bilibili |
| **Social** | Instagram, Twitter/X, Reddit, Pinterest, Tumblr, Facebook*, LinkedIn* |
| **AI/Art** | CivitAI, HuggingFace, ArtStation, DeviantArt, Pixiv* |
| **Code** | GitHub, GitLab, Bitbucket, Gists |
| **Audio** | SoundCloud, Bandcamp, Spotify (metadata) |
| **Cloud** | Google Drive*, Dropbox, MEGA, MediaFire |
| **News** | BBC, CNN, NYT, Guardian, Reuters, + 195 more |
| **Archives** | Archive.org, arXiv, Wayback Machine |
| **Messaging** | Telegram, Discord* |
| **Adult** | PornHub, XVideos, xHamster, RedGIFs |
| **Special** | Tor/.onion, Pastebin, Any yt-dlp site |

\* = Requires authentication

</details>

**Legend:** ✅ Full = Native support | 🔄 Generic = via yt-dlp/scraping | 🔑 Auth = Needs API key

---

## 📡 API Reference

Galion exposes a powerful REST API at `http://localhost:4444/api`

### Quick Examples

```bash
# Download anything
curl -X POST http://localhost:4444/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://civitai.com/models/12345"}'

# Parse URL (get info without downloading)
curl -X POST http://localhost:4444/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/user/repo"}'

# Get server status
curl http://localhost:4444/api/status

# List all platforms
curl http://localhost:4444/api/platforms

# Get download history
curl http://localhost:4444/api/history
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Server status & stats |
| `GET` | `/api/platforms` | List all platforms |
| `POST` | `/api/parse` | Parse URL, get content info |
| `POST` | `/api/download` | Download content (streaming) |
| `POST` | `/api/download/batch` | Batch download URLs |
| `POST` | `/api/download/gallery` | Download profile/gallery |
| `GET` | `/api/history` | Download history |
| `POST` | `/api/transcribe` | Transcribe video/audio |
| `POST` | `/api/keys/:platform` | Set API key |

### WebSocket (Real-Time Progress)

```javascript
const ws = new WebSocket('ws://localhost:4444');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`${data.status} - ${data.progress}%`);
};
```

📖 **[Full API Documentation →](https://galion-studio.github.io/galion-universal-downloader/api/overview)**

---

## 🏗️ Architecture

```
galion-universal-downloader/
│
├── 🖥️ galion-v2/                # React Frontend (Vite + TypeScript)
│   ├── src/components/          # Beautiful UI components
│   │   ├── download/            # Download interface
│   │   ├── history/             # Download history
│   │   ├── settings/            # Configuration
│   │   └── cognitive/           # AI features
│   ├── src/lib/                 # Utilities & API client
│   └── src/hooks/               # React hooks
│
├── 🔧 src/                       # Node.js Backend
│   ├── platforms/               # Platform-specific handlers
│   │   ├── YoutubePlatform.js   # YouTube (videos, playlists, channels)
│   │   ├── CivitaiPlatform.js   # CivitAI (models, images, articles)
│   │   ├── GithubPlatform.js    # GitHub (repos, releases, gists)
│   │   ├── InstagramPlatform.js # Instagram (posts, reels, stories)
│   │   └── ... (12+ more)       # Twitter, Reddit, TikTok, etc.
│   └── core/                    # Core services
│       ├── PlatformManager.js   # Platform orchestration
│       ├── UniversalDownloader.js
│       ├── TranscriptionService.js
│       ├── QueueManager.js
│       └── ResumableDownloader.js
│
├── 🌐 extension/                # Browser extension (coming soon)
├── 📚 docs-site/                # Documentation (Docusaurus)
├── 🧪 tests/                    # Test framework
├── 🐳 docker-compose.yml        # Docker config
└── 📄 server.js                 # Express API server
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js 20+, Express, WebSocket |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Video** | yt-dlp, FFmpeg |
| **Scraping** | Puppeteer, Cheerio, Axios |
| **Transcription** | faster-whisper (OpenAI Whisper) |
| **Container** | Docker, Docker Compose |

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```bash
# Server
PORT=4444

# Downloads
DOWNLOAD_PATH=~/Downloads/Galion
MAX_CONCURRENT=5

# AI Features
ENABLE_WHISPER=true
WHISPER_MODEL=tiny.en

# Tor (for .onion sites)
TOR_PROXY=socks5://127.0.0.1:9050

# Optional API Keys
CIVITAI_API_KEY=your_key
GITHUB_TOKEN=your_token
```

### API Keys

Some platforms work better with API keys:

```bash
# Via API
curl -X POST http://localhost:4444/api/keys/civitai \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-civitai-key"}'

# Or use the Settings UI at http://localhost:4444
```

| Platform | Benefits with Key | Get Key |
|----------|------------------|---------|
| **CivitAI** | NSFW content, higher limits | [civitai.com/user/account](https://civitai.com/user/account) |
| **GitHub** | 60 → 5000 requests/hour | [github.com/settings/tokens](https://github.com/settings/tokens) |
| **HuggingFace** | Gated models, private repos | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |

---

## 🔬 Built On Open Source Giants

Galion integrates and builds upon legendary open-source projects:

| Project | Purpose | Link |
|---------|---------|------|
| **yt-dlp** | Video downloads (1000+ sites) | [github.com/yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) |
| **gallery-dl** | Image gallery downloads | [github.com/mikf/gallery-dl](https://github.com/mikf/gallery-dl) |
| **FFmpeg** | Media processing | [ffmpeg.org](https://ffmpeg.org) |
| **faster-whisper** | AI transcription | [github.com/SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| **Puppeteer** | Browser automation | [github.com/puppeteer/puppeteer](https://github.com/puppeteer/puppeteer) |
| **aria2** | Download acceleration | [github.com/aria2/aria2](https://github.com/aria2/aria2) |

---

## 📋 Prerequisites

| Software | Required | Recommended | Notes |
|----------|----------|-------------|-------|
| **Node.js** | 18+ | 20+ | Required |
| **npm** | 9+ | 10+ | Comes with Node |
| **yt-dlp** | Optional | **Yes** | Better video support |
| **FFmpeg** | Optional | **Yes** | Video processing |
| **Tor** | Optional | For .onion | Dark web access |

### Installing Optional Dependencies

```bash
# Windows (winget)
winget install yt-dlp
winget install Gyan.FFmpeg

# macOS (Homebrew)
brew install yt-dlp ffmpeg

# Linux (pip + apt)
pip install yt-dlp
sudo apt install ffmpeg
```

---

## 🐳 Docker

### Quick Start

```bash
docker-compose up -d
```

### Custom Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  galion:
    build: .
    ports:
      - "4444:4444"
    volumes:
      - ~/Downloads/Galion:/app/downloads
      - ./data:/app/data
    environment:
      - PORT=4444
      - NODE_ENV=production
    restart: unless-stopped
```

### Manual Docker Run

```bash
docker build -t galion .
docker run -p 4444:4444 -v ~/Downloads/Galion:/app/downloads galion
```

---

## 🤝 Contributing

We welcome contributions! The seas are vast, and we need more sailors.

```bash
# 1. Fork the repo

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/galion-universal-downloader.git
cd galion-universal-downloader

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes
npm install
npm run dev

# 5. Commit
git commit -m '🏴‍☠️ Add amazing feature'

# 6. Push
git push origin feature/amazing-feature

# 7. Open a Pull Request
```

### Areas We Need Help

| Area | Description |
|------|-------------|
| 🆕 **New Platforms** | Add support for more sites |
| 🐛 **Bug Fixes** | Find and fix issues |
| 📖 **Documentation** | Improve guides and examples |
| 🌍 **Translations** | Localize the UI |
| 🧪 **Testing** | Write tests, find edge cases |
| 🎨 **UI/UX** | Make it more beautiful |

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🛡️ Legal & Responsibility

### User Responsibility

Galion is a **neutral tool**, like a web browser. It downloads publicly available content.

**You are responsible for:**
- Respecting copyright in your jurisdiction
- Only downloading content you have legal access to
- Using the tool ethically and legally

### What We Do & Don't

**We DO:**
- ✅ Respect `robots.txt` when applicable
- ✅ Rate-limit requests to be polite
- ✅ Support content creators
- ✅ Believe in digital preservation

**We DON'T:**
- ❌ Host any content
- ❌ Bypass DRM protection
- ❌ Encourage piracy
- ❌ Track user activity

---

## 🌐 Ecosystem

| Resource | Description | Link |
|----------|-------------|------|
| 🌐 **galion.studio** | Developer Portal | [galion.studio](https://galion.studio) |
| 🤖 **galion.app** | AI Chat Assistant | [galion.app](https://galion.app) |
| 📖 **Documentation** | Full Docs | [galion-studio.github.io](https://galion-studio.github.io/galion-universal-downloader/) |
| 🤗 **HuggingFace** | ML Models | [huggingface.co/galion-studio](https://huggingface.co/galion-studio) |
| 🗂️ **GitHub** | All Projects | [github.com/galion-studio](https://github.com/galion-studio) |

---

## ⭐ Support the Project

If Galion helps you:

- ⭐ **Star** this repository
- 🍴 **Fork** and contribute
- 📣 **Share** with others who value digital freedom
- 🐛 **Report** bugs and suggestions
- 💬 **Join** discussions

---

## 📜 License

```
MIT License

Copyright (c) 2024-2025 Galion Studio & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

[Full License →](LICENSE)

---

<div align="center">

## 🏴‍☠️ The Manifesto

```
In a world where information is power,
And access is increasingly controlled,
We build tools that empower users.

We don't ask permission.
We don't wait for approval.
We create, we share, we liberate.

Like the pirates of old who sailed free,
We navigate the digital seas.
Our code is our ship.
Our community is our crew.

"In a world of walled gardens, be a pirate."

                                — The Galion Crew 🏴‍☠️
```

---

**Built with ❤️ by digital freedom advocates worldwide**

*"Your Only Limit Is Your Imagination"*

---

**⭐ Star this repo if you believe information should be free!**

[🐛 Report Bug](../../issues) • [✨ Request Feature](../../issues) • [💬 Discussions](../../discussions)

---

[⬆ Back to Top](#-galion-universal-downloader)

</div>
