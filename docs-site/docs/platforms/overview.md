---
sidebar_position: 1
---

# 🌍 Platform Support

<div align="center">

### **36+ Platforms. One Tool. Infinite Possibilities.**

*If it's on the internet, Galion can probably download it.* 🏴‍☠️

</div>

---

## 📊 Platform Overview

Galion supports **36+ platforms** out of the box, with more being added regularly. Each platform has a dedicated handler that understands the site's structure and extracts content intelligently.

### Support Levels

| Level | Icon | Description |
|-------|------|-------------|
| **Full** | ✅ | Native platform handler with full feature support |
| **Generic** | 🔄 | Works via generic scraping or yt-dlp |
| **Auth Required** | 🔑 | Needs API key or login for functionality |
| **Coming Soon** | 🔜 | In development |

---

## 🎬 Video Platforms

### YouTube ✅ Full Support

**The world's largest video platform.** We've got you covered.

| Feature | Support | Notes |
|---------|---------|-------|
| Single Videos | ✅ | All qualities up to 8K |
| Shorts | ✅ | Full quality |
| Playlists | ✅ | Entire playlist download |
| Channels | ✅ | All videos from a channel |
| Live Streams | ✅ | Ongoing + finished streams |
| Premiere Videos | ✅ | Once publicly available |
| Audio Only | ✅ | MP3, M4A, OPUS |
| Subtitles | ✅ | Auto + manual captions |
| Thumbnails | ✅ | High-res thumbnails |
| Metadata | ✅ | Title, description, tags |

**Example URLs:**
```
https://youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
https://youtube.com/shorts/abc123
https://youtube.com/playlist?list=PLxyz
https://youtube.com/@channelname
```

**Quality Options:**
- `best` — Highest available (up to 8K)
- `1080p`, `720p`, `480p`, `360p` — Specific resolution
- `audio` — Best audio only

---

### TikTok ✅ Full Support

**Short-form video domination.** Download any TikTok content.

| Feature | Support | Notes |
|---------|---------|-------|
| Single Videos | ✅ | No watermark available |
| Slideshows | ✅ | All images + audio |
| User Profiles | ✅ | All public videos |
| Sounds/Audio | ✅ | Original audio extraction |
| Video Effects | ✅ | Full quality |

**Example URLs:**
```
https://tiktok.com/@username/video/1234567890
https://vm.tiktok.com/abc123
https://tiktok.com/@username
https://tiktok.com/music/sound-name-123456
```

**Pro Tips:**
- TikTok aggressively blocks scrapers — we handle that!
- Use the mobile share link (vm.tiktok.com) for best results

---

### Vimeo ✅ Full Support

**The professional video platform.**

| Feature | Support | Notes |
|---------|---------|-------|
| Public Videos | ✅ | Up to 8K |
| Private Videos | 🔑 | With password |
| Showcases | ✅ | Album downloads |
| Channels | ✅ | All videos |
| On-Demand | ⚠️ | Purchase required |

---

### Twitch 🔄 Generic Support

| Feature | Support | Notes |
|---------|---------|-------|
| VODs | ✅ | Past broadcasts |
| Clips | ✅ | Short clips |
| Highlights | ✅ | Creator highlights |
| Live Streams | ⚠️ | Record while live |

---

### Other Video Platforms

| Platform | Support | What Works |
|----------|---------|-----------|
| **Dailymotion** | 🔄 | Videos, playlists |
| **Kick** | 🔄 | VODs, clips |
| **Rumble** | 🔄 | Videos |
| **Odysee/LBRY** | 🔄 | Videos |
| **PeerTube** | 🔄 | Any instance |
| **Bilibili** | 🔄 | Public videos |

---

## 📸 Social Media Platforms

### Instagram ✅ Full Support

**Photos, Reels, Stories, and more.**

| Feature | Support | Notes |
|---------|---------|-------|
| Posts (Photos) | ✅ | Full resolution |
| Carousel Posts | ✅ | All images |
| Reels | ✅ | Full quality video |
| Stories | 🔑 | Requires session |
| IGTV | ✅ | Long-form videos |
| Profile Downloads | ✅ | All public posts |
| Highlights | 🔑 | Requires session |

