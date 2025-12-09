# Galion Ecosystem Overview

The Galion Universal Downloader is part of the larger **Galion Studio** ecosystem - a suite of open-source tools for AI, media, and development.

---

## 🌐 Ecosystem Components

### 1. 📥 Universal Downloader (This Project)
Download content from 36+ platforms with a beautiful UI.

- **GitHub**: [galion-studio/galion-universal-downloader](https://github.com/galion-studio/galion-universal-downloader)
- **Features**: Multi-platform downloads, transcription, batch processing

### 2. 🤖 Galion AI
Talk to our AI assistant for help with downloads, transcription, and more.

- **Website**: [galion.studio](https://galion.studio)
- **HuggingFace**: [huggingface.co/galion-studio](https://huggingface.co/galion-studio)

### 3. 🧠 Cognitive Engine
AI-powered content analysis and intelligent download suggestions.

- **Features**: Smart recommendations, content summarization, metadata extraction

### 4. 📝 Transcription Service
Automatic subtitles and transcription using Whisper AI.

- **Backends**: faster-whisper, whisper.cpp, openai-whisper
- **Models**: tiny, base, small, medium, large, turbo

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GALION ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Frontend   │  │  API Server  │  │   Workers    │           │
│  │  React/Vite  │──│   Express    │──│   Node.js    │           │
│  │  Port: 5173  │  │  Port: 4444  │  │   Threads    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│  ┌─────────────────────────┼─────────────────────────────────┐  │
│  │              Platform Manager                              │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │  │
│  │  │CivitAI │ │ GitHub │ │YouTube │ │Telegram│ │  ...   │  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────┼─────────────────────────────────┐  │
│  │                   Core Services                            │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │  │
│  │  │Transcriber │ │  Scanner   │ │   Queue    │             │  │
│  │  └────────────┘ └────────────┘ └────────────┘             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Integration Points

### REST API
```http
POST /api/download
POST /api/parse
GET /api/history
POST /api/transcribe
```

### WebSocket Events
- `progress` - Download progress
- `complete` - Download complete
- `error` - Error occurred
- `transcription-progress` - Transcription progress

### Browser Extension
Right-click any link to download with Galion.

---

## 🧩 Open Source Stack

| Layer | Technology | License |
|-------|------------|---------|
| Frontend | React, TypeScript, Tailwind | MIT |
| Backend | Node.js, Express | MIT |
| Video | yt-dlp | Unlicense |
| Transcription | faster-whisper | MIT |
| Scraping | Puppeteer | Apache 2.0 |

### Key Libraries
| Library | Stars | Purpose |
|---------|-------|---------|
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | ⭐ 91k | Video downloads |
| [puppeteer](https://github.com/puppeteer/puppeteer) | ⭐ 89k | Web automation |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | ⭐ 12k | Transcription |
| [instaloader](https://github.com/instaloader/instaloader) | ⭐ 8k | Instagram |
| [telegraf](https://github.com/telegraf/telegraf) | ⭐ 8k | Telegram |
| [octokit](https://github.com/octokit/octokit.js) | ⭐ 7k | GitHub |
| [TikTok-Api](https://github.com/davidteather/TikTok-Api) | ⭐ 5k | TikTok |

---

## 📊 Platform Support Matrix

| Category | Count | Examples |
|----------|-------|----------|
| Video | 7 | YouTube, Vimeo, Twitch |
| Social | 7 | Instagram, TikTok, Twitter |
| AI/ML | 2 | CivitAI, HuggingFace |
| Audio | 3 | SoundCloud, Spotify, Bandcamp |
| Cloud | 3 | Google Drive, Dropbox, MEGA |
| Art | 4 | ArtStation, DeviantArt, Imgur |
| Code | 1 | GitHub |
| Messaging | 2 | Telegram, Discord |
| News | 2 | RSS, Archive.org |
| Adult | 2 | PornHub, XVideos |
| **Total** | **36+** | And growing! |

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader

# Install
npm install

# Run backend
node server.js

# Run frontend (new terminal)
cd galion-v2 && npm run dev

# Access
# Frontend: http://localhost:5173/galion-universal-downloader/
# API: http://localhost:4444
```

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

See [CONTRIBUTING.md](https://github.com/galion-studio/galion-universal-downloader/blob/main/CONTRIBUTING.md) for guidelines.

---

## 📜 License

MIT License - Free for personal and commercial use.

---

## 🔗 Links

- **GitHub**: [galion-studio/galion-universal-downloader](https://github.com/galion-studio/galion-universal-downloader)
- **Documentation**: [galion-studio.github.io/galion-universal-downloader](https://galion-studio.github.io/galion-universal-downloader/)
- **HuggingFace**: [huggingface.co/galion-studio](https://huggingface.co/galion-studio)
- **Website**: [galion.studio](https://galion.studio)
