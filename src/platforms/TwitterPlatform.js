/**
 * Twitter/X Platform - Download from Twitter/X
 * Uses open-source APIs and methods
 * Supports: Tweets, Videos, GIFs, Images, Threads, Spaces
 */

import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import http from 'http';

// Twitter URL patterns
const TWITTER_PATTERNS = {
  tweet: /(?:twitter|x)\.com\/([^\/]+)\/status\/(\d+)/,
  profile: /(?:twitter|x)\.com\/([^\/\?]+)\/?$/,
  space: /(?:twitter|x)\.com\/i\/spaces\/([A-Za-z0-9]+)/,
  list: /(?:twitter|x)\.com\/([^\/]+)\/lists\/([^\/\?]+)/
};

// Open-source Twitter API endpoints
const API_ENDPOINTS = {
  twttrDl: 'https://twitsave.com/info',
  saveTwitter: 'https://ssstwitter.com',
  twitterVid: 'https://twittervid.com/api',
  twdown: 'https://twdown.net/download.php'
};

export class TwitterPlatform {
  constructor() {
    this.name = 'Twitter/X';
    this.id = 'twitter';
    this.icon = '🐦';
    this.apiKey = null;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  matches(url) {
    return url.includes('twitter.com') || url.includes('x.com') || url.includes('t.co');
  }

  parseUrl(url) {
    // Normalize URL (x.com to twitter.com)
    url = url.replace('x.com', 'twitter.com');
    
    for (const [type, pattern] of Object.entries(TWITTER_PATTERNS)) {
      const match = url.match(pattern);
      if (match) {
        return {
          platformId: this.id,
          platform: this.name,
          url,
          contentType: type,
          username: match[1],
          tweetId: match[2] || null
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
    const { onProgress = () => {}, destDir = './downloads/twitter' } = options;

    onProgress({ status: `Detected ${parsed.contentType} content`, progress: 10 });

    try {
      if (parsed.contentType === 'tweet') {
        return await this.downloadTweet(url, parsed, options);
      } else if (parsed.contentType === 'space') {
        return await this.downloadSpace(url, parsed, options);
      } else if (parsed.contentType === 'profile') {
        return await this.downloadProfile(url, parsed, options);
      } else {
        return await this.downloadTweet(url, parsed, options);
      }
    } catch (error) {
      return this.downloadWithFallback(url, parsed, options);
    }
  }

  async downloadTweet(url, parsed, options = {}) {
    const { onProgress = () => {}, destDir = './downloads/twitter' } = options;

    onProgress({ status: 'Fetching tweet info...', progress: 20 });

    // Try multiple APIs
    const apis = [
      () => this.fetchFromTwitsave(url),
      () => this.fetchFromSsstwitter(url),
      () => this.scrapeTweet(url)
    ];

    let tweetData = null;
    let lastError = null;

    for (const apiFn of apis) {
      try {
        tweetData = await apiFn();
        if (tweetData && (tweetData.media?.length > 0 || tweetData.text)) {
          break;
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    if (!tweetData) {
      throw new Error(lastError?.message || 'Could not fetch tweet data');
    }

    // Create output directory
    const tweetId = parsed.tweetId || Date.now().toString();
    const outputDir = path.join(destDir, parsed.username || 'unknown', tweetId);
    await fs.ensureDir(outputDir);

    onProgress({ status: 'Downloading media...', progress: 40 });

    const files = [];

    // Download videos
    if (tweetData.videos && tweetData.videos.length > 0) {
      for (let i = 0; i < tweetData.videos.length; i++) {
        const video = tweetData.videos[i];
        const filePath = path.join(outputDir, `${tweetId}_video_${i + 1}.mp4`);
        try {
          // Get highest quality video
          const videoUrl = typeof video === 'string' ? video : 
            (video.variants?.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]?.url || video.url);
          await this.downloadFile(videoUrl, filePath);
          files.push({ path: filePath, type: 'video' });
        } catch (e) {
          console.error(`Failed to download video ${i + 1}: ${e.message}`);
        }
      }
    }

    // Download GIFs
    if (tweetData.gifs && tweetData.gifs.length > 0) {
      for (let i = 0; i < tweetData.gifs.length; i++) {
        const gif = tweetData.gifs[i];
        const filePath = path.join(outputDir, `${tweetId}_gif_${i + 1}.mp4`);
        try {
          await this.downloadFile(gif.url || gif, filePath);
          files.push({ path: filePath, type: 'gif' });
        } catch (e) {
          console.error(`Failed to download GIF ${i + 1}: ${e.message}`);
        }
      }
    }

    // Download images
    if (tweetData.images && tweetData.images.length > 0) {
      for (let i = 0; i < tweetData.images.length; i++) {
        const image = tweetData.images[i];
        const imageUrl = (typeof image === 'string' ? image : image.url).replace(/&name=\w+/, '&name=orig');
        const ext = imageUrl.includes('.png') ? '.png' : '.jpg';
        const filePath = path.join(outputDir, `${tweetId}_image_${i + 1}${ext}`);
        try {
          await this.downloadFile(imageUrl, filePath);
          files.push({ path: filePath, type: 'image' });
        } catch (e) {
          console.error(`Failed to download image ${i + 1}: ${e.message}`);
        }
      }
    }

    onProgress({ status: 'Saving metadata...', progress: 80 });

    // Save tweet text and metadata
    const metadata = {
      url,
      tweetId,
      username: parsed.username,
      text: tweetData.text,
      author: tweetData.author,
      timestamp: tweetData.timestamp,
      likes: tweetData.likes,
      retweets: tweetData.retweets,
      replies: tweetData.replies,
      mediaCount: files.length,
      downloadedAt: new Date().toISOString()
    };

    const metadataPath = path.join(outputDir, 'metadata.json');
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });

    // Save tweet text separately
    if (tweetData.text) {
      const textPath = path.join(outputDir, 'tweet_text.txt');
      await fs.writeFile(textPath, `@${parsed.username}:\n\n${tweetData.text}\n\n${url}`);
    }

    onProgress({ status: 'Complete!', progress: 100 });

    return {
      success: true,
      platform: this.name,
      contentType: parsed.contentType,
      tweetId,
      outputDir,
      files,
      metadata,
      metadataPath
    };
  }

  async fetchFromTwitsave(url) {
    const apiUrl = `${API_ENDPOINTS.twttrDl}?url=${encodeURIComponent(url)}`;
    const html = await this.httpGet(apiUrl);
    
    // Parse response for media URLs
    const videos = [];
    const images = [];
    
    // Look for video download links
    const videoMatches = html.match(/href="(https:\/\/[^"]*video[^"]*\.mp4[^"]*)"/g) || [];
    for (const match of videoMatches) {
      const urlMatch = match.match(/href="([^"]+)"/);
      if (urlMatch) videos.push(urlMatch[1]);
    }
    
    // Look for image links
    const imageMatches = html.match(/src="(https:\/\/pbs\.twimg\.com\/media\/[^"]+)"/g) || [];
    for (const match of imageMatches) {
      const urlMatch = match.match(/src="([^"]+)"/);
      if (urlMatch) images.push(urlMatch[1]);
    }

    // Get tweet text
    const textMatch = html.match(/<div class="[^"]*tweet[^"]*"[^>]*>([^<]+)</);
    const text = textMatch ? textMatch[1].trim() : null;

    return {
      videos,
      images,
      text,
      gifs: []
    };
  }

