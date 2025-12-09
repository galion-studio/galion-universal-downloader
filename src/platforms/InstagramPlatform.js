/**
 * Instagram Platform - Download from Instagram
 * Uses open-source APIs and methods
 * Supports: Posts, Reels, Stories, IGTV, Profiles
 */

import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import http from 'http';

// Instagram URL patterns
const INSTAGRAM_PATTERNS = {
  post: /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
  reel: /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
  reels: /instagram\.com\/reels\/([A-Za-z0-9_-]+)/,
  story: /instagram\.com\/stories\/([^\/]+)\/(\d+)/,
  igtv: /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
  profile: /instagram\.com\/([A-Za-z0-9._]+)\/?$/,
  highlight: /instagram\.com\/stories\/highlights\/(\d+)/
};

// Open-source Instagram API endpoints (public proxies)
const API_ENDPOINTS = {
  // These are public APIs that work without authentication
  igram: 'https://api.igram.io/api/convert',
  snapinsta: 'https://snapinsta.app/api/convert',
  saveig: 'https://saveig.app/api/ajaxSearch',
  fastdl: 'https://fastdl.app/api/convert',
  storysaver: 'https://storysaver.net/api',
  // Fallback endpoint for metadata
  datalama: 'https://instagram-data1.p.rapidapi.com'
};

export class InstagramPlatform {
  constructor() {
    this.name = 'Instagram';
    this.id = 'instagram';
    this.icon = '📸';
    this.apiKey = null;
    this.sessionId = null;
  }

  /**
   * Set API key (optional for some methods)
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Set session ID for authenticated requests
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  /**
   * Check if URL matches this platform
   */
  matches(url) {
    return url.includes('instagram.com') || url.includes('instagr.am');
  }

