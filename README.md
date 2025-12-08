<p align="center">
  <img src="galion-v2/public/galion-logo.svg" width="120" height="120" alt="Galion Logo">
</p>

<h1 align="center">Galion Universal Downloader</h1>

<p align="center">
  <strong>Download Everything. From Everywhere. Effortlessly.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#supported-platforms">Platforms</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node 18+">
  <img src="https://img.shields.io/badge/made%20with-love-red.svg" alt="Made with Love">
</p>

---

## ✨ What is Galion?

**Galion Universal Downloader** is the ultimate open-source tool for downloading content from any platform. Whether it's AI models from CivitAI, repositories from GitHub, videos from YouTube, or files from Telegram – Galion handles it all with a beautiful, calm interface.

> 🎯 **Philosophy**: One tool. Every platform. Zero complexity.

---

## 🚀 Features

- 🌐 **Multi-Platform Support** - CivitAI, GitHub, YouTube, Telegram, and any generic URL
- 🔍 **Smart Platform Detection** - Just paste a URL, we detect the rest
- 📊 **Download Progress** - Real-time progress tracking with beautiful UI
- 🧠 **Cognitive Intelligence** - AI-powered insights and semantic search
- 🌙 **Dark & Light Themes** - Easy on your eyes, day or night
- 📱 **Responsive Design** - Works beautifully on any screen size
- 🔒 **100% Local** - Your API keys never leave your machine
- ⚡ **Fast & Lightweight** - Minimal dependencies, maximum performance

---

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone https://github.com/galion-app/universal-downloader.git
cd universal-downloader

# Install dependencies
npm install

# Start the development server
npm run dev
```

That's it! Open [http://localhost:5173](http://localhost:5173) and start downloading! 🎉

---

## 🎮 Usage

### Basic Usage

1. **Paste a URL** - Just copy any supported URL and paste it
2. **Click Download** - Galion auto-detects the platform and handles everything
3. **Done!** - Your file is downloaded to the `downloads` folder

### Supported URL Examples

```
# CivitAI Models
https://civitai.com/models/12345

# GitHub Repositories
https://github.com/user/repo

# YouTube Videos
https://youtube.com/watch?v=abc123

# Telegram Files
https://t.me/channel/123

# Any Direct URL
https://example.com/file.zip
```

---

## 🌍 Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| 🎨 **CivitAI** | ✅ Full Support | Models, LoRAs, Checkpoints, Embeddings |
| 🐙 **GitHub** | ✅ Full Support | Repos, Releases, Raw Files |
| 🎬 **YouTube** | ✅ Full Support | Videos, Audio extraction |
| 📱 **Telegram** | ✅ Full Support | Channel files, Media |
| 🌐 **Generic** | ✅ Full Support | Any direct download URL |

---

## 🧠 Cognitive Features

Galion includes optional AI-powered features:

- **Semantic Search** - Find downloads by meaning, not just keywords
- **Knowledge Graph** - Visualize connections between your downloads
- **Smart Suggestions** - AI recommends based on your patterns
- **Auto-Categorization** - Organize files automatically

> 💡 These features are optional and require API keys (stored locally)

---

## ⚙️ Configuration

### API Keys (Optional)

For enhanced features, add your API keys in Settings:

| Service | Purpose | Required |
|---------|---------|----------|
| CivitAI | Faster model downloads | Optional |
| GitHub | Higher rate limits | Optional |
| OpenAI | Cognitive features | Optional |

All keys are stored **locally** in your browser - never sent anywhere!

---

## 🛠️ Development

### Tech Stack

- ⚛️ **React 18** - Modern UI framework
- 📘 **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS** - Utility-first styling
- ⚡ **Vite** - Lightning-fast build tool
- 🎭 **Radix UI** - Accessible components
- 🎬 **Framer Motion** - Smooth animations

### Project Structure

```
galion-v2/
├── src/
│   ├── components/
│   │   ├── ui/          # Reusable UI components
│   │   ├── download/    # Download section
│   │   ├── history/     # History section
│   │   ├── settings/    # Settings section
│   │   └── cognitive/   # AI features section
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities
│   └── main.tsx         # Entry point
├── public/              # Static assets
└── index.html           # HTML template
```

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🤝 Contributing

We love contributions! Galion is a community-driven project.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing`)
5. **Open** a Pull Request

### Contribution Ideas

- 🌍 Add support for new platforms
- 🌐 Translations to other languages
- 📖 Improve documentation
- 🐛 Fix bugs
- ✨ Suggest new features

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📜 License

**MIT License** - Free for personal and commercial use!

```
Copyright (c) 2024 Galion

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 💖 Credits

Built with love by the [Galion](https://galion.app) team and amazing contributors.

Special thanks to:
- The open-source community
- All our contributors
- You, for using Galion!

---

<p align="center">
  <strong>⭐ Star us on GitHub if you find this useful!</strong>
</p>

<p align="center">
  <a href="https://github.com/galion-app/universal-downloader">
    <img src="https://img.shields.io/github/stars/galion-app/universal-downloader?style=social" alt="GitHub Stars">
  </a>
</p>

---

<p align="center">
  Made with ❤️ by the Galion community
</p>
