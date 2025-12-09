/**
 * CivitAI Platform Module
 * Enhanced support for all CivitAI content types:
 * - Models (Checkpoints, LoRAs, VAE, Embeddings, etc.)
 * - Images & Galleries
 * - Articles
 * - Profiles (all content from a user)
 * - Videos
 * - SafeTensors, CKPT, and other model files
 */

import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

const CIVITAI_API = 'https://civitai.com/api/v1';
const CIVITAI_CDN = 'https://image.civitai.com';

export class CivitaiPlatform {
  constructor(options = {}) {
    this.name = 'CivitAI';
    this.id = 'civitai';
    this.icon = '🎨';
    this.description = 'AI Art Models, LoRAs, Images, Videos, Articles, Profiles';
    this.supportedTypes = ['model', 'image', 'video', 'article', 'profile', 'gallery'];
    this.requiresAuth = false;
    
    this.apiKey = options.apiKey || null;
    this.browser = null;
    this.timeout = options.timeout || 60000;
  }

  /**
   * Set API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Get auth headers
   */
  getHeaders() {
    const headers = {
      'User-Agent': 'RunPod-Universal-Downloader/2.0',
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey) {
    try {
      const response = await axios.get(`${CIVITAI_API}/me`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return { valid: true, user: response.data };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Parse URL and determine content type
   */
  async parseUrl(url) {
    const patterns = {
      model: /civitai\.com\/models\/(\d+)/,
      modelVersion: /civitai\.com\/models\/\d+\?modelVersionId=(\d+)/,
      image: /civitai\.com\/images\/(\d+)/,
      article: /civitai\.com\/articles\/(\d+)/,
      user: /civitai\.com\/user\/([^\/\?]+)/,
      post: /civitai\.com\/posts\/(\d+)/,
      collection: /civitai\.com\/collections\/(\d+)/
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

    return {
      contentType: 'unknown',
      url: url
    };
  }

  /**
   * Main download handler
   */
  async download(url, options = {}) {
    const parsed = await this.parseUrl(url);
    
    switch (parsed.contentType) {
      case 'model':
      case 'modelVersion':
        return this.downloadModel(parsed.id, options);
      case 'image':
        return this.downloadImage(parsed.id, options);
      case 'article':
        return this.downloadArticle(parsed.id, options);
      case 'user':
        return this.downloadProfile(parsed.id, options);
      case 'post':
        return this.downloadPost(parsed.id, options);
      case 'collection':
        return this.downloadCollection(parsed.id, options);
      default:
        throw new Error(`Unknown CivitAI content type: ${parsed.contentType}`);
    }
  }

  /**
   * Download a model with all versions and files
   */
  async downloadModel(modelId, options = {}) {
    const { 
      downloadDir, 
      onProgress, 
      downloadImages = true,
      downloadAllVersions = false,
      preferredFormat = 'safetensors' // safetensors, ckpt, etc.
    } = options;

    try {
      // Get model info
      const response = await axios.get(`${CIVITAI_API}/models/${modelId}`, {
        headers: this.getHeaders()
      });
      
      const model = response.data;
      const results = {
        model: {
          id: model.id,
          name: model.name,
          type: model.type,
          creator: model.creator?.username,
          description: model.description,
          tags: model.tags,
          nsfw: model.nsfw
        },
        files: [],
        images: []
      };

      // Create download directory - use downloadDir directly (it's already the correct path)
      const modelDir = path.join(
        downloadDir || path.join(process.cwd(), 'downloads'),
        `civitai_${model.type}_${model.name.replace(/[<>:"/\\|?*]/g, '-')}`
      );
      await fs.ensureDir(modelDir);

      // Get versions to download
      const versions = downloadAllVersions 
        ? model.modelVersions 
        : [model.modelVersions[0]]; // Latest version only

      for (const version of versions) {
        if (onProgress) {
          onProgress({ status: `Processing version: ${version.name}`, version: version.name });
        }

        // Find preferred file format
        const files = version.files.sort((a, b) => {
          if (a.name.endsWith('.safetensors') && preferredFormat === 'safetensors') return -1;
          if (b.name.endsWith('.safetensors') && preferredFormat === 'safetensors') return 1;
          return b.sizeKB - a.sizeKB; // Otherwise, prefer larger (full) models
        });

        for (const file of files) {
          const downloadUrl = this.apiKey
            ? `${file.downloadUrl}?token=${this.apiKey}`
            : file.downloadUrl;

          results.files.push({
            name: file.name,
            size: file.sizeKB * 1024,
            type: file.type,
            format: file.metadata?.format,
            downloadUrl: downloadUrl,
            localPath: path.join(modelDir, file.name)
          });
        }

        // Download images
        if (downloadImages && version.images) {
          for (const img of version.images) {
            const imgUrl = img.url.replace(/\/width=\d+/, ''); // Get original quality
            results.images.push({
              id: img.id,
              url: imgUrl,
              width: img.width,
              height: img.height,
              nsfw: img.nsfw
            });
          }
        }
      }

      // Save metadata
      const metadataPath = path.join(modelDir, 'model_info.json');
      await fs.writeJson(metadataPath, results, { spaces: 2 });

      return {
        success: true,
        type: 'model',
        ...results,
        outputDir: modelDir
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download a single image in highest quality
   */
  async downloadImage(imageId, options = {}) {
    const { downloadDir, onProgress } = options;

    try {
      const response = await axios.get(`${CIVITAI_API}/images?imageId=${imageId}`, {
        headers: this.getHeaders()
      });

      const image = response.data.items?.[0];
      if (!image) throw new Error('Image not found');

      // Get original quality URL
      const url = image.url.replace(/\/width=\d+/, '');
      
      const imgDir = path.join(downloadDir || path.join(process.cwd(), 'downloads'), 'civitai_images');
      await fs.ensureDir(imgDir);

      return {
        success: true,
        type: 'image',
        image: {
          id: image.id,
          url: url,
          width: image.width,
          height: image.height,
          hash: image.hash,
          meta: image.meta,
          nsfw: image.nsfw
        },
        outputDir: imgDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download article with all content AND images (including NSFW)
   * Uses direct HTTP request + regex to extract images from page source
   */
  async downloadArticle(articleId, options = {}) {
    const { downloadDir, onProgress } = options;

    try {
      if (onProgress) onProgress({ status: 'Fetching article page...', progress: 5 });
      
      const url = `https://civitai.com/articles/${articleId}`;
      
      // Fetch the raw HTML page with headers
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://civitai.com/',
        'DNT': '1'
      };
      
      // Add API key as cookie if available
      if (this.apiKey) {
        headers['Cookie'] = `__Secure-civitai-token=${this.apiKey}; token=${this.apiKey}`;
      }

      const pageResponse = await axios.get(url, { headers, timeout: 30000 });
      const html = pageResponse.data;

      if (onProgress) onProgress({ status: 'Parsing article content...', progress: 15 });

      // Extract title
      const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/ \| Civitai$/i, '').trim() : `Article ${articleId}`;

      // Extract all CivitAI image URLs using multiple patterns
      const allImages = new Set();
      
      // Pattern 1: image.civitai.com URLs in HTML
      const imgPattern1 = /https?:\/\/image\.civitai\.com\/[^"'\s<>]+/gi;
      let match;
      while ((match = imgPattern1.exec(html)) !== null) {
        let imgUrl = match[0];
        // Skip small thumbnails, avatars, logos
        if (imgUrl.includes('avatar') || imgUrl.includes('logo') || imgUrl.includes('favicon')) continue;
        if (imgUrl.includes('/width=32') || imgUrl.includes('/width=48') || imgUrl.includes('/width=64')) continue;
        // Get high resolution
        imgUrl = imgUrl.replace(/\/width=\d+/, '/width=1920').replace(/\\/g, '');
        allImages.add(imgUrl);
      }

      // Pattern 2: Image UUIDs in the page data (tRPC data, JSON, etc.)
      const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpeg|jpg|png|webp|gif))/gi;
      while ((match = uuidPattern.exec(html)) !== null) {
        const uuid = match[1];
        const imgUrl = `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/${uuid}/width=1920/${uuid}`;
        allImages.add(imgUrl);
      }

      // Pattern 3: Extract from JSON data blocks (often contains high-res URLs)
      const jsonBlocks = html.match(/"url"\s*:\s*"([^"]+image\.civitai\.com[^"]+)"/gi);
      if (jsonBlocks) {
        for (const block of jsonBlocks) {
          const urlMatch = block.match(/"url"\s*:\s*"([^"]+)"/i);
          if (urlMatch) {
            let imgUrl = urlMatch[1].replace(/\\/g, '');
            if (!imgUrl.includes('avatar') && !imgUrl.includes('logo')) {
              imgUrl = imgUrl.replace(/\/width=\d+/, '/width=1920');
              allImages.add(imgUrl);
            }
          }
        }
      }

      // Pattern 4: Extract from srcset attributes
      const srcsetPattern = /srcset="([^"]*image\.civitai\.com[^"]*)"/gi;
      while ((match = srcsetPattern.exec(html)) !== null) {
        const srcset = match[1];
        const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
        for (const srcUrl of urls) {
          if (srcUrl.includes('image.civitai.com') && !srcUrl.includes('avatar')) {
            const highRes = srcUrl.replace(/\/width=\d+/, '/width=1920');
            allImages.add(highRes);
          }
        }
      }

      // Convert to array and deduplicate by UUID
      const seenUuids = new Set();
      const uniqueImages = [];
      for (const imgUrl of allImages) {
        const uuidMatch = imgUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        const uuid = uuidMatch ? uuidMatch[1] : imgUrl;
        if (!seenUuids.has(uuid)) {
          seenUuids.add(uuid);
          uniqueImages.push({ src: imgUrl, alt: '', width: 0, height: 0 });
        }
      }

      console.log(`Found ${uniqueImages.length} unique images from page source`);

      const articleData = {
        title,
        author: '',
        content: '',
        images: uniqueImages,
        publishDate: ''
      };

      const allImagesList = uniqueImages;

      // Create output directory
      const safeTitle = articleData.title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '-').trim() || `article_${articleId}`;
      const articleDir = path.join(
        downloadDir || path.join(process.cwd(), 'downloads'),
        `civitai_article_${articleId}_${safeTitle}`
      );
      await fs.ensureDir(articleDir);
      await fs.ensureDir(path.join(articleDir, 'images'));

      if (onProgress) onProgress({ status: `Found ${allImagesList.length} images. Downloading...`, progress: 30 });

      // Download all images
      const downloadedImages = [];
      for (let i = 0; i < allImagesList.length; i++) {
        const img = allImagesList[i];
        try {
          if (onProgress) {
            const progress = 30 + Math.floor((i / allImagesList.length) * 60);
            onProgress({ 
              status: `Downloading image ${i + 1}/${allImagesList.length}...`, 
              progress 
            });
          }

          // Get filename from URL
          let filename = `image_${i + 1}.jpg`;
          const urlPath = img.src.split('/').pop().split('?')[0];
          if (urlPath && urlPath.includes('.')) {
            filename = urlPath;
          } else {
            // Extract hash from CivitAI URL if possible
            const hashMatch = img.src.match(/\/([a-f0-9-]+)\//);
            if (hashMatch) {
              filename = `image_${i + 1}_${hashMatch[1].substring(0, 8)}.jpg`;
            }
          }

          const imagePath = path.join(articleDir, 'images', filename);
          
          // Download with headers
          const response = await axios.get(img.src, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://civitai.com/',
              'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
            },
            timeout: 30000
          });

          await fs.writeFile(imagePath, response.data);
          
          downloadedImages.push({
            ...img,
            localPath: imagePath,
            filename
          });

        } catch (imgError) {
          console.log(`Failed to download image ${i + 1}: ${imgError.message}`);
          downloadedImages.push({
            ...img,
            error: imgError.message
          });
        }
      }

      if (onProgress) onProgress({ status: 'Saving article content...', progress: 95 });

      // Save article content as markdown
      await fs.writeFile(
        path.join(articleDir, 'article.md'),
        `# ${articleData.title}\n\n**Author:** ${articleData.author}\n**Date:** ${articleData.publishDate}\n**URL:** https://civitai.com/articles/${articleId}\n**Images:** ${downloadedImages.filter(i => !i.error).length} downloaded\n\n---\n\n${articleData.content}`
      );

      // Save full metadata including downloaded images info
      await fs.writeJson(path.join(articleDir, 'metadata.json'), {
        id: articleId,
        ...articleData,
        downloadedImages,
        downloadedAt: new Date().toISOString()
      }, { spaces: 2 });

      if (onProgress) onProgress({ status: 'Complete!', progress: 100 });

      return {
        success: true,
        type: 'article',
        title: articleData.title,
        author: articleData.author,
        images: downloadedImages,
        totalImages: downloadedImages.length,
        successfulDownloads: downloadedImages.filter(i => !i.error).length,
        outputDir: articleDir
      };

    } catch (error) {
      console.error('Article download error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download entire user profile with all content
   */
  async downloadProfile(username, options = {}) {
    const { 
      downloadDir, 
      onProgress,
      downloadModels = true,
      downloadImages = true,
      downloadArticles = true,
      limit = 100
    } = options;

    const results = {
      username,
      models: [],
      images: [],
      articles: []
    };

    try {
      const profileDir = path.join(
        downloadDir || path.join(process.cwd(), 'downloads'),
        `civitai_profile_${username}`
      );
      await fs.ensureDir(profileDir);

      // Get user's models
      if (downloadModels) {
        if (onProgress) onProgress({ status: 'Fetching models...' });
        
        let cursor = null;
        do {
          const params = new URLSearchParams({
            username,
            limit: String(Math.min(limit, 100))
          });
          if (cursor) params.append('cursor', cursor);

          const response = await axios.get(`${CIVITAI_API}/models?${params}`, {
            headers: this.getHeaders()
          });

          for (const model of response.data.items) {
            results.models.push({
              id: model.id,
              name: model.name,
              type: model.type,
              url: `https://civitai.com/models/${model.id}`
            });
          }

          cursor = response.data.metadata?.nextCursor;
        } while (cursor && results.models.length < limit);
      }

      // Get user's images
      if (downloadImages) {
        if (onProgress) onProgress({ status: 'Fetching images...' });
        
        let cursor = null;
        do {
          const params = new URLSearchParams({
            username,
            limit: String(Math.min(limit, 100))
          });
          if (cursor) params.append('cursor', cursor);

          const response = await axios.get(`${CIVITAI_API}/images?${params}`, {
            headers: this.getHeaders()
          });

          for (const image of response.data.items) {
            results.images.push({
              id: image.id,
              url: image.url.replace(/\/width=\d+/, ''),
              width: image.width,
              height: image.height
            });
          }

          cursor = response.data.metadata?.nextCursor;
        } while (cursor && results.images.length < limit);
      }

      // Save profile data
      await fs.writeJson(path.join(profileDir, 'profile.json'), results, { spaces: 2 });

      return {
        success: true,
        type: 'profile',
        ...results,
        outputDir: profileDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a post with all images
   */
  async downloadPost(postId, options = {}) {
    const { downloadDir, onProgress } = options;

    try {
      const response = await axios.get(`${CIVITAI_API}/images?postId=${postId}`, {
        headers: this.getHeaders()
      });

      const images = response.data.items.map(img => ({
        id: img.id,
        url: img.url.replace(/\/width=\d+/, ''),
        width: img.width,
        height: img.height,
        meta: img.meta
      }));

      const postDir = path.join(
        downloadDir || path.join(process.cwd(), 'downloads'),
        `civitai_post_${postId}`
      );
      await fs.ensureDir(postDir);

      await fs.writeJson(path.join(postDir, 'post.json'), { postId, images }, { spaces: 2 });

      return {
        success: true,
        type: 'post',
        postId,
        images,
        outputDir: postDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a collection
   */
  async downloadCollection(collectionId, options = {}) {
    const { downloadDir, onProgress } = options;
    
    // Collection API - this requires scraping as there's no direct API
    // For now, return collection info
    return {
      success: true,
      type: 'collection',
      collectionId,
      message: 'Collection download requires browser scraping - use downloadGallery for full support'
    };
  }

  /**
   * Download gallery (all images from a page/search)
   */
  async downloadGallery(url, options = {}) {
    const { downloadDir, onProgress, limit = 100 } = options;

    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.timeout });

      // Scroll to load more images
      let previousHeight = 0;
      let images = [];
      
      while (images.length < limit) {
        // Extract current images
        const newImages = await page.evaluate(() => {
          const imgs = [];
          document.querySelectorAll('img[src*="image.civitai.com"]').forEach(img => {
            const src = img.src.replace(/\/width=\d+/, '');
            if (!imgs.find(i => i.src === src)) {
              imgs.push({ src, alt: img.alt || '' });
            }
          });
          return imgs;
        });

        images = newImages;
        
        // Scroll down
        const currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        if (currentHeight === previousHeight) break;
        previousHeight = currentHeight;
        
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(1000);
        
        if (onProgress) {
          onProgress({ status: `Found ${images.length} images...` });
        }
      }

      await page.close();

      const galleryDir = path.join(
        downloadDir || path.join(process.cwd(), 'downloads'),
        `civitai_gallery_${Date.now()}`
      );
      await fs.ensureDir(galleryDir);

      await fs.writeJson(path.join(galleryDir, 'gallery.json'), { images }, { spaces: 2 });

      return {
        success: true,
        type: 'gallery',
        images: images.slice(0, limit),
        outputDir: galleryDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Search models
   */
  async search(query, options = {}) {
    const { type, sort = 'Highest Rated', limit = 20 } = options;
    
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      sort
    });
    
    if (type) params.append('types', type);

    const response = await axios.get(`${CIVITAI_API}/models?${params}`, {
      headers: this.getHeaders()
    });

    return response.data.items.map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      creator: model.creator?.username,
      downloadCount: model.stats?.downloadCount,
      rating: model.stats?.rating,
      url: `https://civitai.com/models/${model.id}`
    }));
  }

  /**
   * Close browser if open
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default CivitaiPlatform;