**Example URLs:**
```
https://instagram.com/p/ABC123/
https://instagram.com/reel/ABC123/
https://instagram.com/username/
https://instagram.com/stories/username/
```

**⚠️ Important:**
- Instagram is aggressive about rate limiting
- Use sessions for best results
- Don't mass-download too quickly

---

### Twitter/X ✅ Full Support

**Tweets, threads, and media.**

| Feature | Support | Notes |
|---------|---------|-------|
| Single Tweets | ✅ | Text + media |
| Videos | ✅ | Best quality |
| GIFs | ✅ | As video or GIF |
| Images | ✅ | Full resolution |
| Threads | ✅ | Full thread content |
| Spaces | ⚠️ | Recorded spaces |
| Profiles | ✅ | Recent tweets |

**Example URLs:**
```
https://twitter.com/username/status/1234567890
https://x.com/username/status/1234567890
https://twitter.com/username
```

---

### Reddit ✅ Full Support

**The front page of the internet.**

| Feature | Support | Notes |
|---------|---------|-------|
| Videos | ✅ | Best quality + audio |
| Images | ✅ | Full resolution |
| Galleries | ✅ | All images |
| Crossposted Content | ✅ | Original source |
| Comments | ✅ | JSON export |
| User Profiles | ✅ | Public submissions |
| Subreddit Scraping | ✅ | Top/new/hot posts |

**Example URLs:**
```
https://reddit.com/r/subreddit/comments/abc123/post_title/
https://redd.it/abc123
https://reddit.com/user/username
https://reddit.com/r/subreddit/
```

**Note:** Reddit videos store audio separately — we automatically combine them!

---

### Other Social Platforms

| Platform | Support | What Works |
|----------|---------|-----------|
| **Facebook** | 🔑 | Public videos, with login more |
| **Pinterest** | 🔄 | Pins, boards |
| **Tumblr** | 🔄 | Posts, blogs |
| **LinkedIn** | 🔑 | Videos (with session) |
| **Snapchat** | ⚠️ | Public stories only |

---

## 🎨 AI & Creative Platforms

### CivitAI ✅ Full Support

**The home of Stable Diffusion models.**

| Feature | Support | Notes |
|---------|---------|-------|
| Models | ✅ | All types (Checkpoint, LoRA, etc.) |
| Model Versions | ✅ | Choose specific version |
| Preview Images | ✅ | All sample images |
| Model Info | ✅ | Full metadata JSON |
| Articles | ✅ | Full article content |
| User Profiles | ✅ | All user's models |
| Image Galleries | ✅ | Browse & download |

**Example URLs:**
```
https://civitai.com/models/12345
https://civitai.com/models/12345?modelVersionId=67890
https://civitai.com/articles/12345
https://civitai.com/user/username
https://civitai.com/images/12345
```

**Download Includes:**
- `.safetensors` / `.ckpt` model file
- All preview images
- `model_info.json` with full metadata
- Training data info (if available)

**API Key Benefits:**
- Access NSFW content
- Higher rate limits
- Early access models
- Full resolution images

