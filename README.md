<div align="center">

# 🌌 Galion Universal Downloader

### *AI-Powered Cognitive Download Engine*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-orange.svg)](https://developer.galion.app)

<p align="center">
  <strong>🧠 Neural-Net Analytics</strong> • 
  <strong>🔍 Cognitive Search</strong> • 
  <strong>📸 Screenshot Capture</strong> • 
  <strong>🌐 Multi-Platform</strong>
</p>

<img src="https://raw.githubusercontent.com/your-username/galion-downloader/main/docs/banner.png" alt="Galion Banner" width="100%" />

---

**A next-generation universal downloader with built-in AI cognitive capabilities.**  
**Download from 10+ platforms. Learn your preferences. Adapt to your workflow.**

[🚀 Quick Start](#-quick-start) •
[✨ Features](#-features) •
[📖 Documentation](#-documentation) •
[🤝 Contributing](#-contributing)

</div>

---

## 🎯 What is Galion?

Galion is not just another downloader—it's a **cognitive AI partner** for content acquisition. Inspired by [Project Synapse](https://github.com/angrysky56/project-synapse-mcp), Galion combines powerful multi-platform downloading with:

- **🧠 Neural-Net Style Analytics** - Learns your usage patterns and adapts the UI
- **🔍 Cognitive Search** - Semantic understanding of your downloaded content
- **📊 Knowledge Graph** - Builds connections between your downloads
- **💾 Local-First Architecture** - 100% serverless, your data stays yours

```
┌─────────────────────────────────────────────────────────────┐
│                    GALION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐    ┌───────────────┐    ┌───────────────┐   │
│   │  URL     │ -> │  Platform     │ -> │  Cognitive    │   │
│   │  Input   │    │  Detection    │    │  Engine       │   │
│   └──────────┘    └───────────────┘    └───────────────┘   │
│                           │                    │            │
│                           v                    v            │
│                   ┌───────────────┐    ┌───────────────┐   │
│                   │  Universal    │    │  Knowledge    │   │
│                   │  Downloader   │    │  Graph        │   │
│                   └───────────────┘    └───────────────┘   │
│                           │                    │            │
│                           v                    v            │
│                   ┌─────────────────────────────────┐      │
│                   │     Adaptive User Interface      │      │
│                   │   (Learns your preferences)      │      │
│                   └─────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🌐 Multi-Platform Support

| Platform | Content Types | API Required |
|----------|--------------|--------------|
| 🎨 **CivitAI** | Models, LoRAs, Checkpoints | Optional |
| 🐙 **GitHub** | Repos, Releases, Files | Optional |
| 🎬 **YouTube** | Videos, Audio, Playlists | No |
| 📨 **Telegram** | Messages, Media, Files | Yes |
| 🌐 **Generic** | Any URL with media | No |

### 🧠 Cognitive Intelligence

```javascript
// The Cognitive Engine learns from your behavior
analytics.trackFeature('download');     // Tracks feature usage
analytics.trackPlatform('civitai');     // Remembers platform preferences
analytics.generateInsights();           // Discovers patterns in your usage
```

**Key Capabilities:**
- **Semantic Search** - Find downloads by meaning, not just keywords
- **Usage Decay** - Recent activities weighted higher (neural-net style)
- **Cluster Detection** - Groups related content automatically
- **Bridge Concepts** - Identifies cross-domain connections
- **Trending Topics** - Surfaces your most active areas

### 📊 Adaptive UI

The interface **learns and adapts** to your workflow:

- ⭐ **Smart Sorting** - Frequently used platforms appear first
- 🔍 **Intelligent Search** - Search across platforms with semantic understanding
- 📈 **Usage Indicators** - Visual feedback on your most-used features
- 💡 **Smart Suggestions** - Recommends configurations based on behavior
- 🎯 **Top 3 Pattern** - Shows most relevant items, expand for more

### 🛠️ Developer Tools

| Feature | Description |
|---------|-------------|
| 📁 **File Scanner** | Analyze your downloads folder |
| 🎙️ **Transcription** | Whisper integration for video transcription |
| 📊 **Reports** | Generate detailed folder statistics |
| 🌳 **Directory Tree** | Visual file structure |
| 📧 **Email Reports** | Send summaries to your inbox |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/galion-downloader.git

# Navigate to directory
cd galion-downloader

# Install dependencies
npm install

# Start the server
npm start
```

### First Run

1. Open `http://localhost:3000` in your browser
2. Paste any supported URL
3. Click Download
4. Watch the magic happen! ✨

### Configuration (Optional)

Click the ⚙️ **Settings** button to configure API keys for enhanced functionality:

```
🎨 CivitAI    - Download models with metadata
🐙 GitHub     - Access private repos, higher rate limits  
📨 Telegram   - Download from channels/groups
📧 Email      - Send download reports
```

---

## 📖 Documentation

### Project Structure

```
galion-downloader/
├── 📁 public/          # Frontend assets
│   ├── index.html      # Main UI
│   ├── app.js          # Frontend logic + analytics
│   └── styles.css      # Galion v3 design system
├── 📁 src/
│   ├── 📁 core/        # Core services
│   │   ├── CognitiveEngine.js    # 🧠 AI knowledge management
│   │   ├── UniversalDownloader.js
│   │   ├── PlatformManager.js
│   │   ├── ApiKeyManager.js
│   │   ├── TranscriptionService.js
│   │   └── FileSystemScanner.js
│   └── 📁 platforms/   # Platform handlers
│       ├── CivitaiPlatform.js
│       ├── GithubPlatform.js
│       ├── YoutubePlatform.js
│       └── TelegramPlatform.js
├── 📁 data/            # Local data storage
│   └── cognitive/      # Knowledge graph & sessions
├── 📁 downloads/       # Downloaded content
├── server.js           # Express + WebSocket server
└── package.json
```

### API Reference

#### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/download` | POST | Download from URL |
| `/api/download/batch` | POST | Batch download multiple URLs |
| `/api/parse` | POST | Parse URL and detect platform |
| `/api/keys` | GET | List API key configurations |
| `/api/keys/:platform` | POST | Set API key |
| `/api/history` | GET | Get download history |
| `/api/status` | GET | Server status |

#### Cognitive Engine Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cognitive/search` | POST | Semantic search |
| `/api/cognitive/ingest` | POST | Add content to knowledge graph |
| `/api/cognitive/insights` | GET | Get generated insights |
| `/api/session` | GET | Get/create user session |

### Environment Variables

```env
# Server
PORT=3000
DOWNLOAD_DIR=./downloads

# API Keys (optional)
CIVITAI_API_KEY=your_key
GITHUB_TOKEN=your_token
TELEGRAM_API_ID=your_id
TELEGRAM_API_HASH=your_hash

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
```

---

## 🧠 The Cognitive Engine

Inspired by [Project Synapse](https://github.com/angrysky56/project-synapse-mcp), Galion includes a local, serverless cognitive engine:

### How It Works

```
1. INGEST
   Raw content → Semantic Features → Keywords → Entities
   
2. CONNECT  
   Find related nodes → Build knowledge graph → Create connections
   
3. LEARN
   Track usage → Apply time decay → Prioritize recent patterns
   
4. DISCOVER
   Detect clusters → Find bridges → Surface trends → Generate insights
```

### Key Concepts

- **Knowledge Graph** - Nodes connected by semantic similarity
- **Semantic Index** - Fast keyword-to-node lookup
- **Usage Decay** - 5% daily decay ensures recent activities matter more
- **Cluster Detection** - Groups with similarity > 70%
- **Bridge Nodes** - Concepts connecting 3+ clusters

### Example Usage

```javascript
import CognitiveEngine from './src/core/CognitiveEngine.js';

const engine = new CognitiveEngine();
await engine.initialize();

// Ingest content
await engine.ingestContent(
  'Downloaded Stable Diffusion LoRA from CivitAI for anime style',
  { source: 'civitai', type: 'model' }
);

// Search with semantic understanding
const results = await engine.cognitiveSearch('anime AI models');

// Generate insights
const insights = await engine.generateInsights();
```

---

## 🎨 Design System

Galion uses a minimal, intentional design inspired by modern developer tools:

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0a` | Background |
| `--text-primary` | `#fafafa` | Primary text |
| `--accent` | `#6366f1` | Interactive elements |
| `--success` | `#22c55e` | Success states |
| `--warning` | `#f59e0b` | Warnings |

### Components

- **Cards** - Glassmorphism with subtle borders
- **Buttons** - Three variants: primary, secondary, ghost
- **Inputs** - Dark with glow focus states
- **Modals** - Backdrop blur with smooth animations
- **Toast** - Non-intrusive notifications

---

## 🤝 Contributing

We welcome contributions! Galion is 100% open source.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/galion-downloader.git

# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

### Contribution Guidelines

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to branch (`git push origin feature/amazing-feature`)
5. 🎉 Open a Pull Request

### Areas for Contribution

- [ ] Add more platform handlers
- [ ] Improve cognitive search algorithms
- [ ] Create browser extension
- [ ] Add more transcription providers
- [ ] Enhance UI accessibility
- [ ] Write tests

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Project Synapse](https://github.com/angrysky56/project-synapse-mcp) - Inspiration for cognitive architecture
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloading
- [Whisper](https://github.com/openai/whisper) - Audio transcription
- All our amazing contributors!

---

<div align="center">

### 🌟 Star this repo if you find it useful!

**Built with ❤️ by the Galion Team**

[🌐 developer.galion.app](https://developer.galion.app)

<sub>Open source. Privacy-first. Cognitive intelligence.</sub>

</div>