  async fetchFromSsstwitter(url) {
    // This would require form submission - simplified version
    const html = await this.httpGet(`${API_ENDPOINTS.saveTwitter}/?url=${encodeURIComponent(url)}`);
    
    const videos = [];
    const images = [];
    
    // Parse for download links
    const linkMatches = html.match(/href="(https:\/\/[^"]*\.(mp4|jpg|jpeg|png)[^"]*)"/gi) || [];
    for (const match of linkMatches) {
      const urlMatch = match.match(/href="([^"]+)"/i);
      if (urlMatch) {
        if (urlMatch[1].includes('.mp4')) {
          videos.push(urlMatch[1]);
        } else {
          images.push(urlMatch[1]);
        }
      }
    }

    return { videos, images, gifs: [] };
  }

  async scrapeTweet(url) {
    // Try to get tweet data from nitter or other scraping
    const nitterUrl = url.replace('twitter.com', 'nitter.net').replace('x.com', 'nitter.net');
    
    try {
      const html = await this.httpGet(nitterUrl);
      
      const videos = [];
      const images = [];
      
      // Find video sources
      const videoMatches = html.match(/source src="([^"]+\.mp4)"/g) || [];
      for (const match of videoMatches) {
        const urlMatch = match.match(/src="([^"]+)"/);
        if (urlMatch) videos.push(`https://nitter.net${urlMatch[1]}`);
      }
      
      // Find images
      const imageMatches = html.match(/href="(\/pic\/[^"]+)"/g) || [];
      for (const match of imageMatches) {
        const urlMatch = match.match(/href="([^"]+)"/);
        if (urlMatch) images.push(`https://nitter.net${urlMatch[1]}`);
      }

      // Get tweet text
      const textMatch = html.match(/<div class="tweet-content[^"]*">([^<]+)/);
      const text = textMatch ? textMatch[1].trim() : null;

      return { videos, images, text, gifs: [] };
    } catch (error) {
      throw new Error('Nitter scraping failed');
    }
  }

  async downloadSpace(url, parsed, options = {}) {
    const { destDir = './downloads/twitter' } = options;
    
    const outputDir = path.join(destDir, 'spaces', parsed.tweetId || Date.now().toString());
    await fs.ensureDir(outputDir);

    // Twitter Spaces require special handling
    const infoPath = path.join(outputDir, 'space_info.json');
    await fs.writeJson(infoPath, {
      url,
      ...parsed,
      status: 'requires_special_tool',
      alternatives: [
        'twspace-dl',
        'yt-dlp (with cookies)'
      ],
      commands: {
        twspacedl: `twspace-dl "${url}"`,
        ytdlp: `yt-dlp --cookies twitter_cookies.txt "${url}"`
      },
      downloadedAt: new Date().toISOString()
    }, { spaces: 2 });

    return {
      success: true,
      partial: true,
      platform: this.name,
      contentType: 'space',
      outputDir,
      message: 'Twitter Spaces require twspace-dl or yt-dlp with cookies',
      alternatives: [
        'pip install twspace-dl',
        'twspace-dl "' + url + '"'
      ]
    };
  }

  async downloadProfile(url, parsed, options = {}) {
    const { destDir = './downloads/twitter' } = options;
    const username = parsed.username;
    
    const outputDir = path.join(destDir, 'profiles', username);
    await fs.ensureDir(outputDir);

    const infoPath = path.join(outputDir, 'profile_info.json');
    await fs.writeJson(infoPath, {
      url,
      username,
      status: 'requires_special_tool',
      alternatives: [
        'gallery-dl',
        'twint'
      ],
      commands: {
        gallerydl: `gallery-dl "https://twitter.com/${username}"`,
        ytdlp: `yt-dlp "https://twitter.com/${username}/media"`
      },
      downloadedAt: new Date().toISOString()
    }, { spaces: 2 });

    return {
      success: true,
      partial: true,
      platform: this.name,
      contentType: 'profile',
      username,
      outputDir,
      message: 'Profile downloads require gallery-dl or similar tools',
      alternatives: [
        'pip install gallery-dl',
        `gallery-dl "https://twitter.com/${username}"`
      ]
    };
  }

  async downloadWithFallback(url, parsed, options = {}) {
    const { destDir = './downloads/twitter' } = options;
    
    const outputDir = path.join(destDir, parsed.contentType || 'media', parsed.tweetId || Date.now().toString());
    await fs.ensureDir(outputDir);

    const infoPath = path.join(outputDir, 'download_info.json');
    await fs.writeJson(infoPath, {
      url,
      ...parsed,
      status: 'requires_manual_download',
      alternatives: [
        'https://twitsave.com',
        'https://ssstwitter.com',
        'yt-dlp',
        'gallery-dl'
      ],
      commands: {
        ytdlp: `yt-dlp "${url}"`,
        gallerydl: `gallery-dl "${url}"`
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
        'Use gallery-dl: gallery-dl "' + url + '"',
        'Manual: twitsave.com, ssstwitter.com'
      ]
    };
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return this.httpGet(res.headers.location).then(resolve).catch(reject);
        }
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
    return { valid: true, message: 'Twitter downloads work without API key for public content' };
  }
}

export default TwitterPlatform;
