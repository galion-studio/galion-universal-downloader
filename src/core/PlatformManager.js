/**
 * Platform Manager - Core Plugin System
 * Manages all platform modules and routes downloads to appropriate handlers
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PlatformManager {
  constructor(options = {}) {
    this.platforms = new Map();
    this.apiKeys = new Map();
    this.downloadQueue = [];
    this.activeDownloads = 0;
    this.maxConcurrent = 5;
    this.downloadDir = options.downloadDir || null;
  }

  /**
   * Set default download directory
   */
  setDownloadDir(dir) {
    this.downloadDir = dir;
  }

  /**
   * Register a platform module
   */
  registerPlatform(platformId, platformModule) {
    this.platforms.set(platformId, platformModule);
    console.log(`✓ Registered platform: ${platformId}`);
  }

  /**
   * Set API key for a platform
   */
  setApiKey(platformId, apiKey) {
    this.apiKeys.set(platformId, apiKey);
    const platform = this.platforms.get(platformId);
    if (platform && platform.setApiKey) {
      platform.setApiKey(apiKey);
    }
  }

  /**
   * Get API key for a platform
   */
  getApiKey(platformId) {
    return this.apiKeys.get(platformId);
  }

  /**
   * Detect platform from URL
   */
  detectPlatform(url) {
    const urlLower = url.toLowerCase();
    
    // Platform detection patterns
    const patterns = {
      civitai: [/civitai\.com/],
      github: [/github\.com/, /raw\.githubusercontent\.com/, /gist\.github\.com/],
      instagram: [/instagram\.com/, /instagr\.am/],
      facebook: [/facebook\.com/, /fb\.com/, /fb\.watch/],
      telegram: [/t\.me/, /telegram\.org/, /telegram\.me/],
      whatsapp: [/whatsapp\.com/, /wa\.me/],
      youtube: [/youtube\.com/, /youtu\.be/],
      twitter: [/twitter\.com/, /x\.com/],
      tiktok: [/tiktok\.com/],
      huggingface: [/huggingface\.co/, /hf\.co/],
      reddit: [/reddit\.com/, /redd\.it/],
      pinterest: [/pinterest\.com/, /pin\.it/],
      discord: [/discord\.com/, /discord\.gg/],
      dropbox: [/dropbox\.com/],
      gdrive: [/drive\.google\.com/, /docs\.google\.com/],
      mega: [/mega\.nz/, /mega\.co\.nz/],
      onedrive: [/onedrive\.live\.com/, /1drv\.ms/],
      email: [/^mailto:/, /@.*\.(com|org|net|io)/],
      generic: [/.*/] // Fallback for any URL
    };

    for (const [platformId, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(urlLower)) {
          return platformId;
        }
      }
    }

    return 'generic';
  }

  /**
   * Detect content type from URL
   */
  detectContentType(url) {
    const urlLower = url.toLowerCase();
    
    // File extensions
    if (/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg|ico)(\?|$)/i.test(url)) return 'image';
    if (/\.(mp4|webm|mkv|avi|mov|wmv|flv|m4v)(\?|$)/i.test(url)) return 'video';
    if (/\.(mp3|wav|flac|aac|ogg|m4a|wma)(\?|$)/i.test(url)) return 'audio';
    if (/\.(safetensors|ckpt|pt|pth|bin|onnx)(\?|$)/i.test(url)) return 'model';
    if (/\.(zip|rar|7z|tar|gz|bz2)(\?|$)/i.test(url)) return 'archive';
    if (/\.(pdf|doc|docx|txt|md|rtf)(\?|$)/i.test(url)) return 'document';
    
    // URL patterns
    if (/\/models?\//i.test(url)) return 'model';
    if (/\/images?\//i.test(url)) return 'image';
    if (/\/videos?\//i.test(url)) return 'video';
    if (/\/gallery/i.test(url)) return 'gallery';
    if (/\/(user|profile|@)/i.test(url)) return 'profile';
    if (/\/articles?\//i.test(url)) return 'article';
    if (/\/(posts?|status)/i.test(url)) return 'post';
    if (/\/(repo|repository)/i.test(url)) return 'repository';
    if (/\/gist\//i.test(url)) return 'gist';
    
    return 'unknown';
  }

  /**
   * Parse URL and get download info
   */
  async parseUrl(url) {
    const platformId = this.detectPlatform(url);
    const contentType = this.detectContentType(url);
    const platform = this.platforms.get(platformId);
    
    if (!platform) {
      return {
        platformId: 'generic',
        contentType,
        url,
        supported: false,
        error: `Platform ${platformId} not loaded`
      };
    }

    try {
      const parsed = await platform.parseUrl(url);
      return {
        platformId,
        contentType: parsed.contentType || contentType,
        url,
        supported: true,
        ...parsed
      };
    } catch (error) {
      return {
        platformId,
        contentType,
        url,
        supported: true,
        error: error.message
      };
    }
  }

  /**
   * Download content from URL
   */
  async download(url, options = {}) {
    const platformId = this.detectPlatform(url);
    const platform = this.platforms.get(platformId);

    // Always include downloadDir in options
    const downloadOptions = {
      ...options,
      downloadDir: options.downloadDir || this.downloadDir
    };

    if (!platform) {
      // Try generic platform
      const genericPlatform = this.platforms.get('generic');
      if (genericPlatform) {
        return genericPlatform.download(url, downloadOptions);
      }
      throw new Error(`No handler for platform: ${platformId}`);
    }

    // Set API key if available
    const apiKey = this.apiKeys.get(platformId);
    if (apiKey && platform.setApiKey) {
      platform.setApiKey(apiKey);
    }

    return platform.download(url, downloadOptions);
  }

  /**
   * Download from profile (all content from a user)
   */
  async downloadProfile(url, options = {}) {
    const platformId = this.detectPlatform(url);
    const platform = this.platforms.get(platformId);

    if (!platform || !platform.downloadProfile) {
      throw new Error(`Profile download not supported for: ${platformId}`);
    }

    return platform.downloadProfile(url, options);
  }

  /**
   * Download entire gallery/collection
   */
  async downloadGallery(url, options = {}) {
    const platformId = this.detectPlatform(url);
    const platform = this.platforms.get(platformId);

    if (!platform || !platform.downloadGallery) {
      throw new Error(`Gallery download not supported for: ${platformId}`);
    }

    return platform.downloadGallery(url, options);
  }

  /**
   * Get all registered platforms
   */
  getRegisteredPlatforms() {
    const platforms = [];
    for (const [id, platform] of this.platforms.entries()) {
      platforms.push({
        id,
        name: platform.name || id,
        description: platform.description || '',
        supportedTypes: platform.supportedTypes || [],
        requiresAuth: platform.requiresAuth || false,
        hasApiKey: this.apiKeys.has(id)
      });
    }
    return platforms;
  }

  /**
   * Validate API key for platform
   */
  async validateApiKey(platformId, apiKey) {
    const platform = this.platforms.get(platformId);
    if (!platform || !platform.validateApiKey) {
      return { valid: false, error: 'Platform does not support API key validation' };
    }
    return platform.validateApiKey(apiKey);
  }

  /**
   * Add to download queue
   */
  addToQueue(downloadTask) {
    this.downloadQueue.push({
      id: `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      ...downloadTask
    });
    return this.downloadQueue[this.downloadQueue.length - 1].id;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      pending: this.downloadQueue.filter(d => d.status === 'pending').length,
      active: this.downloadQueue.filter(d => d.status === 'downloading').length,
      completed: this.downloadQueue.filter(d => d.status === 'completed').length,
      failed: this.downloadQueue.filter(d => d.status === 'failed').length,
      queue: this.downloadQueue
    };
  }
}

export default PlatformManager;
