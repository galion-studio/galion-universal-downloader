/**
 * Adaptive Scraping Engine
 * Automatically switches between different scraping strategies when one fails
 * 
 * Strategies (in order of preference):
 * 1. API - Direct API calls when available
 * 2. HTML Regex - Parse raw HTML for patterns (fast, no JS needed)
 * 3. Puppeteer - Full browser rendering (slow but handles JS)
 * 4. Network Interception - Capture actual loaded resources
 * 5. JSON-LD/Microdata - Extract structured data
 */

import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

export class AdaptiveScrapingEngine {
  constructor(options = {}) {
    this.browser = null;
    this.timeout = options.timeout || 30000;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.maxRetries = options.maxRetries || 3;
    this.strategies = ['api', 'html_regex', 'puppeteer', 'network_intercept', 'structured_data'];
    
    // Track success/failure rates per domain for smart strategy selection
    this.domainStats = new Map();
  }

  /**
   * Get the best strategy order for a domain based on past performance
   */
  getBestStrategyOrder(domain) {
    const stats = this.domainStats.get(domain);
    if (!stats) return this.strategies;
    
    // Sort by success rate
    return [...this.strategies].sort((a, b) => {
      const aSuccess = stats[a]?.success || 0;
      const bSuccess = stats[b]?.success || 0;
      const aFail = stats[a]?.fail || 0;
      const bFail = stats[b]?.fail || 0;
      
      const aRate = aSuccess / (aSuccess + aFail + 1);
      const bRate = bSuccess / (bSuccess + bFail + 1);
      
      return bRate - aRate;
    });
  }

  /**
   * Record strategy result for a domain
   */
  recordResult(domain, strategy, success) {
    if (!this.domainStats.has(domain)) {
      this.domainStats.set(domain, {});
    }
    const stats = this.domainStats.get(domain);
    if (!stats[strategy]) {
      stats[strategy] = { success: 0, fail: 0 };
    }
    if (success) {
      stats[strategy].success++;
    } else {
      stats[strategy].fail++;
    }
  }

  /**
   * Main scrape method - tries strategies adaptively
   */
  async scrape(url, options = {}) {
    const {
      targetSelectors = {},  // CSS selectors for specific elements
      imagePatterns = [],    // Regex patterns for images
      videoPatterns = [],    // Regex patterns for videos
      contentType = 'all',   // 'images', 'videos', 'text', 'all'
      headers = {},
      cookies = [],
      onProgress = null,
      minImages = 1,         // Minimum images expected
      forceStrategy = null   // Force a specific strategy
    } = options;

    const domain = new URL(url).hostname;
    const strategies = forceStrategy ? [forceStrategy] : this.getBestStrategyOrder(domain);
    
    let lastError = null;
    let result = null;

    for (const strategy of strategies) {
      if (onProgress) {
        onProgress({ status: `Trying ${strategy} strategy...`, strategy });
      }

      try {
        console.log(`[AdaptiveScraper] Trying ${strategy} for ${url}`);
        
        switch (strategy) {
          case 'html_regex':
            result = await this.scrapeWithHtmlRegex(url, { headers, cookies, imagePatterns, videoPatterns });
            break;
          case 'puppeteer':
            result = await this.scrapeWithPuppeteer(url, { targetSelectors, cookies, minImages });
            break;
          case 'network_intercept':
            result = await this.scrapeWithNetworkIntercept(url, { cookies, minImages });
            break;
          case 'structured_data':
            result = await this.scrapeStructuredData(url, { headers, cookies });
            break;
          default:
            continue;
        }

        // Check if we got meaningful results
        const hasImages = result.images && result.images.length >= minImages;
        const hasVideos = result.videos && result.videos.length > 0;
        const hasContent = result.content && result.content.length > 100;

        if (hasImages || hasVideos || hasContent) {
          this.recordResult(domain, strategy, true);
          console.log(`[AdaptiveScraper] ${strategy} succeeded: ${result.images?.length || 0} images, ${result.videos?.length || 0} videos`);
          return { success: true, strategy, ...result };
        }

        console.log(`[AdaptiveScraper] ${strategy} returned insufficient data, trying next strategy`);
        this.recordResult(domain, strategy, false);
        
      } catch (error) {
        console.log(`[AdaptiveScraper] ${strategy} failed: ${error.message}`);
        this.recordResult(domain, strategy, false);
        lastError = error;
      }
    }

    // If all strategies failed, return what we have
    return {
      success: false,
      error: lastError?.message || 'All scraping strategies failed',
      partialResult: result
    };
  }

