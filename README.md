<div align="center">

# 🏴‍☠️ GALION

### **The People's Universal Downloader**

<img src="galion-v2/public/galion-logo.png" alt="Galion" width="180" style="border-radius: 20px;" />

#### *"Information Wants To Be Free"*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen.svg)](#)
[![No DRM](https://img.shields.io/badge/DRM-None-red.svg)](#)
[![Platforms](https://img.shields.io/badge/Platforms-36%2B-purple.svg)](#-supported-seas)

---

**🌊 Navigate the Digital Seas • 🗃️ Archive Everything • 🔓 Free Your Data**

[**⚓ Quick Start**](#-quick-start) •
[**🗺️ Features**](#-features) •
[**🏴‍☠️ Manifesto**](#-the-freedom-manifesto) •
[**📡 API**](#-api-reference)

</div>

---

## 🏴‍☠️ The Freedom Manifesto

> *"We are the archivists of the digital age. We believe information belongs to humanity, not corporations. We download, we preserve, we share. The internet is our ocean, and Galion is our ship."*

In a world where content disappears, platforms die, and paywalls grow ever higher — **Galion stands as a beacon of digital freedom**.

We don't break laws. We break barriers.

- ✊ **Open Source Forever** — MIT Licensed, community-driven, transparent
- 🔓 **No DRM, No Restrictions** — Your downloaded files are truly yours
- 🌍 **Platform Agnostic** — If it's on the internet, we can fetch it
- 🛡️ **Privacy First** — No tracking, no telemetry, no corporate overlords
- 📦 **Offline Archival** — Preserve culture before it's gone

---

## ⚡ What is Galion?

**Galion** is a universal content downloader and archival tool that lets you save anything from anywhere on the internet. Videos, images, models, articles, datasets, entire profiles — if it exists online, Galion can capture it.

```
┌─────────────────────────────────────────────────────────────────┐
│  🏴‍☠️  G A L I O N   U N I V E R S A L   D O W N L O A D E R  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔗 Paste ANY URL → 📥 Download ANYTHING → 💾 Own Your Data    │
│                                                                 │
│  ▸ YouTube, TikTok, Instagram, Twitter, Reddit                 │
│  ▸ GitHub, HuggingFace, CivitAI, Archives                      │
│  ▸ News feeds, Podcasts, Articles, Research                    │
│  ▸ AI Models, Datasets, Code Repositories                      │
│  ▸ Tor/.onion sites (with Tor installed)                       │
│                                                                 │
│  [════════════════════════════════════] 100% FREE              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Features

### 🌊 **Universal URL Support**
Paste any URL. Galion figures out the rest. No plugins, no extensions, no bullshit.

### 🤖 **AI-Powered Intelligence**
- **Whisper Transcription** — Download video + auto-generate transcripts
- **Smart Content Detection** — Automatically detects media types
- **Adaptive Scraping** — Switches strategies when one fails

### 📡 **36+ Platforms Supported**

| Category | Platforms |
|----------|-----------|
| 🎬 **Video** | YouTube, Vimeo, TikTok, Dailymotion, Twitch, Kick |
| 📸 **Social** | Instagram, Twitter/X, Reddit, Facebook, Tumblr |
| 🎨 **AI/Art** | CivitAI, HuggingFace, ArtStation, DeviantArt |
| 💻 **Code** | GitHub, GitLab, Bitbucket |
| ☁️ **Cloud** | Google Drive, Dropbox, MEGA |
| 🔊 **Audio** | SoundCloud, Spotify*, Bandcamp |
| 📰 **News** | 200+ RSS feeds worldwide |
| 🧅 **Dark Web** | .onion sites (requires Tor) |
| 🌐 **Generic** | ANY website with downloadable content |

### 🔮 **Advanced Capabilities**

- **Resumable Downloads** — Never lose progress on large files
- **Queue Management** — Download thousands of files in parallel
- **Scheduled Tasks** — Set it and forget it
- **Browser Extension** — Right-click to download
- **API Access** — Build your own tools on top of Galion

---

## ⚓ Quick Start

### Option 1: Run Locally (Recommended)

```bash
# Clone the ship
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader

# Install supplies
npm install

# Set sail!
npm start
```

**Access the dashboard:** http://localhost:4444

### Option 2: Docker

```bash
docker-compose up -d
```

### Option 3: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)
[![Deploy to Hugging Face Spaces](https://huggingface.co/datasets/huggingface/badges/resolve/main/deploy-to-spaces-lg.svg)](https://huggingface.co/spaces)

---

## 📡 API Reference

Galion exposes a simple REST API for programmatic access:

```bash
# Download anything
curl -X POST http://localhost:4444/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'

# Check status
curl http://localhost:4444/api/status/{job_id}

# Get supported platforms
curl http://localhost:4444/api/platforms
```

### WebSocket for Real-Time Progress

```javascript
const ws = new WebSocket('ws://localhost:4444/ws');
ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`Download: ${progress.percent}%`);
};
```

---

## 🏴‍☠️ Supported Seas

<details>
<summary><b>Click to expand full platform list</b></summary>

### 🎬 Video Platforms
- YouTube (videos, playlists, channels, shorts)
- Vimeo (videos, showcases)
- TikTok (videos, profiles)
- Dailymotion (videos)
- Twitch (VODs, clips)
- Kick (streams, clips)

### 📸 Social Media
- Instagram (posts, stories, reels, profiles)
- Twitter/X (tweets, threads, media)
- Reddit (posts, comments, subreddits)
- Facebook (videos, photos)
- Tumblr (posts, blogs)

### 🎨 AI & Art
- CivitAI (models, LoRAs, articles, profiles)
- HuggingFace (models, datasets, spaces)
- ArtStation (artwork, portfolios)
- DeviantArt (artwork, galleries)

### 💻 Developer Platforms
- GitHub (repos, releases, gists)
- GitLab (repos, releases)
- Bitbucket (repos)

### ☁️ Cloud Storage
- Google Drive (files, folders)
- Dropbox (files, folders)
- MEGA (files, folders)

### 🔊 Audio
- SoundCloud (tracks, playlists)
- Spotify* (metadata only)
- Bandcamp (tracks, albums)

### 📰 News & Archives
- Internet Archive (Wayback Machine)
- 200+ international RSS feeds
- Medium articles
- Substack newsletters

### 🧅 Dark Web
- .onion sites (requires Tor)
- Hidden wikis

</details>

---

## ⚙️ Configuration

```javascript
// config.js - Optional customization
module.exports = {
  // Where to save downloaded content
  downloadPath: 'C:/Users/YourName/Downloads/Galion',
  
  // Concurrent download limit
  maxConcurrent: 5,
  
  // Enable AI transcription
  enableWhisper: true,
  
  // Tor proxy for .onion sites
  torProxy: 'socks5://127.0.0.1:9050'
};
```

---

## 🛡️ Legal Disclaimer

Galion is a tool designed for **personal archival** of publicly available content. Users are responsible for ensuring their use of this software complies with applicable laws and terms of service.

**We do NOT:**
- Host any copyrighted content
- Bypass DRM protection
- Encourage piracy of paid content
- Track or log user activity

**We DO:**
- Respect robots.txt
- Rate-limit requests
- Support content creators
- Believe in digital preservation

---

## 🤝 Contributing

The seas are vast, and we need more sailors!

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m '🏴‍☠️ Add some amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📜 License

**MIT License** — Do whatever the hell you want with it.

```
Copyright (c) 2024 Galion Studio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software... [full MIT license text]
```

---

<div align="center">

## 🏴‍☠️ The Galion Crew

**Built with ❤️ by digital freedom advocates worldwide**

*"In a world of walled gardens, be a pirate."*

---

**⭐ Star this repo if you believe information should be free!**

[Report Bug](../../issues) • [Request Feature](../../issues) • [Join Discord](#)

</div>
