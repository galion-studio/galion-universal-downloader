/**
 * Reddit Platform - Download from Reddit
 * Uses open-source APIs and methods
 * Supports: Posts, Videos, Galleries, GIFs, Comments
 */

import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import http from 'http';

const REDDIT_PATTERNS = {
  post: /reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)/,
  gallery: /reddit\.com\/gallery\/([^\/\?]+)/,
  shortlink: /redd\.it\/([^\/\?]+)/,
  subreddit: /reddit\.com\/r\/([^\/\?]+)\/?$/,
  user: /reddit\.com\/user\/([^\/\?]+)/
};

export class RedditPlatform {
  constructor() {
    this.name = 'Reddit';
    this.id = 'reddit';
    this.icon = '🔴';
    this.apiKey = null;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  matches(url) {
    return url.includes('reddit.com') || url.includes('redd.it') || url.includes('i.redd.it') || url.includes('v.redd.it');
  }

  parseUrl(url) {
    for (const [type, pattern] of Object.entries(REDDIT_PATTERNS)) {
      const match = url.match(pattern);
      if (match) {
        return {
          platformId: this.id,
          platform: this.name,
          url,
          contentType: type,
          subreddit: match[1],
          postId: match[2] || match[1]
        };
      }
    }

    // Check for direct media links
    if (url.includes('i.redd.it')) {
      return { platformId: this.id, platform: this.name, url, contentType: 'image' };
    }
    if (url.includes('v.redd.it')) {
      return { platformId: this.id, platform: this.name, url, contentType: 'video' };
    }

    return { platformId: this.id, platform: this.name, url, contentType: 'unknown' };
  }

  async download(url, options = {}) {
    const parsed = this.parseUrl(url);
    const { onProgress = () => {}, destDir = './downloads/reddit' } = options;

    onProgress({ status: `Detected ${parsed.contentType} content`, progress: 10 });

    try {
      if (parsed.contentType === 'post' || parsed.contentType === 'shortlink') {
        return await this.downloadPost(url, parsed, options);
      } else if (parsed.contentType === 'gallery') {
        return await this.downloadGallery(url, parsed, options);
      } else if (parsed.contentType === 'image') {
        return await this.downloadDirectImage(url, parsed, options);
      } else if (parsed.contentType === 'video') {
        return await this.downloadDirectVideo(url, parsed, options);
      } else {
        return await this.downloadPost(url, parsed, options);
      }
    } catch (error) {
      return this.downloadWithFallback(url, parsed, options);
    }
  }

  async downloadPost(url, parsed, options = {}) {
    const { onProgress = () => {}, destDir = './downloads/reddit' } = options;

    onProgress({ status: 'Fetching post data from Reddit API...', progress: 20 });

    // Use Reddit's JSON API
    const jsonUrl = url.replace(/\/$/, '') + '.json';
    const response = await this.httpGet(jsonUrl);
    
    let data;
    try {
      data = JSON.parse(response);
    } catch (e) {
      throw new Error('Failed to parse Reddit response');
    }

    if (!data || !data[0]?.data?.children?.[0]?.data) {
      throw new Error('Invalid Reddit post data');
    }

    const postData = data[0].data.children[0].data;
    
    // Create output directory
    const postId = postData.id || parsed.postId || Date.now().toString();
    const subreddit = postData.subreddit || parsed.subreddit || 'unknown';
    const outputDir = path.join(destDir, subreddit, postId);
    await fs.ensureDir(outputDir);

    onProgress({ status: 'Downloading media...', progress: 40 });

    const files = [];

    // Handle video (v.redd.it)
    if (postData.is_video && postData.media?.reddit_video) {
      const videoUrl = postData.media.reddit_video.fallback_url;
      const hasAudio = !postData.media.reddit_video.is_gif;
      
      // Download video
      const videoPath = path.join(outputDir, `${postId}_video.mp4`);
      await this.downloadFile(videoUrl.replace('?source=fallback', ''), videoPath);
      files.push({ path: videoPath, type: 'video' });

      // Try to download audio and merge
      if (hasAudio) {
        const audioUrl = videoUrl.replace(/DASH_\d+/, 'DASH_audio').replace('?source=fallback', '');
        try {
          const audioPath = path.join(outputDir, `${postId}_audio.mp4`);
          await this.downloadFile(audioUrl, audioPath);
          files.push({ path: audioPath, type: 'audio' });
        } catch (e) {
          // Audio might not be available
        }
      }
    }

    // Handle image
    if (postData.post_hint === 'image' && postData.url) {
      const ext = postData.url.includes('.png') ? '.png' : postData.url.includes('.gif') ? '.gif' : '.jpg';
      const imagePath = path.join(outputDir, `${postId}${ext}`);
      await this.downloadFile(postData.url, imagePath);
      files.push({ path: imagePath, type: 'image' });
    }

    // Handle gallery
    if (postData.is_gallery && postData.gallery_data) {
      const mediaMetadata = postData.media_metadata || {};
      let i = 0;
      for (const item of postData.gallery_data.items) {
        const media = mediaMetadata[item.media_id];
        if (media) {
          const imageUrl = media.s?.u?.replace(/&amp;/g, '&') || media.s?.gif;
          if (imageUrl) {
            const ext = imageUrl.includes('.gif') ? '.gif' : '.jpg';
            const imagePath = path.join(outputDir, `${postId}_${++i}${ext}`);
            try {
              await this.downloadFile(imageUrl, imagePath);
              files.push({ path: imagePath, type: 'image' });
            } catch (e) {
              console.error(`Failed to download gallery image ${i}: ${e.message}`);
            }
          }
        }
      }
    }

    // Handle GIF (gifv)
    if (postData.url && postData.url.includes('.gifv')) {
      const mp4Url = postData.url.replace('.gifv', '.mp4');
      const videoPath = path.join(outputDir, `${postId}.mp4`);
      await this.downloadFile(mp4Url, videoPath);
      files.push({ path: videoPath, type: 'gif' });
    }

    // Handle external links (imgur, gfycat, etc.)
    if (postData.domain && files.length === 0) {
      if (postData.domain.includes('imgur')) {
        // Handle imgur links
        const imgurUrl = postData.url.replace(/\/gallery\//, '/a/').replace(/\/$/, '');
        const directUrl = imgurUrl.includes('.') ? imgurUrl : `${imgurUrl}.jpg`;
        const imagePath = path.join(outputDir, `${postId}.jpg`);
        try {
          await this.downloadFile(directUrl, imagePath);
          files.push({ path: imagePath, type: 'image' });
        } catch (e) {}
      }
    }

    onProgress({ status: 'Saving metadata...', progress: 80 });

    // Save metadata  
    const metadata = {
      url,
      postId,
      subreddit,
      title: postData.title,
      author: postData.author,
      score: postData.score,
      upvoteRatio: postData.upvote_ratio,
      numComments: postData.num_comments,
      created: new Date(postData.created_utc * 1000).toISOString(),
      selftext: postData.selftext,
      permalink: `https://reddit.com${postData.permalink}`,
      domain: postData.domain,
      isNsfw: postData.over_18,
      downloadedAt: new Date().toISOString()
    };

    const metadataPath = path.join(outputDir, 'metadata.json');
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });

    // Save post text if self post
    if (postData.selftext) {
      const textPath = path.join(outputDir, 'post_text.md');
      await fs.writeFile(textPath, `# ${postData.title}\n\nby u/${postData.author} in r/${subreddit}\n\n---\n\n${postData.selftext}`);
    }

    onProgress({ status: 'Complete!', progress: 100 });

    return {
      success: true,
      platform: this.name,
      contentType: parsed.contentType,
      postId,
      subreddit,
      outputDir,
      files,
      metadata,
      metadataPath
    };
  }

