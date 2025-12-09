# 🚀 Galion Universal Downloader

<div align="center">

<img src="galion-v2/public/galion-logo.png" alt="Galion Universal Downloader Logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"/>

### 🔥 Universal Downloader

**Download EVERYTHING from ANY platform** - YouTube, Instagram, TikTok, CivitAI, GitHub, and 36+ more!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![GitHub Stars](https://img.shields.io/github/stars/galion-studio/galion-universal-downloader?style=social)](https://github.com/galion-studio/galion-universal-downloader)

[🌐 Website](https://galion.studio) | [📖 Documentation](https://galion-studio.github.io/galion-universal-downloader/) | [🤗 HuggingFace](https://huggingface.co/galion-studio) | [💬 Discord](https://discord.gg/galion)

</div>

---

## ✨ Features

### 🎯 36+ Supported Platforms
Download from any of these platforms with a single URL paste:

| Category | Platforms |
|----------|-----------|
| **Video** | YouTube, Vimeo, Dailymotion, Twitch, Kick, Bilibili, NicoNico |
| **Social** | Instagram, TikTok, Twitter/X, Facebook, Reddit, Pinterest, Tumblr |
| **AI/ML Models** | CivitAI, HuggingFace |
| **Code** | GitHub (repos, releases, gists) |
| **Audio** | SoundCloud, Spotify, Bandcamp |
| **Messaging** | Telegram, Discord |
| **Cloud** | Google Drive, Dropbox, MEGA |
| **Art** | ArtStation, DeviantArt, Flickr, Imgur |
| **News** | RSS Feeds, Articles, Archives |
| **Adult** | PornHub, XVideos (with age verification) |
| **Dark Web** | Onion sites (requires Tor) |

### 🔥 Key Features

- **🎨 Beautiful Modern UI** - React + Tailwind CSS with dark mode
- **📥 Automatic Platform Detection** - Just paste a URL
- **📊 Real-time Progress** - WebSocket-powered live updates
- **🔐 API Key Management** - Secure storage for platform tokens
- **📝 Transcription** - Auto-generate subtitles with Whisper AI
- **🗂️ Download History** - Track and manage all downloads
- **📦 Batch Download** - Download multiple URLs at once
- **🌐 Browser Extension** - Right-click to download from any page
- **🐳 Docker Support** - Deploy anywhere
- **🔓 100% Open Source** - MIT Licensed

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader

# Install dependencies
npm install

# Start the backend server
node server.js

# In a new terminal, start the frontend
cd galion-v2
npm install
npm run dev
```

### Access the App
- **Frontend**: http://localhost:5173/galion-universal-downloader/
- **API Server**: http://localhost:4444

---

## 📁 Download Location

All downloads are saved to:
```
C:\Users\[YourUsername]\Downloads\Galion\
```

On Mac/Linux:
```
~/Downloads/Galion/
```

---

## 🔑 API Keys

Some platforms require API keys for full functionality:

| Platform | Required For | Get Key |
|----------|--------------|---------|
| **CivitAI** | 18+ content, higher rate limits | [civitai.com/user/account](https://civitai.com/user/account) |
| **HuggingFace** | Gated models | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| **Telegram** | Private channels | [t.me/BotFather](https://t.me/BotFather) |
| **GitHub** | Higher rate limits (60 → 5000/hr) | [github.com/settings/tokens](https://github.com/settings/tokens) |
| **Twitter** | Protected tweets | [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard) |
| **Reddit** | Higher rate limits | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) |

Configure API keys in the **Settings** tab of the app.

---

## 🛠️ API Documentation

### Base URL
```
http://localhost:4444/api
```

### Endpoints

#### Status
```http
GET /api/status
```
Returns server status and available platforms.

#### Download
```http
POST /api/download
Content-Type: application/json

{
  "url": "https://civitai.com/models/12345",
  "options": {
    "downloadFiles": true
  }
}
```

#### Parse URL
```http
POST /api/parse
Content-Type: application/json

{
  "url": "https://github.com/user/repo"
}
```

#### History
```http
GET /api/history
DELETE /api/history/:folder
```

#### API Keys
```http
GET /api/keys
POST /api/keys/:platform
DELETE /api/keys/:platform
POST /api/keys/:platform/verify
```

#### Transcription
```http
GET /api/transcribe/status
POST /api/transcribe/init
GET /api/transcribe/models
POST /api/transcribe
```

---

## 🧩 Open Source Libraries Used

We leverage the best open-source tools:

| Library | Purpose | GitHub |
|---------|---------|--------|
| **yt-dlp** | Video downloads | [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) ⭐ 91k |
| **instaloader** | Instagram | [instaloader/instaloader](https://github.com/instaloader/instaloader) ⭐ 8k |
| **TikTok-Api** | TikTok | [davidteather/TikTok-Api](https://github.com/davidteather/TikTok-Api) ⭐ 5k |
| **faster-whisper** | Transcription | [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) ⭐ 12k |
| **octokit** | GitHub API | [octokit/octokit.js](https://github.com/octokit/octokit.js) ⭐ 7k |
| **puppeteer** | Web scraping | [puppeteer/puppeteer](https://github.com/puppeteer/puppeteer) ⭐ 89k |
| **telegraf** | Telegram | [telegraf/telegraf](https://github.com/telegraf/telegraf) ⭐ 8k |
| **snoowrap** | Reddit | [not-an-aardvark/snoowrap](https://github.com/not-an-aardvark/snoowrap) ⭐ 1k |

---

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t galion-downloader .

# Run the container
docker run -p 4444:4444 -v ~/Downloads/Galion:/app/downloads galion-downloader
```

Or use Docker Compose:
```bash
docker-compose up -d
```

---

## 📂 Project Structure

```
galion-universal-downloader/
├── server.js                 # Main API server
├── src/
│   ├── core/                 # Core modules
│   │   ├── PlatformManager.js
│   │   ├── UniversalDownloader.js
│   │   ├── TranscriptionService.js
│   │   └── ...
│   └── platforms/            # Platform implementations
│       ├── CivitaiPlatform.js
│       ├── GithubPlatform.js
│       ├── YoutubePlatform.js
│       └── ...
├── galion-v2/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   └── public/
├── extension/                # Browser extension
├── docs/                     # Documentation
└── docs-site/                # Documentation website
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork the repository
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'Add some amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=galion-studio/galion-universal-downloader&type=Date)](https://star-history.com/#galion-studio/galion-universal-downloader&Date)

---

## 🙏 Acknowledgments

- [Galion Studio](https://galion.studio) - Project maintainers
- All the amazing open-source libraries we use
- Our contributors and community

---

<div align="center">

**Made with ❤️ by [Galion Studio](https://galion.studio)**

[⬆ Back to Top](#-galion-universal-downloader)

</div>
