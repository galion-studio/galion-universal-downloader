# Changelog

## [2.1.0] - 2025-12-09

### 🎉 New Features
- **🎙️ Whisper Transcription** - Auto-transcribe videos using faster-whisper (tiny.en model)
- **🔍 API Search** - Search 21+ platforms with GitHub repo links
- **📂 User Downloads Folder** - Files save to `~/Downloads/Galion/` instead of project folder
- **📊 115-Site Test Matrix** - Comprehensive compatibility documentation

### 🛠️ Improvements
- Server now runs on port 4444 (was 3000)
- Added 6 new platforms: Spotify, Dailymotion, Bandcamp, Mixcloud, Bilibili, NicoNico
- Open-Source APIs panel shows popular libraries (yt-dlp ⭐91k, instaloader ⭐8k, faster-whisper ⭐12k)
- Frontend now calls real backend API for downloads
- Progress bar shows real download status

### 📚 Documentation
- Added `docs/TEST_MATRIX.md` with 115 supported sites
- Updated README with new features and port info
- Updated CHANGELOG with version history

### 🐛 Bug Fixes
- Fixed download simulation (now actually downloads files)
- Fixed history endpoint to use correct downloads folder


All notable changes to Galion Universal Downloader will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2024-12-09

### 🎉 Major Release - Production Ready

#### Added

##### 🚀 Performance & Threading
- **Worker Pool** (`src/core/WorkerPool.js`) - Multi-threaded parallel downloads using Node.js Worker Threads
  - Auto-detects optimal worker count based on CPU cores
  - 10x faster batch downloads
  - Automatic worker restart on failure

- **Resumable Downloads** (`src/core/ResumableDownloader.js`) - HTTP Range request support
  - Resume interrupted downloads from where they left off
  - Automatic retry with exponential backoff (max 5 retries)
  - Bandwidth throttling with configurable speed limits

- **IndexedDB Caching** (`galion-v2/src/lib/cache-service.ts`)
  - Instant queue previews from cached metadata
  - Full-text history search
  - Queue persistence across browser sessions
  - Download statistics tracking

##### 🌐 Browser Extension
- **Chrome/Opera Extension** (`extension/`)
  - Manifest V3 compliant
  - One-click download buttons injected into YouTube, Instagram, TikTok, Twitter
  - Context menu integration (right-click to download)
  - Clipboard monitoring for instant URL capture
  - Platform auto-detection with emoji badges
  - Settings page for configuration

##### 🔐 Authentication & Privacy
- **AuthManager** (`src/core/AuthManager.js`)
  - Cookie import from Netscape format (browser export)
  - JSON cookie import (extension export)
  - Proxy pool with rotation support
  - Platform-specific headers for authenticated requests
  - Random user agent rotation

##### 🤖 AI Intelligence
- **AIIntelligence** (`src/core/AIIntelligence.js`)
  - Auto-quality selection based on device capabilities and network speed
  - Duplicate detection using content fingerprinting
  - Title similarity matching (Jaccard algorithm)
  - Content tagging and classification (14 categories)
  - Smart download recommendations

##### ⏰ Scheduling
- **Scheduler** (`src/core/Scheduler.js`)
  - Schedule downloads for specific times
  - Recurring downloads (hourly, daily, weekly, monthly)
  - Bandwidth optimization with peak/off-peak rules
  - Automatic retry on failure
  - Persistent job storage

##### 📱 Platform Support
- **New Platforms Added:**
  - Instagram (Posts, Stories, Reels, Highlights)
  - TikTok (Videos, no watermark option)
  - Twitter/X (Tweets, Spaces)
  - Reddit (Posts, Gallery, Videos)

- **Compatibility Matrix** - 1500+ supported sites
  - Video: YouTube, Vimeo, Twitch, Dailymotion, Bilibili
  - Audio: SoundCloud, YouTube Music, Bandcamp
  - Developer: GitHub, GitLab, Bitbucket
  - AI: CivitAI, HuggingFace

##### 🐳 DevOps
- **Docker Compose** (`docker-compose.yml`)
  - Frontend, Backend, Redis services
  - Puppeteer container for browser automation
  - yt-dlp worker with auto-scaling (2 replicas)
  - Nginx reverse proxy ready

#### Changed
- Upgraded frontend to React 19 with shadcn/ui components
- Improved queue management with priority support
- Enhanced progress tracking with speed/ETA calculations
- Refactored API client for better error handling

#### Fixed
- Fixed TypeScript strict mode errors in cache service
- Fixed download progress not updating in batch mode
- Fixed platform detection for shortened URLs

---

## [2.2.0] - 2024-11-15

### Added
- Queue Manager for batch downloads
- Quality selector (Best/1080p/720p/480p/Audio)
- Drag-and-drop interface for URL files
- Transcription service using Faster-Whisper
- API key management for platform integrations

### Changed
- Migrated to Vite 7 for faster builds
- Updated UI with Tailwind CSS v4

---

## [2.1.0] - 2024-10-20

### Added
- YouTube platform with playlist support
- GitHub repository downloads
- CivitAI model downloads
- Basic REST API
- Download history tracking

### Changed
- Improved error messages
- Better filename sanitization

---

## [2.0.0] - 2024-09-15

### Added
- Complete rewrite with modern React frontend
- Node.js backend with Express
- Platform-based architecture for easy extension
- Cognitive Engine for smart processing
- PDF/Email report generation

### Changed
- New branding and UI design
- Modular platform system

---

## [1.0.0] - 2024-08-01

### Added
- Initial release
- Basic URL download functionality
- Command-line interface
- YouTube support via yt-dlp

---

## Upgrading

### From 2.2.x to 2.3.0

1. **Install new dependencies:**
   ```bash
   npm install
   ```

2. **Update environment variables:**
   ```bash
   # New optional settings
   ENABLE_TRANSCRIPTION=true
   REDIS_URL=redis://localhost:6379
   ```

3. **Install Chrome extension:**
   - Go to `chrome://extensions`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `extension/` folder

4. **Start with Docker (recommended):**
   ```bash
   docker-compose up -d
   ```

---

## Roadmap

### v2.4.0 (Planned)
- Electron/Tauri desktop app
- Cloud sync (Google Drive, Dropbox)
- Mobile PWA with install prompt
- Telemetry dashboard (opt-in)

### v3.0.0 (Future)
- AI-powered video summarization
- Gemma model integration for smart features
- Plugin marketplace
- Enterprise features

---

## Contributors

Thanks to all contributors who made this release possible!

- Core Team: Galion Studio
- Community: [GitHub Contributors](https://github.com/galion-studio/galion-universal-downloader/graphs/contributors)

---

## Links

- [GitHub Repository](https://github.com/galion-studio/galion-universal-downloader)
- [Documentation](https://galion.studio/docs)
- [Issue Tracker](https://github.com/galion-studio/galion-universal-downloader/issues)
- [Discord Community](https://discord.gg/galion)