  async downloadGallery(url, parsed, options = {}) {
    // Redirect to post download
    const postUrl = url.replace('/gallery/', '/comments/');
    return this.downloadPost(postUrl, { ...parsed, contentType: 'post' }, options);
  }

  async downloadDirectImage(url, parsed, options = {}) {
    const { destDir = './downloads/reddit' } = options;
    
    const filename = path.basename(new URL(url).pathname);
    const outputDir = path.join(destDir, 'images');
    await fs.ensureDir(outputDir);
    
    const filePath = path.join(outputDir, filename);
    await this.downloadFile(url, filePath);

    return {
      success: true,
      platform: this.name,
      contentType: 'image',
      outputDir,
      files: [{ path: filePath, type: 'image' }]
    };
  }

  async downloadDirectVideo(url, parsed, options = {}) {
    const { destDir = './downloads/reddit' } = options;
    
    const outputDir = path.join(destDir, 'videos');
    await fs.ensureDir(outputDir);
    
    // v.redd.it URLs need DASH_xxx.mp4 format
    const videoId = url.match(/v\.redd\.it\/([^\/]+)/)?.[1] || Date.now().toString();
    const videoPath = path.join(outputDir, `${videoId}.mp4`);
    
    // Try different quality levels
    const qualities = ['DASH_1080', 'DASH_720', 'DASH_480', 'DASH_360', 'DASH_240'];
    let downloaded = false;

    for (const quality of qualities) {
      const videoUrl = `${url}/${quality}.mp4`;
      try {
        await this.downloadFile(videoUrl, videoPath);
        downloaded = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!downloaded) {
      throw new Error('Could not download video at any quality level');
    }

    return {
      success: true,
      platform: this.name,
      contentType: 'video',
      outputDir,
      files: [{ path: videoPath, type: 'video' }]
    };
  }

  async downloadWithFallback(url, parsed, options = {}) {
    const { destDir = './downloads/reddit' } = options;
    
    const outputDir = path.join(destDir, 'fallback', Date.now().toString());
    await fs.ensureDir(outputDir);

    const infoPath = path.join(outputDir, 'download_info.json');
    await fs.writeJson(infoPath, {
      url,
      ...parsed,
      status: 'requires_manual_download',
      alternatives: [
        'https://rapidsave.com',
        'https://redditsave.com',
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
        'Manual: rapidsave.com, redditsave.com'
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

      client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          return this.downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`HTTP ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(destPath); });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }

  async validateApiKey(key) {
    return { valid: true, message: 'Reddit downloads work without API key for public content' };
  }
}

export default RedditPlatform;