**Get Your Key:** [civitai.com/user/account](https://civitai.com/user/account) → API Keys

---

### HuggingFace ✅ Full Support

**The GitHub of machine learning.**

| Feature | Support | Notes |
|---------|---------|-------|
| Model Repos | ✅ | All files |
| Datasets | ✅ | Full dataset download |
| Spaces | ⚠️ | Source code only |
| Specific Files | ✅ | Download individual files |
| Large Files (LFS) | ✅ | Handles any size |

**Example URLs:**
```
https://huggingface.co/meta-llama/Llama-2-7b
https://huggingface.co/datasets/username/dataset
https://huggingface.co/username/model/blob/main/model.safetensors
```

**API Key Benefits:**
- Access gated models (Llama 2, etc.)
- Private repositories
- Higher rate limits

---

### Other AI Platforms

| Platform | Support | What Works |
|----------|---------|-----------|
| **ArtStation** | 🔄 | Artwork, portfolios |
| **DeviantArt** | 🔄 | Artwork, galleries |
| **Pixiv** | 🔑 | With session cookie |
| **OpenAI (DALL-E)** | ⚠️ | Public galleries |

---

## 💻 Developer Platforms

### GitHub ✅ Full Support

**World's largest code hosting platform.**

| Feature | Support | Notes |
|---------|---------|-------|
| Repositories | ✅ | Clone/download as ZIP |
| Releases | ✅ | All release assets |
| Specific Tags | ✅ | Download any tag |
| Gists | ✅ | Single/multi-file gists |
| Raw Files | ✅ | Direct file download |
| Private Repos | 🔑 | With token |

**Example URLs:**
```
https://github.com/user/repo
https://github.com/user/repo/releases/tag/v1.0.0
https://github.com/user/repo/releases/latest
https://gist.github.com/user/abc123
https://raw.githubusercontent.com/user/repo/main/file.txt
```

**Download Includes:**
- Source code (ZIP or clone)
- All release assets
- `repo_info.json` with metadata
- README content

**API Key Benefits:**
- **60 → 5,000 requests/hour**
- Access private repos
- Bypass rate limits

---

### GitLab 🔄 Generic Support

| Feature | Support | Notes |
|---------|---------|-----------|
| Public Repos | ✅ | Clone/download |
| Releases | ✅ | Assets |
| Self-hosted | ✅ | Any GitLab instance |

---

### Bitbucket 🔄 Generic Support

| Feature | Support | Notes |
|---------|---------|-----------|
| Public Repos | ✅ | Download as ZIP |
| Snippets | ✅ | Code snippets |

---

## 🔊 Audio Platforms

### SoundCloud 🔄 Generic Support

| Feature | Support | Notes |
|---------|---------|-----------|
| Tracks | ✅ | MP3 download |
| Playlists | ✅ | All tracks |
| Artist Pages | ✅ | All public tracks |
| Reposts | ⚠️ | May not include |

---

### Bandcamp 🔄 Generic Support

| Feature | Support | Notes |
|---------|---------|-----------|
| Free Tracks | ✅ | Full quality |
| Free Albums | ✅ | All tracks |
| Purchased | ⚠️ | Requires login |

---

### Spotify 🔑 Auth Required

| Feature | Support | Notes |
|---------|---------|-----------|
| Metadata | ✅ | Track/album info |
| Playlist Info | ✅ | Track list |
| Actual Audio | ❌ | DRM protected |

**Note:** Galion can get Spotify metadata and help you find tracks elsewhere, but we don't download DRM-protected streams.

---

## 📰 News & Archives

### Archive.org ✅ Full Support

**The Internet Archive — preserving the web since 1996.**

| Feature | Support | Notes |
|---------|---------|-------|
| Wayback Machine | ✅ | Download archived pages |
| Books | ✅ | PDF downloads |
| Audio | ✅ | Full collections |
| Video | ✅ | Full quality |
| Software | ✅ | Archives |
| Collections | ✅ | Batch download |

**Example URLs:**
```
https://web.archive.org/web/20200101/https://example.com
https://archive.org/details/item-identifier
https://archive.org/download/item-identifier/filename
```

---

### News Sites ✅ Full Support

We support **200+ news sites** with intelligent article extraction:

**Major Outlets:**
- BBC, CNN, NYT, Washington Post
- The Guardian, Reuters, AP News
- Al Jazeera, France24, DW
- And many more!

**What We Extract:**
- Article text (clean, readable)
- Images (full resolution)
- Author, date, tags
- Full metadata

---

### Academic Sources

| Platform | Support | What Works |
|----------|---------|-----------|
| **arXiv** | ✅ | PDF papers |
| **PubMed** | ✅ | PDFs when available |
| **IEEE** | ⚠️ | Open access only |
| **ACM** | ⚠️ | Open access only |

---

## 📁 Cloud Storage

### Direct Download Links ✅ Full Support

| Service | Support | Notes |
|---------|---------|-------|
| **Google Drive** | ⚠️ | Public files, may need auth |
| **Dropbox** | ✅ | Public links |
| **MEGA** | ✅ | Public links |
| **OneDrive** | ⚠️ | Public links |
| **iCloud** | ⚠️ | Shared photos |
| **MediaFire** | ✅ | Public files |
| **Sendspace** | ✅ | Public files |

---

## 🧅 Special Platforms

### Tor / .onion Sites ✅ Full Support

**Access the dark web (legally — .onion sites have legitimate uses).**

| Feature | Support | Notes |
|---------|---------|-------|
| Static Pages | ✅ | HTML content |
| Images | ✅ | All formats |
| Files | ✅ | Direct downloads |
| JavaScript Sites | ⚠️ | Limited support |

**Requirements:**
1. Tor must be installed and running
2. Set the proxy: `TOR_PROXY=socks5://127.0.0.1:9050`

**Example URLs:**
```
http://exampleonion.onion/page
http://abcdefghijk.onion/files/document.pdf
```

**Legal Note:** Tor has many legitimate uses — journalism, whistleblowing, privacy. Always use it responsibly and legally.

---

### Telegram ✅ Full Support

**Channels, media, and files.**

| Feature | Support | Notes |
|---------|---------|-------|
| Public Channels | ✅ | All posts |
| Media/Files | ✅ | Full quality |
| Stickers | ✅ | PNG/WEBP |
| Private Channels | 🔑 | With session |

**Example URLs:**
```
https://t.me/channelname
https://t.me/channelname/123
```

---

### Pastebin ✅ Full Support

| Feature | Support | Notes |
|---------|---------|-------|
| Public Pastes | ✅ | Raw text |
| Private Pastes | ❌ | Not accessible |
| User Profiles | ⚠️ | Public pastes only |

---

## 🔞 Adult Platforms (18+)

Galion supports some adult platforms. These are disabled by default.

| Platform | Support | Notes |
|----------|---------|-------|
| **PornHub** | 🔄 | Via yt-dlp |
| **XVideos** | 🔄 | Via yt-dlp |
| **xHamster** | 🔄 | Via yt-dlp |
| **RedGIFs** | 🔄 | Via yt-dlp |

**Note:** These platforms are only accessible if you explicitly enable adult content in settings.

---

## 🌐 Generic Fallback

**Can't find your platform?** Galion has a powerful generic handler!

### What Generic Mode Can Do:
- Extract video/audio from almost any page
- Find and download images
- Extract text content
- Detect and download files

**How it works:**
1. Tries yt-dlp (supports 1000+ sites)
2. Falls back to intelligent scraping
3. Uses multiple strategies (HTML, JS, network)

**Just paste any URL and try it!**

---

## 🆕 Requesting New Platforms

Want support for a platform we don't have yet?

1. **Check if yt-dlp supports it** — Many sites work automatically
2. **Open an issue** — [GitHub Issues](https://github.com/galion-studio/galion-universal-downloader/issues)
3. **Contribute!** — Platform modules are modular and easy to add

### Platform Request Template

```markdown
## Platform Request: [Platform Name]

**URL:** https://example.com

**What I want to download:**
- [ ] Videos
- [ ] Images
- [ ] Files
- [ ] User profiles
- [ ] Other: ___

**Example URLs:**
- https://example.com/content/123

**Notes:**
Any special requirements or login needed?
```

---

## 📊 Full Platform Matrix

| Platform | Video | Images | Files | Profiles | Auth |
|----------|-------|--------|-------|----------|------|
| YouTube | ✅ | ✅ | ❌ | ✅ | ❌ |
| TikTok | ✅ | ✅ | ❌ | ✅ | ❌ |
| Instagram | ✅ | ✅ | ❌ | ✅ | 🔑 |
| Twitter/X | ✅ | ✅ | ❌ | ✅ | ❌ |
| Reddit | ✅ | ✅ | ❌ | ✅ | ❌ |
| CivitAI | ❌ | ✅ | ✅ | ✅ | 🔑 |
| HuggingFace | ❌ | ❌ | ✅ | ✅ | 🔑 |
| GitHub | ❌ | ❌ | ✅ | ✅ | 🔑 |
| Archive.org | ✅ | ✅ | ✅ | ❌ | ❌ |
| Telegram | ✅ | ✅ | ✅ | ✅ | 🔑 |
| News Sites | ❌ | ✅ | ❌ | ❌ | ❌ |
| .onion | ❌ | ✅ | ✅ | ❌ | ❌ |

---

<div align="center">

**Missing a platform?** [Request it!](https://github.com/galion-studio/galion-universal-downloader/issues)

**Want to add one?** [Contribute!](https://github.com/galion-studio/galion-universal-downloader/blob/main/CONTRIBUTING.md)

🏴‍☠️

</div>
