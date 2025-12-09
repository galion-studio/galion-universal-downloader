---
sidebar_position: 1
slug: /
---

# 🏴‍☠️ Welcome to Galion

<div align="center">

<img src="/galion-logo.png" alt="Galion Logo" width="180" style={{borderRadius: '20px'}} />

### **The People's Universal Downloader**

*"Your Only Limit Is Your Imagination"*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/galion-studio/galion-universal-downloader/blob/main/LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Forever-brightgreen.svg)](#-open-source-philosophy)
[![Platforms](https://img.shields.io/badge/Platforms-36%2B-purple.svg)](#-supported-platforms)

</div>

---

## 🌟 What is Galion?

**Galion** is a **free, open-source, universal content downloader** that lets you save anything from anywhere on the internet. It's not just a tool — it's a **philosophy of digital freedom**.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🔗 Paste ANY URL  →  📥 Download ANYTHING  →  💾 Own Your Data│
│                                                                 │
│   ✓ YouTube Videos          ✓ CivitAI Models                   │
│   ✓ Instagram Posts         ✓ GitHub Repos                      │
│   ✓ TikTok Content          ✓ News Articles                     │
│   ✓ Reddit Threads          ✓ Podcast Episodes                  │
│   ✓ Twitter/X Posts         ✓ Research Papers                   │
│   ✓ Telegram Files          ✓ .onion Sites (with Tor)          │
│                                                                 │
│   ... and 36+ more platforms!                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why Galion?

| Problem | Galion's Solution |
|---------|------------------|
| 😤 Every platform has different tools | 🎯 **One tool for everything** |
| 💰 Most downloaders are paid or freemium | 💚 **100% free, forever** |
| 🔒 Closed-source = who knows what it does? | 🔓 **Fully open source** |
| 📊 Trackers everywhere | 🛡️ **Zero tracking, zero telemetry** |
| 💀 Content disappears, platforms die | 📦 **Archive everything locally** |

---

## 🏴‍☠️ The Philosophy

> *"In a world where information is increasingly controlled, access is monetized, and content disappears overnight — we are the archivists."*

### We Believe:

- 📖 **Knowledge should be accessible to everyone** — Not locked behind corporate walls
- 🌍 **Information transcends borders and paywalls** — What's public should stay public
- 🔓 **Digital freedom is a fundamental right** — You have the right to your data
- 🤝 **Open source is the foundation of trust** — No hidden agendas, no backdoors
- ⚖️ **Fair use matters** — Users have the right to archive content they have access to
- 🔥 **If they close one door, a thousand more will open** — Decentralization wins

### Open Source Forever

This project uses the **MIT License**. This means:
- ✅ Use it for anything
- ✅ Modify it freely  
- ✅ Distribute copies
- ✅ Fork and build upon it
- ✅ Even use it commercially

**No corporation, government, or entity can take this away from the community.**

```
"The galaxy is not for sale. Neither is information."
                                    — The Galion Crew 🏴‍☠️
```

---

## 🚀 Quick Start

### 30-Second Setup

```bash
# 1. Clone the repo
git clone https://github.com/galion-studio/galion-universal-downloader.git

# 2. Enter the directory
cd galion-universal-downloader

# 3. Install dependencies
npm install

# 4. Launch! 🚀
npm start
```

**That's it!** Open http://localhost:4444 in your browser.

### 🐳 Even Quicker with Docker

```bash
docker-compose up -d
```

### 📥 Your First Download

Once the server is running:

```bash
# Download a YouTube video
curl -X POST http://localhost:4444/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Or just paste the URL in the beautiful web UI! 🎨

---

## 🗺️ Feature Overview

### 🎯 Universal URL Support
Paste any URL from 36+ platforms. Galion automatically detects the platform and content type, then downloads it in the best quality available.

### 🤖 AI-Powered Features
- **Whisper Transcription** — Auto-generate subtitles for any video (SRT, VTT, TXT)
- **Smart Content Detection** — Automatically identifies media types
- **Adaptive Scraping Engine** — Switches strategies when one fails
- **Cognitive Search** — Semantic search across your downloads (coming soon)

### ⚡ High Performance
- **Resumable Downloads** — Never lose progress, even on 50GB files
- **Parallel Connections** — Utilize your full bandwidth
- **Queue Management** — Download thousands of files in the background
- **Worker Pool** — Efficient multi-threaded processing

### 🛡️ Privacy First
- **100% Local** — Everything stays on your machine
- **No Tracking** — Zero telemetry, zero analytics
- **No Accounts** — Works without any registration
- **Encrypted Storage** — API keys are stored securely

### 🔧 Developer Friendly
- **REST API** — Simple JSON endpoints for everything
- **WebSocket** — Real-time progress updates
- **CORS Enabled** — Easy frontend integration
- **Docker Ready** — Deploy anywhere

---

## 🌊 Supported Platforms

**36+ platforms and counting!** If it's on the internet, chances are we can download it.

### 🎬 Video & Streaming

| Platform | Features | Status |
|----------|----------|--------|
| **YouTube** | Videos, Shorts, Playlists, Channels, Live | ✅ Full |
| **TikTok** | Videos, Slideshows, Sounds, Profiles | ✅ Full |
| **Vimeo** | Videos, Showcases, Channels | ✅ Full |
| **Twitch** | VODs, Clips, Streams | ✅ Full |
| **Dailymotion** | Videos, Playlists | ✅ Generic |

### 📸 Social Media

| Platform | Features | Status |
|----------|----------|--------|
| **Instagram** | Posts, Reels, Stories, IGTV, Profiles | ✅ Full |
| **Twitter/X** | Tweets, Videos, GIFs, Spaces, Threads | ✅ Full |
| **Reddit** | Posts, Videos, Galleries, Comments | ✅ Full |
| **Pinterest** | Pins, Boards | ✅ Generic |
| **Tumblr** | Posts, Blogs | ✅ Generic |

### 🎨 AI & Creative Platforms

| Platform | Features | Status |
|----------|----------|--------|
| **CivitAI** | Models, LoRAs, Images, Articles, Profiles | ✅ Full |
| **HuggingFace** | Models, Datasets, Spaces | ✅ Full |
| **ArtStation** | Artwork, Portfolios | ✅ Generic |
| **DeviantArt** | Artwork, Galleries | ✅ Generic |

### 💻 Developer Platforms

| Platform | Features | Status |
|----------|----------|--------|
| **GitHub** | Repos, Releases, Gists, Raw Files | ✅ Full |
| **GitLab** | Repos, Releases | ✅ Generic |
| **Bitbucket** | Repos | ✅ Generic |

### 🔊 Audio & Podcasts

| Platform | Features | Status |
|----------|----------|--------|
| **SoundCloud** | Tracks, Playlists, Artists | ✅ Generic |
| **Bandcamp** | Albums, Tracks | ✅ Generic |
| **Spotify** | Metadata, Playlist info | ⚠️ Auth |

### 📰 News & Archives

| Platform | Features | Status |
|----------|----------|--------|
| **200+ News Sites** | BBC, CNN, NYT, Guardian, etc. | ✅ Full |
| **Archive.org** | Wayback Machine, Books, Media | ✅ Full |
| **arXiv** | Research Papers | ✅ Full |
| **Medium** | Articles | ✅ Generic |

### 🧅 Special Platforms

| Platform | Features | Status |
|----------|----------|--------|
| **.onion Sites** | Any Tor hidden service | ✅ Full (requires Tor) |
| **Telegram** | Channels, Files, Media | ✅ Full |
| **Pastebin** | Pastes, Raw Text | ✅ Full |

**Legend:** ✅ Full = Native support | ⚠️ Auth = Requires authentication | 🔜 Coming = In development

---

## 🏗️ Architecture

Galion is built with a modern, modular architecture:

```
galion-universal-downloader/
│
├── 🖥️ galion-v2/              # React Frontend (Vite + TypeScript)
│   ├── src/components/        # Beautiful UI components
│   ├── src/lib/              # API client, utilities
│   └── src/hooks/            # React hooks
│
├── 🔧 src/                    # Node.js Backend
│   ├── platforms/            # Platform-specific handlers
│   │   ├── YoutubePlatform.js
│   │   ├── CivitaiPlatform.js
│   │   ├── GithubPlatform.js
│   │   └── ... (12+ more)
│   └── core/                 # Core services
│       ├── PlatformManager.js
│       ├── UniversalDownloader.js
│       ├── TranscriptionService.js
│       └── QueueManager.js
│
├── 🌐 extension/             # Browser extension
├── 📚 docs-site/             # This documentation
├── 🧪 tests/                 # Test framework
└── 🐳 docker-compose.yml     # Docker config
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js, Express, WebSocket |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Video Processing** | yt-dlp, FFmpeg |
| **Scraping** | Puppeteer, Cheerio |
| **Transcription** | Faster-Whisper |
| **Containerization** | Docker |

---

## 📖 Documentation Guide

### Getting Started
- [**Installation Guide**](./getting-started/installation) — Detailed setup instructions for all platforms

### Platform Support
- [**Platform Overview**](./platforms/overview) — All supported platforms
- [**Platform Compatibility**](./platforms/compatibility) — Detailed feature matrix

### API Reference
- [**API Overview**](./api/overview) — Complete REST API documentation with examples

### Ecosystem
- [**Galion Ecosystem**](./ecosystem/overview) — Other Galion tools and services

### About
- [**About Galion Studio**](./about/company) — Who we are and why we built this

---

## 🔮 Roadmap

### ✅ What's Working Now (v2.0)
- 36+ platform support
- Universal download API
- Real-time WebSocket progress
- AI transcription with Whisper
- Beautiful React frontend
- Docker support
- Batch downloads
- Download history & management

### 🚧 Coming Soon (v2.1)
- Browser extension (Firefox & Chrome)
- Desktop app (Electron)
- Cloud storage integration
- Scheduled downloads
- Download templates
- Plugin system

### 🔮 Future Vision (v3.0)
- Distributed downloads (p2p)
- AI-powered content discovery
- Self-hosted web version
- Mobile apps
- Community model sharing
- Cross-device sync

---

## 🤝 Join the Crew

The seas are vast, and we need more sailors! Here's how you can help:

### 🆕 Add New Platforms
Know a platform we don't support? Add it! Platform modules are easy to create.

### 🐛 Fix Bugs
Found a broken download? Platform scrapers need constant updates as sites change.

### 📖 Improve Documentation
Documentation can always be better. Help us make it clearer.

### 🌍 Translate
Help make Galion available in more languages.

### 🧪 Test
Use Galion and report issues. Every bug report helps.

### ⭐ Star & Share
Stars help others find us. Share Galion with anyone who values digital freedom.

```bash
# Ready to contribute?
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
npm install
npm run dev
# Make your changes, then open a PR!
```

---

## 🌐 Ecosystem & Resources

| Resource | Description | Link |
|----------|-------------|------|
| 🌐 **galion.app** | AI Chat Assistant | [galion.app](https://galion.app) |
| 🏢 **galion.studio** | Developer Portal | [galion.studio](https://galion.studio) |
| 🤗 **HuggingFace** | ML Models | [huggingface.co/galion-studio](https://huggingface.co/galion-studio) |
| 📖 **Documentation** | Full Docs | [galion-studio.github.io](https://galion-studio.github.io/galion-universal-downloader/) |
| 🗂️ **GitHub** | All Projects | [github.com/galion-studio](https://github.com/galion-studio) |

---

## 🎯 Use Cases

### 🎓 Researchers & Academics
- Archive papers from arXiv before they're updated
- Download datasets from HuggingFace
- Save lecture videos for offline viewing
- Transcribe interviews automatically

### 🎨 AI Artists & Creators
- Download models from CivitAI in bulk
- Archive your favorite LoRAs
- Backup training datasets
- Save inspiration galleries

### 📰 Journalists & Archivists
- Preserve news articles before they're paywalled
- Archive social media posts as evidence
- Download content from Wayback Machine
- Mass-download public datasets

### 💻 Developers
- Clone GitHub repos with releases
- Download project dependencies
- Archive documentation
- Backup code examples

### 🎵 Content Enthusiasts
- Save YouTube playlists
- Download podcasts for offline listening
- Archive music from Bandcamp
- Backup your own social media content

---

## ❓ FAQ

<details>
<summary><strong>Is Galion legal to use?</strong></summary>

**Galion is a tool, like a web browser.** It downloads content that you can access. The legality depends on:
- What you download
- Your jurisdiction's fair use laws
- Whether you have rights to the content

We encourage responsible use. Don't pirate content you should pay for. Do use it for archival, research, personal backups, and content you have rights to.
</details>

<details>
<summary><strong>Does Galion bypass DRM?</strong></summary>

**No.** Galion downloads publicly available content. It doesn't break DRM, crack encryption, or bypass technical protection measures.
</details>

<details>
<summary><strong>Is my data safe?</strong></summary>

**Yes.** Galion is 100% local. We don't:
- Send any data to our servers
- Track your downloads
- Collect analytics
- Store your API keys anywhere but your own machine
</details>

<details>
<summary><strong>Why do some platforms need API keys?</strong></summary>

Some platforms (GitHub, CivitAI) have rate limits. With an API key, you get higher limits and access to more features. API keys are **optional** — basic functionality works without them.
</details>

<details>
<summary><strong>Can I use Galion commercially?</strong></summary>

**Yes!** The MIT license allows commercial use. You can:
- Use it in your business
- Build products with it
- Offer services using it
Just don't claim you wrote it or remove the license.
</details>

---

## ⭐ Support the Project

If Galion helps you, here's how you can support us:

- ⭐ **Star** the repo on GitHub
- 🍴 **Fork** and contribute code
- 📣 **Share** with others who value digital freedom
- 🐛 **Report** bugs and suggest features
- 📖 **Improve** documentation
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
copies of the Software...
```

[Full License →](https://github.com/galion-studio/galion-universal-downloader/blob/main/LICENSE)

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

**Ready to set sail?** [Get Started →](./getting-started/installation)

🏴‍☠️

</div>
