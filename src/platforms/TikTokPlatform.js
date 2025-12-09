/**
 * TikTok Platform - Download from TikTok
 * Uses open-source APIs and methods
 * Supports: Videos, Profiles, Sounds, Slideshows
 */

import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import http from 'http';

// TikTok URL patterns
const TIKTOK_PATTERNS = {
  video: /tiktok\.com\/@([^\/]+)\/video\/(\d+)/,
  shortVideo: /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
  profile: /tiktok\.com\/@([^\/\?]+)/,
  sound: /tiktok\.com\/music\/([^\/\?]+)/,
  tag: /tiktok\.com\/tag\/([^\/\?]+)/
};

// Open-source TikTok API endpoints
const API_ENDPOINTS = {
  tikwm: 'https://www.tikwm.com/api/',
  snaptik: 'https://snaptik.app/abc',
  ssstik: 'https://ssstik.io/abc',
  ttsave: 'https://ttsave.app/download',
  musicaldown: 'https://musicaldown.com/download'
};

export class TikTokPlatform {
  constructor() {
    this.name = 'TikTok';
    this.id = 'tiktok';
    this.icon = '🎵';
    this.apiKey = null;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  matches(url) {
    return url.includes('tiktok.com') || url.includes('vm.tiktok.com');
  }

  parseUrl(url) {
    for (const [type, pattern] of Object.entries(TIKTOK_PATTERNS)) {
      const match = url.match(pattern);
      if (match) {
        return {
          platformId: this.id,
          platform: this.name,
          url,
          contentType: type,
          username: match[1],
          videoId: match[2] || null
        };
      }
    }

    return {
      platformId: this.id,
      platform: this.name,
      url,
      contentType: 'unknown'
    };
  }

  async download(url, options = {}) {
    const parsed = this.parseUrl(url);
    const { onProgress = () => {}, destDir = './downloads/tiktok' } = options;

    onProgress({ status: `Detected ${parsed.contentType} content`, progress: 10 });

    try {
      // Try TikWM API first (most reliable)
      const result = await this.downloadWithTikWM(url, parsed, options);
      return result;
    } catch (error) {
      // Fallback methods
      return this.downloadWithFallback(url, parsed, options);
    }
  }

  async downloadWithTikWM(url, parsed, options = {}) {
    const { onProgress = () => {}, destDir = './downloads/tiktok' } = options;

    onProgress({ status: 'Fetching video info via TikWM...', progress: 20 });

    const apiUrl = `${API_ENDPOINTS.tikwm}?url=${encodeURIComponent(url)}`;
    
    const response = await this.httpGet(apiUrl);
    let data;
    
    try {
      data = JSON.parse(response);
    } catch (e) {
      throw new Error('Invalid API response');
    }

    if (data.code !== 0 || !data.data) {
      throw new Error(data.msg || 'Failed to fetch video info');
    }

    const videoData = data.data;
    
    // Create output directory
    const videoId = videoData.id || parsed.videoId || Date.now().toString();
    const outputDir = path.join(destDir, parsed.username || 'unknown', videoId);
    await fs.ensureDir(outputDir);

    onProgress({ status: 'Downloading video...', progress: 40 });

    const files = [];

    // Download video without watermark
    if (videoData.play) {
      const videoPath = path.join(outputDir, `${videoId}_nowm.mp4`);
      await this.downloadFile(videoData.play, videoPath);
      files.push({ path: videoPath, type: 'video_no_watermark' });
    }

    // Download video with watermark (backup)
    if (videoData.wmplay) {
      const wmVideoPath = path.join(outputDir, `${videoId}_wm.mp4`);
      await this.downloadFile(videoData.wmplay, wmVideoPath);
      files.push({ path: wmVideoPath, type: 'video_watermark' });
    }

    // Download audio
    if (videoData.music) {
      const audioPath = path.join(outputDir, `${videoId}_audio.mp3`);
      await this.downloadFile(videoData.music, audioPath);
      files.push({ path: audioPath, type: 'audio' });
    }

    // Download cover
    if (videoData.cover) {
      const coverPath = path.join(outputDir, `${videoId}_cover.jpg`);
      await this.downloadFile(videoData.cover, coverPath);
      files.push({ path: coverPath, type: 'cover' });
    }

    onProgress({ status: 'Saving metadata...', progress: 80 });

    // Save metadata
    const metadata = {
      url,
      id: videoData.id,
      title: videoData.title,
      author: videoData.author,
      duration: videoData.duration,
      createTime: videoData.create_time,
      statistics: {
        plays: videoData.play_count,
        likes: videoData.digg_count,
        comments: videoData.comment_count,
        shares: videoData.share_count
      },
      music: {
        title: videoData.music_info?.title,
        author: videoData.music_info?.author
      },
      downloadedAt: new Date().toISOString()
    };

    const metadataPath = path.join(outputDir, 'metadata.json');
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });

    onProgress({ status: 'Complete!', progress: 100 });

    return {
      success: true,
      platform: this.name,
      contentType: parsed.contentType,
      videoId,
      outputDir,
      files,
      metadata,
      metadataPath
    };
  }

  async downloadWithFallback(url, parsed, options = {}) {
    const { destDir = './downloads/tiktok' } = options;
    
    const outputDir = path.join(destDir, parsed.username || 'unknown', parsed.videoId || Date.now().toString());
    await fs.ensureDir(outputDir);

    const infoPath = path.join(outputDir, 'download_info.json');
    await fs.writeJson(infoPath, {
      url,
      ...parsed,
      status: 'requires_manual_download',
      alternatives: [
        'https://snaptik.app',
        'https://ssstik.io',
        'https://ttsave.app',
        'yt-dlp'
      ],
      commands: {
        ytdlp: `yt-dlp "${url}" -o "${outputDir}/%(id)s.%(ext)s"`
      },
      downloadedAt: new Date().toISOString()
    }, { spaces: 2 });

    return {
      success: true,
      partial: true,
      platform: this.name,
      outputDir,
      message: 'API methods failed. Info saved with alternative methods.',
      alternatives: [
        'Use yt-dlp: yt-dlp "' + url + '"',
        'Manual download from: snaptik.app, ssstik.io, ttsave.app'
      ]
    };
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(destPath);

      const request = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.tiktok.com/'
        }
      }, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          return this.downloadFile(response.headers.location, destPath)
            .then(resolve)
            .catch(reject);
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(destPath);
        });
      });

      request.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }

  async validateApiKey(key) {
    return { valid: true, message: 'TikTok downloads work without API key' };
  }
}

export default TikTokPlatform;
