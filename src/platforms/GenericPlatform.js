/**
 * Generic Platform Module
 * Fallback handler for any URL - direct file downloads, web scraping
 * Works with any website that serves downloadable content
 */

import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import * as cheerio from 'cheerio';

export class GenericPlatform {
  constructor(options = {}) {
    this.name = 'Generic';
    this.id = 'generic';
    this.icon = '🌐';
    this.description = 'Universal downloader for any URL - images, videos, files, web pages';
    this.supportedTypes = ['file', 'image', 'video', 'audio', 'document', 'webpage', 'gallery'];
    this.requiresAuth = false;
    
    this.browser = null;
    this.timeout = options.timeout || 60000;
  }

  /**
   * No auth needed for generic downloads
   */
  setApiKey(apiKey) {
    // No-op for generic platform
  }

  /**
   * Get headers for requests
   */
  getHeaders(custom = {}) {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      ...custom
    };
  }

  /**
   * Detect content type from URL
   */
  detectContentType(url) {
    const urlLower = url.toLowerCase();
    
    // Direct file detection
    if (/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i.test(url)) return 'image';
    if (/\.(mp4|webm|mkv|avi|mov|wmv|flv|m4v)(\?|$)/i.test(url)) return 'video';
    if (/\.(mp3|wav|flac|aac|ogg|m4a|wma)(\?|$)/i.test(url)) return 'audio';
    if (/\.(pdf|doc|docx|txt|md|rtf|xlsx|pptx)(\?|$)/i.test(url)) return 'document';
    if (/\.(zip|rar|7z|tar|gz|bz2)(\?|$)/i.test(url)) return 'archive';
    if (/\.(safetensors|ckpt|pt|pth|bin|onnx|h5)(\?|$)/i.test(url)) return 'model';
    if (/\.(exe|msi|dmg|deb|rpm|appimage)(\?|$)/i.test(url)) return 'executable';
    
    return 'webpage';
  }

  /**
   * Parse URL
   */
  async parseUrl(url) {
    const contentType = this.detectContentType(url);
    
    try {
      const urlObj = new URL(url);
      return {
        contentType,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        filename: path.basename(urlObj.pathname) || null,
        url
      };
    } catch {
      return {
        contentType: 'unknown',
        url
      };
    }
  }

  /**
   * Main download handler
   */
  async download(url, options = {}) {
    const parsed = await this.parseUrl(url);
    
    if (parsed.contentType === 'webpage') {
      return this.downloadWebpage(url, options);
    }
    
    return this.downloadFile(url, options);
  }

  /**
   * Download a direct file
   */
  async downloadFile(url, options = {}) {
    const { downloadDir, onProgress, filename: customFilename } = options;

    try {
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        timeout: this.timeout,
        headers: this.getHeaders(),
        maxRedirects: 10
      });

      const contentType = response.headers['content-type'] || '';
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      
      // Determine filename
      let filename = customFilename;
      
      if (!filename) {
        // Try content-disposition header
        const disposition = response.headers['content-disposition'];
        if (disposition) {
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match) {
            filename = match[1].replace(/['"]/g, '');
          }
        }
        
        // Fallback to URL path
        if (!filename) {
          try {
            const urlPath = new URL(url).pathname;
            filename = path.basename(urlPath);
          } catch {
            filename = 'download';
          }
        }
      }

      // Ensure extension
      if (!path.extname(filename)) {
        filename += this.getExtensionFromContentType(contentType);
      }

      // Clean filename
      filename = filename.replace(/[<>:"/\\|?*]/g, '-');

      const fileDir = path.join(downloadDir || process.cwd(), 'downloads', 'generic');
      await fs.ensureDir(fileDir);

      const filePath = path.join(fileDir, filename);

      // Track progress
      let downloadedBytes = 0;
      
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (onProgress) {
          onProgress({
            filename,
            downloaded: downloadedBytes,
            total: contentLength,
            progress: contentLength ? (downloadedBytes / contentLength) * 100 : 0
          });
        }
      });

      const writer = createWriteStream(filePath);
      await pipeline(response.data, writer);

      return {
        success: true,
        type: 'file',
        filename,
        path: filePath,
        size: downloadedBytes,
        contentType,
        outputDir: fileDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a webpage with all assets
   */
  async downloadWebpage(url, options = {}) {
    const { downloadDir, onProgress, downloadImages = true, downloadVideos = true } = options;

    try {
      // Get page HTML
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: this.timeout
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract metadata
      const title = $('title').text() || $('h1').first().text() || 'webpage';
      const description = $('meta[name="description"]').attr('content') || '';

      // Create output directory
      const safeName = title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '-');
      const pageDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `webpage_${safeName}_${Date.now()}`
      );
      await fs.ensureDir(pageDir);

      const results = {
        title,
        description,
        url,
        images: [],
        videos: [],
        links: []
      };

      // Extract all images
      if (downloadImages) {
        $('img').each((i, el) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          if (src) {
            const absoluteUrl = new URL(src, url).href;
            results.images.push({
              src: absoluteUrl,
              alt: $(el).attr('alt') || ''
            });
          }
        });

        // Also check for background images
        $('[style*="background"]').each((i, el) => {
          const style = $(el).attr('style');
          const match = style?.match(/url\(['"]?([^'")\s]+)['"]?\)/);
          if (match) {
            const absoluteUrl = new URL(match[1], url).href;
            results.images.push({ src: absoluteUrl, alt: '' });
          }
        });
      }

      // Extract videos
      if (downloadVideos) {
        $('video source, video').each((i, el) => {
          const src = $(el).attr('src');
          if (src) {
            const absoluteUrl = new URL(src, url).href;
            results.videos.push({ src: absoluteUrl });
          }
        });
      }

      // Extract links
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          try {
            const absoluteUrl = new URL(href, url).href;
            results.links.push({
              url: absoluteUrl,
              text: $(el).text().trim().substring(0, 100)
            });
          } catch {
            // Invalid URL, skip
          }
        }
      });

      // Deduplicate
      results.images = [...new Map(results.images.map(i => [i.src, i])).values()];
      results.videos = [...new Map(results.videos.map(v => [v.src, v])).values()];
      results.links = [...new Map(results.links.map(l => [l.url, l])).values()];

      // Save HTML
      await fs.writeFile(path.join(pageDir, 'page.html'), html);

      // Save metadata
      await fs.writeJson(path.join(pageDir, 'metadata.json'), results, { spaces: 2 });

      // Save as markdown
      const markdown = `# ${title}\n\n**URL:** ${url}\n\n**Description:** ${description}\n\n## Content\n\n${$('body').text().trim().substring(0, 5000)}`;
      await fs.writeFile(path.join(pageDir, 'content.md'), markdown);

      return {
        success: true,
        type: 'webpage',
        ...results,
        outputDir: pageDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download all images from a page (gallery mode)
   */
  async downloadGallery(url, options = {}) {
    const { downloadDir, onProgress, limit = 100, minWidth = 100, minHeight = 100 } = options;

    try {
      // Use browser for JavaScript-heavy sites
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.timeout });

      // Scroll to load lazy images
      let previousHeight = 0;
      let scrollCount = 0;
      const maxScrolls = 20;

      while (scrollCount < maxScrolls) {
        const currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        if (currentHeight === previousHeight) break;
        previousHeight = currentHeight;
        
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(500);
        scrollCount++;
      }

      // Extract all images
      const images = await page.evaluate((minW, minH) => {
        const imgs = [];
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset.src || img.getAttribute('data-lazy-src');
          const width = img.naturalWidth || img.width || 0;
          const height = img.naturalHeight || img.height || 0;
          
          if (src && (width >= minW || height >= minH || width === 0)) {
            if (!src.includes('data:image') && !imgs.find(i => i.src === src)) {
              imgs.push({
                src,
                alt: img.alt || '',
                width,
                height
              });
            }
          }
        });
        return imgs;
      }, minWidth, minHeight);

      await page.close();

      // Create gallery directory
      const galleryDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `gallery_${Date.now()}`
      );
      await fs.ensureDir(path.join(galleryDir, 'images'));

      const limitedImages = images.slice(0, limit);

      // Download all images
      const downloaded = [];
      for (let i = 0; i < limitedImages.length; i++) {
        const img = limitedImages[i];
        
        if (onProgress) {
          onProgress({
            status: `Downloading image ${i + 1}/${limitedImages.length}`,
            progress: ((i + 1) / limitedImages.length) * 100
          });
        }

        try {
          const imgResponse = await axios({
            method: 'GET',
            url: img.src,
            responseType: 'arraybuffer',
            headers: this.getHeaders({ Referer: url }),
            timeout: 30000
          });

          const ext = this.getExtensionFromContentType(imgResponse.headers['content-type']);
          const filename = `image_${String(i + 1).padStart(4, '0')}${ext}`;
          const imgPath = path.join(galleryDir, 'images', filename);
          
          await fs.writeFile(imgPath, imgResponse.data);
          
          downloaded.push({
            ...img,
            localPath: imgPath,
            filename
          });
        } catch (err) {
          // Skip failed images
        }
      }

      // Save gallery metadata
      await fs.writeJson(path.join(galleryDir, 'gallery.json'), {
        sourceUrl: url,
        totalFound: images.length,
        downloaded: downloaded.length,
        images: downloaded
      }, { spaces: 2 });

      return {
        success: true,
        type: 'gallery',
        totalFound: images.length,
        downloaded: downloaded.length,
        images: downloaded,
        outputDir: galleryDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download profile - scrape all content from a page
   */
  async downloadProfile(url, options = {}) {
    // For generic platform, profile download is the same as webpage
    return this.downloadWebpage(url, { ...options, downloadImages: true, downloadVideos: true });
  }

  /**
   * Get file extension from content type
   */
  getExtensionFromContentType(contentType) {
    const map = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/avif': '.avif',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'application/pdf': '.pdf',
      'application/zip': '.zip',
      'application/json': '.json',
      'text/plain': '.txt',
      'text/html': '.html',
      'application/octet-stream': '.bin'
    };

    for (const [type, ext] of Object.entries(map)) {
      if (contentType?.includes(type)) return ext;
    }
    return '.bin';
  }

  /**
   * Validate URL
   */
  async validateApiKey() {
    return { valid: true, message: 'Generic platform does not require authentication' };
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default GenericPlatform;