  /**
   * Strategy 1: HTML Regex Scraping (fast, no JS rendering)
   */
  async scrapeWithHtmlRegex(url, options = {}) {
    const { headers = {}, cookies = [], imagePatterns = [], videoPatterns = [] } = options;

    const requestHeaders = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': url,
      'DNT': '1',
      ...headers
    };

    if (cookies.length > 0) {
      requestHeaders['Cookie'] = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }

    const response = await axios.get(url, {
      headers: requestHeaders,
      timeout: this.timeout
    });

    const html = response.data;

    // Extract images using multiple patterns
    const images = this.extractImagesFromHtml(html, url, imagePatterns);
    
    // Extract videos
    const videos = this.extractVideosFromHtml(html, url, videoPatterns);
    
    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i) || 
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                      html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract main content
    const content = this.extractMainContent(html);

    return {
      title,
      description,
      images,
      videos,
      content,
      html
    };
  }

  /**
   * Extract images from HTML using multiple patterns
   */
  extractImagesFromHtml(html, baseUrl, customPatterns = []) {
    const images = new Set();
    const seenHashes = new Set();

    // Default image patterns
    const patterns = [
      // Standard img src
      /<img[^>]+src=["']([^"']+)["']/gi,
      // Data-src (lazy loading)
      /<img[^>]+data-src=["']([^"']+)["']/gi,
      // Srcset
      /srcset=["']([^"']+)["']/gi,
      // Background images
      /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi,
      // og:image
      /<meta[^>]+property="og:image"[^>]+content=["']([^"']+)["']/gi,
      // JSON-LD images
      /"image"\s*:\s*["']([^"']+)["']/gi,
      // Data URLs excluded, but regular URLs captured
      /https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|gif|webp|avif|svg)(?:\?[^"'\s<>]*)?/gi,
      ...customPatterns
    ];

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      
      while ((match = pattern.exec(html)) !== null) {
        let imgUrl = match[1] || match[0];
        
        // Clean up URL
        imgUrl = imgUrl.replace(/\\/g, '').replace(/&amp;/g, '&');
        
        // Handle srcset (take highest resolution)
        if (imgUrl.includes(',')) {
          const srcsetParts = imgUrl.split(',');
          const highest = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
          imgUrl = highest;
        }

        // Skip data URLs, tiny placeholders, icons
        if (imgUrl.startsWith('data:')) continue;
        if (imgUrl.includes('1x1') || imgUrl.includes('pixel')) continue;
        if (imgUrl.includes('icon') || imgUrl.includes('favicon') || imgUrl.includes('logo')) continue;
        if (imgUrl.includes('avatar') || imgUrl.includes('profile')) continue;
        if (imgUrl.length < 10) continue;

        // Make absolute URL
        if (imgUrl.startsWith('//')) {
          imgUrl = 'https:' + imgUrl;
        } else if (imgUrl.startsWith('/')) {
          const urlObj = new URL(baseUrl);
          imgUrl = urlObj.origin + imgUrl;
        } else if (!imgUrl.startsWith('http')) {
          continue; // Skip relative URLs that aren't clear
        }

        // Deduplicate by URL hash (last part)
        const urlHash = imgUrl.split('/').pop().split('?')[0];
        if (seenHashes.has(urlHash)) continue;
        seenHashes.add(urlHash);

        images.add(imgUrl);
      }
    }

    return Array.from(images).map(src => ({
      src,
      alt: '',
      width: 0,
      height: 0
    }));
  }

  /**
   * Extract videos from HTML
   */
  extractVideosFromHtml(html, baseUrl, customPatterns = []) {
    const videos = new Set();

    const patterns = [
      // Video src
      /<video[^>]+src=["']([^"']+)["']/gi,
      /<source[^>]+src=["']([^"']+)["'][^>]+type=["']video/gi,
      // og:video
      /<meta[^>]+property="og:video"[^>]+content=["']([^"']+)["']/gi,
      // Direct video URLs
      /https?:\/\/[^"'\s<>]+\.(?:mp4|webm|m3u8|mov|avi)(?:\?[^"'\s<>]*)?/gi,
      // YouTube embeds
      /(?:youtube\.com\/(?:embed|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/gi,
      // Vimeo embeds
      /vimeo\.com\/(?:video\/)?(\d+)/gi,
      ...customPatterns
    ];

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(html)) !== null) {
        let videoUrl = match[1] || match[0];
        videoUrl = videoUrl.replace(/\\/g, '').replace(/&amp;/g, '&');
        
        if (videoUrl.startsWith('//')) {
          videoUrl = 'https:' + videoUrl;
        }

        videos.add(videoUrl);
      }
    }

    return Array.from(videos).map(src => ({
      src,
      type: this.getVideoType(src),
      thumbnail: null
    }));
  }

  /**
   * Extract main text content
   */
  extractMainContent(html) {
    // Remove scripts, styles, comments
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

    // Try to find article/main content
    const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                         content.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                         content.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    if (articleMatch) {
      content = articleMatch[1];
    }

    // Strip remaining HTML tags
    content = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    return content.substring(0, 10000); // Limit content size
  }

  /**
   * Strategy 2: Full Puppeteer rendering
   */
  async scrapeWithPuppeteer(url, options = {}) {
    const { targetSelectors = {}, cookies = [], minImages = 1 } = options;

    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });
    }

    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(this.userAgent);

    // Set cookies if provided
    if (cookies.length > 0) {
      await page.setCookie(...cookies);
    }

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.timeout });

      // Scroll to load lazy content
      await this.autoScroll(page);

      // Wait for images to load
      await page.waitForTimeout(2000);

      // Extract data
      const data = await page.evaluate((selectors) => {
        const result = {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          images: [],
          videos: [],
          content: ''
        };

        // Get all images
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset.src;
          if (src && !src.startsWith('data:') && !src.includes('icon') && !src.includes('logo')) {
            if (img.width > 100 || img.naturalWidth > 100 || !img.width) {
              result.images.push({
                src,
                alt: img.alt || '',
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height
              });
            }
          }
        });

        // Get all videos
        document.querySelectorAll('video, source[type^="video"]').forEach(el => {
          const src = el.src || el.dataset.src;
          if (src) {
            result.videos.push({ src });
          }
        });

        // Get main content
        const article = document.querySelector('article, main, [role="main"]');
        if (article) {
          result.content = article.textContent.substring(0, 10000);
        }

        return result;
      }, targetSelectors);

      await page.close();
      return data;

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Strategy 3: Network interception
   */
  async scrapeWithNetworkIntercept(url, options = {}) {
    const { cookies = [], minImages = 1 } = options;

    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await this.browser.newPage();
    const capturedImages = new Set();
    const capturedVideos = new Set();

    // Set up request interception
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      request.continue();
    });

    page.on('response', async response => {
      const resUrl = response.url();
      const contentType = response.headers()['content-type'] || '';

      if (contentType.includes('image') || /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(resUrl)) {
        if (!resUrl.includes('icon') && !resUrl.includes('logo') && !resUrl.includes('avatar')) {
          capturedImages.add(resUrl);
        }
      }

      if (contentType.includes('video') || /\.(mp4|webm|m3u8)(\?|$)/i.test(resUrl)) {
        capturedVideos.add(resUrl);
      }
    });

    if (cookies.length > 0) {
      await page.setCookie(...cookies);
    }

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.timeout });
      await this.autoScroll(page);
      await page.waitForTimeout(3000);

      const title = await page.title();
      await page.close();

      return {
        title,
        images: Array.from(capturedImages).map(src => ({ src, alt: '', width: 0, height: 0 })),
        videos: Array.from(capturedVideos).map(src => ({ src, type: this.getVideoType(src) })),
        content: ''
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Strategy 4: Extract structured data (JSON-LD, microdata)
   */
  async scrapeStructuredData(url, options = {}) {
    const { headers = {}, cookies = [] } = options;

    const requestHeaders = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml',
      ...headers
    };

    if (cookies.length > 0) {
      requestHeaders['Cookie'] = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }

    const response = await axios.get(url, {
      headers: requestHeaders,
      timeout: this.timeout
    });

    const html = response.data;
    const images = [];
    const videos = [];
    let title = '';
    let description = '';

    // Extract JSON-LD
    const jsonLdMatches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<[^>]+>/g, '').trim();
          const data = JSON.parse(jsonContent);
          
          this.extractFromJsonLd(data, images, videos);
          
          if (!title && data.name) title = data.name;
          if (!title && data.headline) title = data.headline;
          if (!description && data.description) description = data.description;
          
        } catch (e) {
          // JSON parse error, skip
        }
      }
    }

    // Extract OpenGraph data
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    if (ogImage) images.push({ src: ogImage[1], alt: '' });

    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
    if (!title && ogTitle) title = ogTitle[1];

    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
    if (!description && ogDesc) description = ogDesc[1];

    return {
      title,
      description,
      images,
      videos,
      content: description
    };
  }

  /**
   * Recursively extract media from JSON-LD data
   */
  extractFromJsonLd(data, images, videos, depth = 0) {
    if (depth > 10 || !data) return;

    if (Array.isArray(data)) {
      data.forEach(item => this.extractFromJsonLd(item, images, videos, depth + 1));
      return;
    }

    if (typeof data !== 'object') return;

    // Extract image
    if (data.image) {
      const img = typeof data.image === 'string' ? data.image : 
                  (data.image.url || data.image.contentUrl);
      if (img) images.push({ src: img, alt: data.image.caption || '' });
    }

    // Extract video
    if (data.video || data.videoObject) {
      const video = data.video || data.videoObject;
      const src = typeof video === 'string' ? video :
                  (video.contentUrl || video.embedUrl);
      if (src) videos.push({ src, thumbnail: video.thumbnailUrl });
    }

    // Extract thumbnail
    if (data.thumbnailUrl) {
      images.push({ src: data.thumbnailUrl, alt: 'thumbnail' });
    }

    // Recurse into nested objects
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'object') {
        this.extractFromJsonLd(data[key], images, videos, depth + 1);
      }
    }
  }

  /**
   * Auto-scroll page to trigger lazy loading
   */
  async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.documentElement.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 200);
        
        // Max 30 seconds scrolling
        setTimeout(() => {
          clearInterval(timer);
          resolve();
        }, 30000);
      });
    });
  }

  /**
   * Determine video type from URL
   */
  getVideoType(url) {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mpd')) return 'dash';
    if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo')) return 'vimeo';
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.webm')) return 'webm';
    return 'unknown';
  }

  /**
   * Download all images to a directory
   */
  async downloadImages(images, outputDir, options = {}) {
    const { onProgress = null, headers = {} } = options;
    
    await fs.ensureDir(outputDir);
    const downloaded = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      
      if (onProgress) {
        onProgress({
          status: `Downloading image ${i + 1}/${images.length}`,
          progress: Math.floor((i / images.length) * 100)
        });
      }

      try {
        // Generate filename
        let filename = `image_${i + 1}`;
        const urlPath = img.src.split('/').pop().split('?')[0];
        if (urlPath && urlPath.includes('.')) {
          filename = urlPath;
        } else {
          const ext = this.guessImageExtension(img.src);
          filename = `image_${i + 1}.${ext}`;
        }

        const filePath = path.join(outputDir, filename);

        const response = await axios.get(img.src, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'image/*',
            ...headers
          },
          timeout: 30000
        });

        await fs.writeFile(filePath, response.data);
        downloaded.push({ ...img, localPath: filePath, filename });

      } catch (error) {
        console.log(`Failed to download image ${i + 1}: ${error.message}`);
        downloaded.push({ ...img, error: error.message });
      }
    }

    return downloaded;
  }

  /**
   * Guess image extension from URL or content-type
   */
  guessImageExtension(url) {
    if (url.includes('.png')) return 'png';
    if (url.includes('.gif')) return 'gif';
    if (url.includes('.webp')) return 'webp';
    if (url.includes('.avif')) return 'avif';
    if (url.includes('.svg')) return 'svg';
    return 'jpg';
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

export default AdaptiveScrapingEngine;
