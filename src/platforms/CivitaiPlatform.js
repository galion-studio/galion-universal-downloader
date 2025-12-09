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
   * Download article with all content
   */
  async downloadArticle(articleId, options = {}) {
    const { downloadDir, onProgress } = options;

    try {
      // Use browser for full article content
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      const url = `https://civitai.com/articles/${articleId}`;
      if (this.apiKey) {
        await page.setCookie({
          name: '__Secure-civitai-token',
          value: this.apiKey,
          domain: '.civitai.com',
          path: '/',
          secure: true
        });
      }

      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.timeout });
      
      // Extract article content
      const articleData = await page.evaluate(() => {
        const data = {
          title: document.querySelector('h1')?.textContent?.trim() || '',
          author: document.querySelector('[class*="author"], [class*="user"] a')?.textContent?.trim() || '',
          content: '',
          contentHtml: '',
          images: [],
          publishDate: document.querySelector('time')?.getAttribute('datetime') || ''
        };

        // Get content
        const contentEl = document.querySelector('article, [class*="article"], main [class*="content"]');
        if (contentEl) {
          data.contentHtml = contentEl.innerHTML;
          data.content = contentEl.textContent.trim();
        }

        // Get all images
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && !src.includes('avatar') && !src.includes('logo')) {
            const highRes = src.replace(/\/width=\d+/, '');
            data.images.push({
              src: highRes,
              alt: img.alt || ''
            });
          }
        });

        return data;
      });

      await page.close();

      // Create output directory
      const articleDir = path.join(
        downloadDir || path.join(process.cwd(), 'downloads'),
        `civitai_article_${articleId}_${articleData.title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '-')}`
      );
      await fs.ensureDir(articleDir);

      // Save article content
      await fs.writeFile(
        path.join(articleDir, 'article.md'),
        `# ${articleData.title}\n\n**Author:** ${articleData.author}\n**Date:** ${articleData.publishDate}\n\n${articleData.content}`
      );

      await fs.writeJson(path.join(articleDir, 'metadata.json'), articleData, { spaces: 2 });

      return {
        success: true,
        type: 'article',
        ...articleData,
        outputDir: articleDir
      };

    } catch (error) {
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
