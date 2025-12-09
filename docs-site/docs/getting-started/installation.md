---
sidebar_position: 1
---

# 🚀 Installation Guide

<div align="center">

### **Get Galion Running in Under 5 Minutes**

*Choose your adventure: Local, Docker, or Cloud* ☁️

</div>

---

## 📋 Prerequisites

Before we start, let's make sure you have what you need:

### Required

| Software | Version | How to Check | Installation |
|----------|---------|--------------|--------------|
| **Node.js** | 18+ (20+ recommended) | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ (10+ recommended) | `npm --version` | Comes with Node.js |
| **Git** | Any recent version | `git --version` | [git-scm.com](https://git-scm.com) |

### Optional (But Highly Recommended)

| Software | What It Enables | Installation |
|----------|-----------------|--------------|
| **yt-dlp** | Enhanced video downloads (YouTube, TikTok, etc.) | `pip install yt-dlp` or `winget install yt-dlp` |
| **FFmpeg** | Video/audio processing, format conversion | `winget install ffmpeg` or `brew install ffmpeg` |
| **Tor** | .onion site access | [torproject.org](https://www.torproject.org) |
| **faster-whisper** | AI transcription | `pip install faster-whisper` |

---

## 🎯 Quick Start (Local Installation)

### Step 1: Clone the Repository

```bash
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all backend dependencies. We use:
- **Express** for the API server
- **Puppeteer** for dynamic content scraping
- **Cheerio** for HTML parsing
- **ws** for WebSocket support

### Step 3: Start the Server

```bash
npm start
```

You should see:
```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   🚀 GALION UNIVERSAL DOWNLOADER - API SERVER v2.0                  ║
║                                                                      ║
║   API Server: http://localhost:4444                                 ║
║                                                                      ║
║   ✓ RESTful API for downloads                                       ║
║   ✓ WebSocket support for real-time progress                        ║
║   ✓ CORS enabled for frontend integration                           ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Step 4: Verify It's Working

```bash
# Check the API status
curl http://localhost:4444/api/status

# Or open in your browser
# http://localhost:4444
```

**🎉 That's it! Galion is now running!**

---

## 🖥️ Frontend Setup

The beautiful React frontend lives in the `galion-v2` directory.

### Option A: Development Mode (Hot Reload)

```bash
# From the project root
cd galion-v2

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

**Frontend:** http://localhost:5173
**Backend:** http://localhost:4444 (run `npm start` in another terminal)

### Option B: Production Build

```bash
cd galion-v2

# Build for production
npm run build

# The build output goes to galion-v2/dist/
# Copy it to public/ for the main server to serve it
cp -r dist/* ../public/
```

Now when you run `npm start` from the root, the frontend is served at http://localhost:4444.

---

## 🐳 Docker Installation

Docker is the easiest way to get everything running with zero configuration!

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader

# Start with Docker Compose
docker-compose up -d
```

**That's it!** Visit http://localhost:4444

### Option 2: Manual Docker Build

```bash
# Build the image
docker build -t galion .

# Run with a downloads volume
docker run -d \
  -p 4444:4444 \
  -v ~/Downloads/Galion:/app/downloads \
  --name galion \
  galion
```

### Docker Compose Configuration

Our `docker-compose.yml`:

```yaml
version: '3.8'

services:
  galion:
    build: .
    ports:
      - "4444:4444"
    volumes:
      # Mount your downloads directory
      - ~/Downloads/Galion:/app/downloads
      # Persist API keys
      - ./data:/app/data
    environment:
      - PORT=4444
      - NODE_ENV=production
    restart: unless-stopped
```

### Customizing Docker

```bash
# Use different ports
docker run -p 8080:4444 galion

# Use a specific downloads directory
docker run -v /my/downloads:/app/downloads galion

# Set environment variables
docker run -e MAX_CONCURRENT=10 galion
```

---

## 🍎 macOS Installation

### Using Homebrew

```bash
# Install Node.js
brew install node

# Install optional dependencies
brew install yt-dlp ffmpeg

# Clone and run
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
npm install
npm start
```

### Apple Silicon (M1/M2/M3) Notes

Galion works great on Apple Silicon! A few tips:

- Puppeteer will auto-download an ARM-compatible Chromium
- FFmpeg from Homebrew is ARM-native
- If you see Rosetta warnings, reinstall Node via Homebrew

---

## 🪟 Windows Installation

### Option 1: Winget (Recommended)

```powershell
# Install Node.js
winget install OpenJS.NodeJS.LTS

# Install optional dependencies
winget install yt-dlp
winget install Gyan.FFmpeg

# Clone and run
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
npm install
npm start
```

### Option 2: Chocolatey

```powershell
# Install Node.js
choco install nodejs-lts

# Install optional dependencies
choco install yt-dlp ffmpeg

# Clone and run
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
npm install
npm start
```

### Option 3: Manual Installation

1. Download and install [Node.js LTS](https://nodejs.org)
2. Download [yt-dlp.exe](https://github.com/yt-dlp/yt-dlp/releases) and add to PATH
3. Download [FFmpeg](https://ffmpeg.org/download.html) and add to PATH
4. Clone the repo and run `npm install && npm start`

### Windows-Specific Notes

- **Downloads location:** `C:\Users\<YourName>\Downloads\Galion\`
- **Port conflicts:** If 4444 is in use, set `PORT=5000` before running
- **Long path issues:** Enable long paths if you encounter issues:
  ```powershell
  # Run as Administrator
  reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
  ```

---

## 🐧 Linux Installation

### Ubuntu/Debian

```bash
# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install optional dependencies
sudo apt-get install -y ffmpeg
pip install yt-dlp

# Clone and run
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
npm install
npm start
```

### Fedora/RHEL

```bash
# Install Node.js
sudo dnf install nodejs npm

# Install optional dependencies
sudo dnf install ffmpeg
pip install yt-dlp

# Clone and run
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
npm install
npm start
```

### Arch Linux

```bash
# Install everything
sudo pacman -S nodejs npm ffmpeg yt-dlp

# Clone and run
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
npm install
npm start
```

### Running as a Service (systemd)

Create `/etc/systemd/system/galion.service`:

```ini
[Unit]
Description=Galion Universal Downloader
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/galion-universal-downloader
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=PORT=4444
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable galion
sudo systemctl start galion
sudo systemctl status galion
```

---

## ☁️ Cloud Deployment

### Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/galion)

### Deploy to Render

1. Fork the repo
2. Connect to Render
3. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Port: `4444`

### Deploy to DigitalOcean App Platform

```yaml
# app.yaml
name: galion
services:
  - name: api
    source_dir: /
    run_command: npm start
    http_port: 4444
    instance_count: 1
    instance_size_slug: basic-xxs
```

### Deploy to AWS EC2

```bash
# On your EC2 instance
sudo yum install -y nodejs npm git
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
npm install

# Use PM2 for process management
npm install -g pm2
pm2 start npm -- start
pm2 save
pm2 startup
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
PORT=4444                              # API server port
NODE_ENV=production                    # production or development

# Download Configuration
DOWNLOAD_PATH=~/Downloads/Galion       # Where to save downloads
MAX_CONCURRENT=5                       # Concurrent downloads

# Proxy Configuration (optional)
HTTP_PROXY=http://proxy:8080           # HTTP proxy
HTTPS_PROXY=http://proxy:8080          # HTTPS proxy
TOR_PROXY=socks5://127.0.0.1:9050      # Tor SOCKS proxy

# Feature Flags
ENABLE_WHISPER=true                    # Enable AI transcription
WHISPER_MODEL=tiny.en                  # Whisper model size

# API Keys (optional - can also be set via UI)
CIVITAI_API_KEY=your_key
GITHUB_TOKEN=your_token
```

### API Keys Setup

#### Via the UI
1. Open http://localhost:4444
2. Go to Settings → API Keys
3. Enter your keys

#### Via the API
```bash
curl -X POST http://localhost:4444/api/keys/civitai \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-civitai-key"}'
```

#### Getting API Keys

| Platform | How to Get Key |
|----------|---------------|
| **CivitAI** | [civitai.com/user/account](https://civitai.com/user/account) → API Keys |
| **GitHub** | [github.com/settings/tokens](https://github.com/settings/tokens) |
| **HuggingFace** | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| **Telegram** | [my.telegram.org/apps](https://my.telegram.org/apps) |

---

## 🔧 Optional Dependencies Deep Dive

### yt-dlp

**What it is:** The most powerful video downloader, supporting 1000+ sites.

**Why you want it:** Enhanced quality options, playlist support, better reliability.

**Installation:**
```bash
# Windows
winget install yt-dlp

# macOS
brew install yt-dlp

# Linux
pip install yt-dlp

# Manual (any OS)
# Download from https://github.com/yt-dlp/yt-dlp/releases
```

**Verify:**
```bash
yt-dlp --version
# Should show: 2024.XX.XX
```

### FFmpeg

**What it is:** Universal media processing toolkit.

**Why you want it:** Video conversion, audio extraction, thumbnail generation.

**Installation:**
```bash
# Windows
winget install Gyan.FFmpeg

# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Arch
sudo pacman -S ffmpeg
```

**Verify:**
```bash
ffmpeg -version
# Should show version info
```

### Tor

**What it is:** Anonymous network for accessing .onion sites.

**Why you want it:** Download from Tor hidden services.

**Installation:**
1. Download from [torproject.org](https://www.torproject.org/download/)
2. Install and run Tor Browser (or Tor daemon)
3. Default SOCKS proxy: `127.0.0.1:9050`

**Configuration:**
```bash
# Set in .env or environment
TOR_PROXY=socks5://127.0.0.1:9050
```

### faster-whisper

**What it is:** Optimized Whisper speech recognition.

**Why you want it:** Auto-generate subtitles for videos.

**Installation:**
```bash
pip install faster-whisper
```

**Verify:**
```bash
python -c "import faster_whisper; print('OK')"
```

---

## 🧪 Verifying Your Installation

### Quick Health Check

```bash
# 1. Check API is responding
curl http://localhost:4444/api/status

# Expected: {"status":"online","version":"2.0.0",...}

# 2. Check platforms are loaded
curl http://localhost:4444/api/platforms | jq length

# Expected: 36 (or more)

# 3. Test a download
curl -X POST http://localhost:4444/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/galion-studio/galion-universal-downloader"}'

# Expected: {"platformId":"github",...}
```

### Check Optional Dependencies

```bash
# yt-dlp
curl http://localhost:4444/api/status | jq '.dependencies.ytdlp'

# FFmpeg
ffmpeg -version 2>&1 | head -1

# Tor (if configured)
curl --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip
```

---

## 🔥 Troubleshooting

### Common Issues

<details>
<summary><strong>Port 4444 already in use</strong></summary>

```bash
# Find what's using the port
# Windows
netstat -ano | findstr :4444

# Linux/macOS
lsof -i :4444

# Solution: Use a different port
PORT=5000 npm start
```
</details>

<details>
<summary><strong>npm install fails</strong></summary>

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and retry
rm -rf node_modules package-lock.json
npm install

# If still failing, try with --legacy-peer-deps
npm install --legacy-peer-deps
```
</details>

<details>
<summary><strong>Puppeteer/Chromium issues</strong></summary>

```bash
# Linux: Install required libraries
sudo apt-get install -y \
  ca-certificates fonts-liberation \
  libappindicator3-1 libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
  libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
  libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release wget xdg-utils

# Or skip Puppeteer download
PUPPETEER_SKIP_DOWNLOAD=true npm install
```
</details>

<details>
<summary><strong>Downloads not appearing</strong></summary>

Check the download directory:
```bash
# Default location
# Windows: C:\Users\<You>\Downloads\Galion\
# macOS/Linux: ~/Downloads/Galion/

# Via API
curl http://localhost:4444/api/history
```
</details>

<details>
<summary><strong>yt-dlp not found</strong></summary>

Make sure yt-dlp is in your PATH:
```bash
# Check if yt-dlp is accessible
which yt-dlp  # Linux/macOS
where yt-dlp  # Windows

# If not, add to PATH or install globally
pip install --user yt-dlp
```
</details>

---

## 🚀 Next Steps

Now that Galion is installed, here's what to do next:

1. **[Read the API Documentation](../api/overview)** — Learn how to use the powerful API
2. **[Explore Supported Platforms](../platforms/overview)** — See what you can download
3. **[Configure API Keys](../api/overview#-api-key-management)** — Unlock full platform support
4. **[Join the Community](https://github.com/galion-studio/galion-universal-downloader/discussions)** — Get help and share ideas

---

## 💡 Tips for Best Experience

1. **Install yt-dlp** — Seriously, it makes video downloads so much better
2. **Set up API keys** — Better rate limits and more features
3. **Use the Web UI** — It's beautiful and has all features
4. **Enable transcription** — Auto-generate subtitles for videos
5. **Use Docker for production** — Easier updates and isolation

---

<div align="center">

**Need help?** Open an [issue](https://github.com/galion-studio/galion-universal-downloader/issues) or join [discussions](https://github.com/galion-studio/galion-universal-downloader/discussions)!

**Happy downloading!** 🏴‍☠️

</div>
