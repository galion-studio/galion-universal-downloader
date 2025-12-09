# Platform Compatibility

Galion Universal Downloader supports **36+ platforms** with automatic URL detection.

## 🎬 Video Platforms

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **YouTube** | youtube.com, youtu.be | Videos, Playlists, Channels, Shorts | Optional |
| **Vimeo** | vimeo.com | Videos, Channels | Optional |
| **Dailymotion** | dailymotion.com | Videos | No |
| **Twitch** | twitch.tv | VODs, Clips, Channels | No |
| **Kick** | kick.com | Videos, Streams | No |
| **Bilibili** | bilibili.com | Videos | No |
| **NicoNico** | nicovideo.jp | Videos | No |

## 📱 Social Media

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **Instagram** | instagram.com | Posts, Reels, Stories, Profiles | Optional |
| **TikTok** | tiktok.com | Videos, Profiles | No |
| **Twitter/X** | twitter.com, x.com | Tweets, Media, Threads | Optional |
| **Facebook** | facebook.com, fb.com | Videos, Posts | No |
| **Reddit** | reddit.com | Posts, Images, Videos, Comments | Optional |
| **Pinterest** | pinterest.com | Pins, Boards | No |
| **Tumblr** | tumblr.com | Posts, Blogs | No |

## 🤖 AI/ML Platforms

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **CivitAI** | civitai.com | Models, Images, Articles, Profiles | **Required for 18+** |
| **HuggingFace** | huggingface.co | Models, Datasets, Spaces | Required for gated |

## 💻 Code & Development

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **GitHub** | github.com, raw.githubusercontent.com | Repositories, Releases, Gists, Files | Optional |

## 🎵 Audio Platforms

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **SoundCloud** | soundcloud.com | Tracks, Playlists | No |
| **Spotify** | spotify.com | Track info (no download) | No |
| **Bandcamp** | bandcamp.com | Albums, Tracks | No |

## 💬 Messaging Platforms

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **Telegram** | t.me, telegram.me | Channels, Groups, Files | **Required** |
| **Discord** | discord.com | Attachments, Embeds | No |

## ☁️ Cloud Storage

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **Google Drive** | drive.google.com | Files, Folders | No |
| **Dropbox** | dropbox.com | Files | No |
| **MEGA** | mega.nz | Files, Folders | No |

## 🎨 Art & Image Platforms

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **ArtStation** | artstation.com | Artwork, Galleries | No |
| **DeviantArt** | deviantart.com | Art, Galleries | No |
| **Flickr** | flickr.com | Photos, Albums | No |
| **Imgur** | imgur.com | Images, Albums | No |

## 📰 News & Archives

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **News/RSS** | Various | Articles, RSS Feeds | No |
| **Archive.org** | archive.org | Wayback Machine, Media | No |

## 🔞 Adult Platforms

| Platform | URL Patterns | Features | API Key |
|----------|--------------|----------|---------|
| **PornHub** | pornhub.com | Videos | No |
| **XVideos** | xvideos.com | Videos | No |

*Age verification required. Use responsibly.*

## 🧅 Dark Web

| Platform | Features | Requirements |
|----------|----------|--------------|
| **Onion Sites** | .onion domains | Tor required |

---

## API Key Details

### CivitAI
**Required for:** 18+ NSFW content, higher rate limits

**Get key:** [civitai.com/user/account](https://civitai.com/user/account)
1. Log in to CivitAI
2. Go to Account Settings
3. Navigate to API Keys section
4. Create new key
5. Copy and paste in Settings

### HuggingFace
**Required for:** Gated models that require accepting terms

**Get key:** [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
1. Log in to HuggingFace
2. Go to Settings → Access Tokens
3. Create new token with read access
4. Copy and paste in Settings

### GitHub
**Optional but recommended:** Increases rate limits from 60/hour to 5000/hour

**Get key:** [github.com/settings/tokens](https://github.com/settings/tokens)
1. Go to Developer Settings → Personal Access Tokens
2. Generate new token (classic)
3. Select `repo` scope
4. Copy and paste in Settings

### Telegram
**Required for:** Private channels and groups

**Get key:** [t.me/BotFather](https://t.me/BotFather)
1. Message @BotFather
2. Send `/newbot`
3. Follow instructions to create bot
4. Copy the token provided

### Twitter
**Optional:** For protected tweets

**Get key:** [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard)
1. Create Twitter Developer account
2. Create a project and app
3. Generate Bearer Token

### Reddit
**Optional:** For higher rate limits

**Get key:** [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
1. Create "script" type app
2. Note the client ID and secret

---

## Content Types Supported

### Video
- `.mp4`, `.mkv`, `.avi`, `.mov`, `.webm`, `.flv`, `.wmv`, `.m4v`

### Audio
- `.mp3`, `.wav`, `.flac`, `.aac`, `.ogg`, `.m4a`, `.opus`

### Images
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.bmp`

### Models
- `.safetensors`, `.ckpt`, `.pt`, `.pth`, `.bin`, `.onnx`, `.h5`

### Documents
- `.pdf`, `.md`, `.txt`, `.json`, `.yaml`

### Archives
- `.zip`, `.rar`, `.7z`, `.tar`, `.gz`

---

## Open Source Libraries

We use these amazing open-source tools:

| Library | Stars | Purpose |
|---------|-------|---------|
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | ⭐ 91k | Video downloads |
| [puppeteer](https://github.com/puppeteer/puppeteer) | ⭐ 89k | Web scraping |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | ⭐ 12k | Transcription |
| [instaloader](https://github.com/instaloader/instaloader) | ⭐ 8k | Instagram |
| [telegraf](https://github.com/telegraf/telegraf) | ⭐ 8k | Telegram |
| [octokit](https://github.com/octokit/octokit.js) | ⭐ 7k | GitHub API |
| [TikTok-Api](https://github.com/davidteather/TikTok-Api) | ⭐ 5k | TikTok |
| [snoowrap](https://github.com/not-an-aardvark/snoowrap) | ⭐ 1k | Reddit |
