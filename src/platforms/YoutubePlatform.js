/**
 * YouTube Platform Module
 * Download videos, channels, playlists
 * Uses yt-dlp for reliable video downloading
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';

export class YoutubePlatform {
  constructor(options = {}) {
    this.name = 'YouTube';
    this.id = 'youtube';
    this.icon = '🎬';
    this.description = 'Videos, Playlists, Channels, Shorts';
    this.supportedTypes = ['video', 'playlist', 'channel', 'shorts'];
    this.requiresAuth = false;
    
    this.apiKey = options.apiKey || null;
    this.timeout = options.timeout || 300000;
    this.ytdlpPath = options.ytdlpPath || 'yt-dlp';
  }

  /**
   * Set API key (YouTube Data API)
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Parse URL and determine content type
   */
  async parseUrl(url) {
    const patterns = {
      video: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      shorts: /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      playlist: /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
      channel: /youtube\.com\/(c\/|channel\/|@)([^\/\?]+)/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = url.match(pattern);
      if (match) {
        return {
          contentType: type,
          id: match[1],
          url: url
        };
      }
    }

    return { contentType: 'unknown', url };
  }

  /**
   * Main download handler
   */
  async download(url, options = {}) {
    const parsed = await this.parseUrl(url);
    
    switch (parsed.contentType) {
      case 'video':
      case 'shorts':
        return this.downloadVideo(url, options);
      case 'playlist':
        return this.downloadPlaylist(url, options);
      case 'channel':
        return this.downloadChannel(parsed.id, options);
      default:
        return this.downloadVideo(url, options);
    }
  }

  /**
   * Download a single video
   */
  async downloadVideo(url, options = {}) {
    const { 
      downloadDir, 
      onProgress,
      quality = 'best',
      format = 'mp4',
      audioOnly = false
    } = options;

    const videoDir = path.join(downloadDir || process.cwd(), 'downloads', 'youtube');
    await fs.ensureDir(videoDir);

    return new Promise((resolve, reject) => {
      const args = [
        '--no-warnings',
        '--newline',
        '--progress',
        '-o', path.join(videoDir, '%(title)s.%(ext)s'),
        '--write-info-json',
        '--write-thumbnail',
        '--write-description'
      ];

      if (audioOnly) {
        args.push('-x', '--audio-format', 'mp3');
      } else {
        if (quality === 'best') {
          args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
        } else if (quality === '1080p') {
          args.push('-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]');
        } else if (quality === '720p') {
          args.push('-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]');
        } else if (quality === '480p') {
          args.push('-f', 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]');
        }
        args.push('--merge-output-format', format);
      }

      args.push(url);

      let videoInfo = {};
      let progress = 0;

      const ytdlp = spawn(this.ytdlpPath, args);

      ytdlp.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Parse progress
        const progressMatch = output.match(/(\d+\.?\d*)%/);
        if (progressMatch) {
          progress = parseFloat(progressMatch[1]);
          if (onProgress) {
            onProgress({ progress, status: 'Downloading...' });
          }
        }

        // Parse info
        const titleMatch = output.match(/\[download\] Destination: (.+)/);
        if (titleMatch) {
          videoInfo.filename = path.basename(titleMatch[1]);
        }
      });

      ytdlp.stderr.on('data', (data) => {
        console.error('yt-dlp error:', data.toString());
      });

      ytdlp.on('close', async (code) => {
        if (code === 0) {
          // Find downloaded files
          const files = await fs.readdir(videoDir);
          const newFiles = files.filter(f => 
            f.endsWith('.mp4') || f.endsWith('.mp3') || 
            f.endsWith('.webm') || f.endsWith('.mkv')
          );

          resolve({
            success: true,
            type: 'video',
            url,
            files: newFiles,
            outputDir: videoDir
          });
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });

      ytdlp.on('error', (err) => {
        // yt-dlp not installed, return download URL info instead
        resolve({
          success: false,
          type: 'video',
          url,
          error: 'yt-dlp not installed. Please install it: pip install yt-dlp',
          manualDownload: `You can manually download from: ${url}`,
          outputDir: videoDir
        });
      });
    });
  }

  /**
   * Download entire playlist
   */
  async downloadPlaylist(url, options = {}) {
    const { downloadDir, onProgress, quality = 'best' } = options;

    const playlistDir = path.join(downloadDir || process.cwd(), 'downloads', 'youtube_playlist');
    await fs.ensureDir(playlistDir);

    return new Promise((resolve, reject) => {
      const args = [
        '--no-warnings',
        '--newline',
        '--progress',
        '-o', path.join(playlistDir, '%(playlist_title)s/%(playlist_index)03d - %(title)s.%(ext)s'),
        '--write-info-json',
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '--yes-playlist',
        url
      ];

      let currentVideo = 0;
      let totalVideos = 0;

      const ytdlp = spawn(this.ytdlpPath, args);

      ytdlp.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Parse video count
        const countMatch = output.match(/Downloading (\d+) videos/);
        if (countMatch) {
          totalVideos = parseInt(countMatch[1]);
        }

        const indexMatch = output.match(/\[download\] Downloading video (\d+) of (\d+)/);
        if (indexMatch) {
          currentVideo = parseInt(indexMatch[1]);
          totalVideos = parseInt(indexMatch[2]);
          if (onProgress) {
            onProgress({
              current: currentVideo,
              total: totalVideos,
              progress: (currentVideo / totalVideos) * 100,
              status: `Downloading video ${currentVideo}/${totalVideos}`
            });
          }
        }
      });

      ytdlp.on('close', async (code) => {
        if (code === 0) {
          resolve({
            success: true,
            type: 'playlist',
            url,
            totalVideos,
            outputDir: playlistDir
          });
        } else {
          resolve({
            success: false,
            type: 'playlist',
            url,
            error: 'yt-dlp not installed or playlist download failed',
            outputDir: playlistDir
          });
        }
      });

      ytdlp.on('error', () => {
        resolve({
          success: false,
          type: 'playlist',
          url,
          error: 'yt-dlp not installed',
          outputDir: playlistDir
        });
      });
    });
  }

  /**
   * Download channel videos
   */
  async downloadChannel(channelId, options = {}) {
    const { downloadDir, onProgress, limit = 50 } = options;

    const channelUrl = channelId.startsWith('@') 
      ? `https://youtube.com/${channelId}/videos`
      : `https://youtube.com/channel/${channelId}/videos`;

    const channelDir = path.join(downloadDir || process.cwd(), 'downloads', `youtube_channel_${channelId}`);
    await fs.ensureDir(channelDir);

    return new Promise((resolve, reject) => {
      const args = [
        '--no-warnings',
        '--newline',
        '-o', path.join(channelDir, '%(upload_date)s - %(title)s.%(ext)s'),
        '--write-info-json',
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '--playlist-end', String(limit),
        channelUrl
      ];

      const ytdlp = spawn(this.ytdlpPath, args);
      let downloadedCount = 0;

      ytdlp.stdout.on('data', (data) => {
        if (data.toString().includes('[download]')) {
          downloadedCount++;
          if (onProgress) {
            onProgress({
              current: downloadedCount,
              status: `Downloaded ${downloadedCount} videos`
            });
          }
        }
      });

      ytdlp.on('close', async (code) => {
        resolve({
          success: code === 0,
          type: 'channel',
          channelId,
          downloadedCount,
          outputDir: channelDir
        });
      });

      ytdlp.on('error', () => {
        resolve({
          success: false,
          type: 'channel',
          channelId,
          error: 'yt-dlp not installed',
          outputDir: channelDir
        });
      });
    });
  }

  /**
   * Get video info without downloading
   */
  async getVideoInfo(url) {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-download',
        url
      ];

      const ytdlp = spawn(this.ytdlpPath, args);
      let jsonOutput = '';

      ytdlp.stdout.on('data', (data) => {
        jsonOutput += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(jsonOutput);
            resolve({
              success: true,
              info: {
                id: info.id,
                title: info.title,
                description: info.description,
                duration: info.duration,
                uploader: info.uploader,
                uploadDate: info.upload_date,
                viewCount: info.view_count,
                likeCount: info.like_count,
                thumbnail: info.thumbnail,
                formats: info.formats?.map(f => ({
                  formatId: f.format_id,
                  ext: f.ext,
                  resolution: f.resolution,
                  filesize: f.filesize
                }))
              }
            });
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse video info' });
          }
        } else {
          resolve({ success: false, error: 'yt-dlp not installed' });
        }
      });

      ytdlp.on('error', () => {
        resolve({ success: false, error: 'yt-dlp not installed' });
      });
    });
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey) {
    if (!apiKey) {
      return { valid: true, message: 'API key is optional for YouTube downloads' };
    }

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${apiKey}`
      );
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Download gallery (channel thumbnails/profile content)
   */
  async downloadGallery(url, options = {}) {
    return this.downloadChannel(url, options);
  }

  /**
   * Download profile (channel)
   */
  async downloadProfile(url, options = {}) {
    const parsed = await this.parseUrl(url);
    if (parsed.contentType === 'channel') {
      return this.downloadChannel(parsed.id, options);
    }
    return { success: false, error: 'Not a channel URL' };
  }
}

export default YoutubePlatform;