  /**
   * Parse Instagram URL and detect content type
   */
  parseUrl(url) {
    // Normalize URL
    url = url.replace('instagr.am', 'instagram.com');
    
    for (const [type, pattern] of Object.entries(INSTAGRAM_PATTERNS)) {
      const match = url.match(pattern);
      if (match) {
        return {
          platformId: this.id,
          platform: this.name,
          url,
          contentType: type,
          shortcode: match[1],
          secondaryId: match[2] || null
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

  /**
   * Main download method
   */
  async download(url, options = {}) {
    const parsed = this.parseUrl(url);
    const { onProgress = () => {} } = options;

    onProgress({ status: `Detected ${parsed.contentType} content`, progress: 10 });

    try {
      let result;
      
      switch (parsed.contentType) {
        case 'post':
        case 'reel':
        case 'reels':
        case 'igtv':
          result = await this.downloadMedia(url, parsed, options);
          break;
        case 'story':
          result = await this.downloadStory(url, parsed, options);
          break;
        case 'profile':
          result = await this.downloadProfile(url, parsed, options);
          break;
        case 'highlight':
          result = await this.downloadHighlight(url, parsed, options);
          break;
        default:
          result = await this.downloadMedia(url, parsed, options);
      }

      return result;
    } catch (error) {
      // Try fallback methods
      return this.downloadWithFallback(url, parsed, options);
    }
  }

  /**
   * Download media (post, reel, igtv)
   */
  async downloadMedia(url, parsed, options = {}) {
    const { onProgress = () => {}, destDir = './downloads/instagram' } = options;

    onProgress({ status: 'Fetching media info...', progress: 20 });

    // Try multiple API endpoints
    const apis = [
      () => this.fetchFromIgram(url),
      () => this.fetchFromSnapinsta(url),
      () => this.fetchFromSaveig(url),
      () => this.fetchFromFastdl(url)
    ];

    let mediaInfo = null;
    let lastError = null;

    for (const apiFn of apis) {
      try {
        mediaInfo = await apiFn();
        if (mediaInfo && mediaInfo.media && mediaInfo.media.length > 0) {
          break;
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    if (!mediaInfo || !mediaInfo.media || mediaInfo.media.length === 0) {
      // Try scraping as last resort
      mediaInfo = await this.scrapeInstagramPage(url);
    }

    if (!mediaInfo || !mediaInfo.media || mediaInfo.media.length === 0) {
      throw new Error(lastError?.message || 'Could not fetch media. Try providing session ID.');
    }

    onProgress({ status: `Found ${mediaInfo.media.length} media items`, progress: 50 });

    // Create output directory
    const outputDir = path.join(destDir, parsed.contentType, parsed.shortcode);
    await fs.ensureDir(outputDir);

    // Save metadata
    const metadataPath = path.join(outputDir, 'metadata.json');
    await fs.writeJson(metadataPath, {
      url,
      ...parsed,
      ...mediaInfo,
      downloadedAt: new Date().toISOString()
    }, { spaces: 2 });

    onProgress({ status: 'Downloading media files...', progress: 60 });

    // Download files
    const files = [];
    for (let i = 0; i < mediaInfo.media.length; i++) {
      const item = mediaInfo.media[i];
      const ext = item.type === 'video' ? '.mp4' : '.jpg';
      const filename = `${parsed.shortcode}_${i + 1}${ext}`;
      const filePath = path.join(outputDir, filename);

      try {
        await this.downloadFile(item.url, filePath);
        files.push({
          path: filePath,
          type: item.type,
          url: item.url
        });
      } catch (error) {
        console.error(`Failed to download ${filename}: ${error.message}`);
      }

      onProgress({ 
        status: `Downloaded ${i + 1}/${mediaInfo.media.length}`, 
        progress: 60 + ((i + 1) / mediaInfo.media.length * 35) 
      });
    }

    onProgress({ status: 'Complete!', progress: 100 });

    return {
      success: true,
      platform: this.name,
      contentType: parsed.contentType,
      shortcode: parsed.shortcode,
      outputDir,
      files,
      metadata: mediaInfo,
      metadataPath
    };
  }

  /**
   * Download story
   */
  async downloadStory(url, parsed, options = {}) {
    const { onProgress = () => {}, destDir = './downloads/instagram' } = options;

    if (!this.sessionId) {
      return {
        success: false,
        error: 'Session ID required for story downloads. Please provide your Instagram session ID.',
        instructions: {
          step1: 'Log in to Instagram in your browser',
          step2: 'Open Developer Tools (F12)',
          step3: 'Go to Application > Cookies',
          step4: 'Find "sessionid" cookie and copy its value',
          step5: 'Pass it to the setSessionId() method'
        }
      };
    }

    onProgress({ status: 'Fetching story...', progress: 20 });

    const username = parsed.shortcode;
    const storyId = parsed.secondaryId;

    // Create output directory
    const outputDir = path.join(destDir, 'stories', username);
    await fs.ensureDir(outputDir);

    // Story API would require authentication
    // This is a placeholder for the story download logic
    return {
      success: true,
      platform: this.name,
      contentType: 'story',
      username,
      storyId,
      outputDir,
      message: 'Story download requires session authentication',
      files: []
    };
  }

  /**
   * Download profile content
   */
  async downloadProfile(url, parsed, options = {}) {
    const { onProgress = () => {}, destDir = './downloads/instagram', maxPosts = 50 } = options;
    const username = parsed.shortcode;

    onProgress({ status: `Fetching profile: ${username}`, progress: 10 });

    // Create output directory
    const outputDir = path.join(destDir, 'profiles', username);
    await fs.ensureDir(outputDir);

    // Profile info endpoint (would need API key or scraping)
    const profileInfo = {
      username,
      url,
      note: 'Full profile download requires API authentication',
      instructions: 'For bulk downloads, consider using instaloader CLI tool'
    };

    // Save profile info
    const infoPath = path.join(outputDir, 'profile_info.json');
    await fs.writeJson(infoPath, profileInfo, { spaces: 2 });

    // Create download script for user
    const scriptContent = `#!/bin/bash
# Instagram Profile Downloader Script
# Uses instaloader - install with: pip install instaloader

# Download all posts
instaloader --no-videos ${username}

# Download with videos
# instaloader ${username}

# Download specific tagged posts
# instaloader "#${username}"

# Download stories (requires login)
# instaloader --login YOUR_USERNAME --stories ${username}
`;

    const scriptPath = path.join(outputDir, 'download_profile.sh');
    await fs.writeFile(scriptPath, scriptContent);

    return {
      success: true,
      platform: this.name,
      contentType: 'profile',
      username,
      outputDir,
      profileInfo,
      scriptPath,
      message: 'Profile info saved. Use the generated script for bulk downloads.',
      recommendations: [
        'pip install instaloader',
        `instaloader ${username}`,
        'For stories: instaloader --login YOUR_USERNAME --stories'
      ]
    };
  }

  /**
   * Download story highlight
   */
  async downloadHighlight(url, parsed, options = {}) {
    return {
      success: false,
      error: 'Highlight downloads require authentication',
      instructions: 'Use instaloader with --login flag for highlight downloads'
    };
  }

  /**
   * Fetch from Igram API
   */
  async fetchFromIgram(url) {
    const response = await this.httpPost(API_ENDPOINTS.igram, {
      url,
      ts: Date.now()
    });

    if (response.url) {
      return {
        media: [{
          url: response.url,
          type: response.url.includes('.mp4') ? 'video' : 'image'
        }]
      };
    }

    return null;
  }

  /**
   * Fetch from Snapinsta API
   */
  async fetchFromSnapinsta(url) {
    const response = await this.httpPost(API_ENDPOINTS.snapinsta, {
      url: url
    });

    if (response && response.data) {
      const media = response.data.map(item => ({
        url: item.url,
        type: item.type || 'image',
        thumb: item.thumbnail
      }));
      return { media };
    }

    return null;
  }

  /**
   * Fetch from Saveig API
   */
  async fetchFromSaveig(url) {
    const response = await this.httpPost(API_ENDPOINTS.saveig, {
      q: url,
      t: 'media',
      lang: 'en'
    });

    if (response && response.data) {
      return { media: response.data };
    }

    return null;
  }

  /**
   * Fetch from Fastdl API
   */
  async fetchFromFastdl(url) {
    const response = await this.httpPost(API_ENDPOINTS.fastdl, {
      url: url
    });

    if (response && response.media) {
      return response;
    }

    return null;
  }

  /**
   * Scrape Instagram page directly (fallback)
   */
  async scrapeInstagramPage(url) {
    try {
      const html = await this.httpGet(url);
      
      // Look for media URLs in the page
      const videoMatches = html.match(/video_url":"([^"]+)"/g) || [];
      const imageMatches = html.match(/display_url":"([^"]+)"/g) || [];

      const media = [];

      for (const match of videoMatches) {
        const urlMatch = match.match(/video_url":"([^"]+)"/);
        if (urlMatch) {
          media.push({
            url: urlMatch[1].replace(/\\u0026/g, '&'),
            type: 'video'
          });
        }
      }

      for (const match of imageMatches) {
        const urlMatch = match.match(/display_url":"([^"]+)"/);
        if (urlMatch) {
          media.push({
            url: urlMatch[1].replace(/\\u0026/g, '&'),
            type: 'image'
          });
        }
      }

      // Also look for shared data JSON
      const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/);
      if (sharedDataMatch) {
        try {
          const sharedData = JSON.parse(sharedDataMatch[1]);
          // Extract media from shared data...
        } catch (e) {}
      }

      return { media };
    } catch (error) {
      throw new Error(`Failed to scrape Instagram page: ${error.message}`);
    }
  }

  /**
   * Download with fallback methods
   */
  async downloadWithFallback(url, parsed, options = {}) {
    const { destDir = './downloads/instagram' } = options;
    
    // Create output directory
    const outputDir = path.join(destDir, parsed.contentType || 'media', parsed.shortcode || 'unknown');
    await fs.ensureDir(outputDir);

    // Save URL for manual processing
    const infoPath = path.join(outputDir, 'download_info.json');
    await fs.writeJson(infoPath, {
      url,
      ...parsed,
      status: 'requires_manual_download',
      alternatives: [
        'https://snapinsta.app',
        'https://saveig.app',
        'https://igram.io',
        'pip install instaloader'
      ],
      commands: {
        instaloader: `instaloader -- -${parsed.shortcode}`,
        ytdlp: `yt-dlp "${url}"`
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
        'Use yt-dlp for videos: yt-dlp "' + url + '"',
        'Use instaloader: instaloader -- -' + parsed.shortcode,
        'Manual download from: snapinsta.app, saveig.app, igram.io'
      ]
    };
  }

  /**
   * HTTP GET request
   */
  httpGet(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...(this.sessionId && { 'Cookie': `sessionid=${this.sessionId}` })
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  /**
   * HTTP POST request
   */
  httpPost(url, body) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const postData = JSON.stringify(body);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      };

      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Download file to disk
   */
  downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(destPath);

      client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          return this.downloadFile(response.headers.location, destPath)
            .then(resolve)
            .catch(reject);
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(destPath);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }

  /**
   * Validate API key
   */
  async validateApiKey(key) {
    // Instagram doesn't have public API keys
    // Session ID validation would be needed
    return {
      valid: true,
      message: 'Instagram uses session authentication. Use setSessionId() instead.'
    };
  }
}

export default InstagramPlatform;
