import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { loadCookies, saveCookies, sleep } from './utils.js';

const COOKIES_FILE = path.join(process.cwd(), 'cookies.json');

export class CivitaiScraper {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.headless = options.headless !== false;
    this.timeout = options.timeout || 60000;
    this.apiKey = options.apiKey || null;
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Initialize browser with optional cookies
   */
  async init() {
    this.browser = await puppeteer.launch({
      headless: this.headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport and user agent
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Load existing cookies if available
    const cookies = await loadCookies(COOKIES_FILE);
    if (cookies && cookies.length > 0) {
      await this.page.setCookie(...cookies);
      console.log('✓ Loaded saved cookies');
    }

    return this;
  }

  /**
   * Interactive login - opens browser for user to log in
   */
  async interactiveLogin() {
    console.log('\n🔐 Opening browser for login...');
    console.log('Please log in to Civitai in the browser window.');
    console.log('Press Enter in the terminal when you are logged in.\n');

    // Launch visible browser
    if (this.browser) {
      await this.browser.close();
    }

    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to login page
    await this.page.goto('https://civitai.com/login', {
      waitUntil: 'networkidle2',
      timeout: this.timeout
    });

    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // Save cookies after login
    const cookies = await this.page.cookies();
    await saveCookies(cookies, COOKIES_FILE);
    console.log('✓ Cookies saved successfully!');

    // Close visible browser and reopen headless
    await this.browser.close();
    await this.init();
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn() {
    try {
      await this.page.goto('https://civitai.com', {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });
      
      // Check for user menu or login button
      const loginButton = await this.page.$('a[href*="login"]');
      return !loginButton;
    } catch (error) {
      return false;
    }
  }

  /**
   * Scrape article page
   */
  async scrapeArticle(url) {
    console.log(`\n📄 Fetching article: ${url}`);

    // If API key is set, add it to the URL for authentication
    let targetUrl = url;
    if (this.apiKey) {
      const separator = url.includes('?') ? '&' : '?';
      targetUrl = `${url}${separator}token=${this.apiKey}`;
      console.log('✓ Using API key for authentication');
    }

    await this.page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: this.timeout
    });

    // Wait a bit for dynamic content to load
    await sleep(2000);

    // Check if content is blocked (NSFW wall) and try to click through it
    const nsfwWall = await this.page.$('text/Sensitive Content');
    const nsfwButton = await this.page.$('button:has-text("Show"), button:has-text("Continue"), button:has-text("I understand")');
    
    if (nsfwWall || nsfwButton) {
      console.log('\n⚠️  Detected NSFW content gate');
      
      // Try to click the button to proceed
      if (nsfwButton) {
        console.log('  Attempting to click through...');
        await nsfwButton.click();
        await sleep(2000);
      }
      
      // Try other common button selectors
      const buttons = await this.page.$$('button');
      for (const btn of buttons) {
        const text = await btn.evaluate(el => el.textContent.toLowerCase());
        if (text.includes('show') || text.includes('continue') || text.includes('understand') || text.includes('view')) {
          await btn.click();
          await sleep(1500);
          break;
        }
      }
      
      // If still blocked and no API key, throw error
      const stillBlocked = await this.page.$('text/Sensitive Content');
      if (stillBlocked && !this.apiKey) {
        console.log('You need to provide an API key or log in first.');
        throw new Error('Authentication required for NSFW content. Please provide an API key in the web interface.');
      }
    }

    // Wait for article content to load
    await this.page.waitForSelector('article, [class*="article"], [class*="Article"], main', {
      timeout: this.timeout
    }).catch(() => {});

    // Extract article data
    const articleData = await this.page.evaluate(() => {
      const data = {
        title: '',
        author: '',
        publishDate: '',
        content: '',
        contentHtml: '',
        images: [],
        tags: [],
        url: window.location.href
      };

      // Get title
      const titleEl = document.querySelector('h1, [class*="title"]');
      if (titleEl) {
        data.title = titleEl.textContent.trim();
      }

      // Get author
      const authorEl = document.querySelector('[class*="author"], [class*="user"] a, [class*="creator"]');
      if (authorEl) {
        data.author = authorEl.textContent.trim();
      }

      // Get publish date
      const dateEl = document.querySelector('time, [class*="date"], [class*="Date"]');
      if (dateEl) {
        data.publishDate = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
      }

      // Get article content - try multiple selectors
      const contentSelectors = [
        'article',
        '[class*="articleBody"]',
        '[class*="article-content"]',
        '[class*="ArticleContent"]',
        '[class*="content"]',
        'main [class*="prose"]',
        '.prose',
        'main'
      ];

      for (const selector of contentSelectors) {
        const contentEl = document.querySelector(selector);
        if (contentEl && contentEl.textContent.length > 100) {
          data.contentHtml = contentEl.innerHTML;
          data.content = contentEl.textContent.trim();
          break;
        }
      }

      // Get all images - HIGH QUALITY only
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('srcset')?.split(' ')[0];
        if (src && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon') && !src.includes('emoji') && !src.includes('badge')) {
          // Get ORIGINAL/HIGHEST resolution version
          let highResSrc = src;
          
          // Handle Civitai CDN URLs - request ORIGINAL quality
          if (src.includes('image.civitai.com')) {
            // Remove width restriction entirely for original quality, or use max quality
            highResSrc = src.replace(/\/width=\d+/, '/original=true');
            // Also try to get without any transforms
            if (!highResSrc.includes('original=true')) {
              highResSrc = src.replace(/\/width=\d+/, '');
            }
          }
          
          // Skip tiny images (likely icons/thumbnails)
          const width = img.naturalWidth || img.width || 0;
          const height = img.naturalHeight || img.height || 0;
          if (width < 100 && height < 100 && width !== 0) {
            return;
          }
          
          data.images.push({
            src: highResSrc,
            alt: img.alt || '',
            width: width,
            height: height
          });
        }
      });

      // Get tags
      const tagEls = document.querySelectorAll('[class*="tag"], [class*="Tag"], a[href*="/tag/"]');
      tagEls.forEach(tag => {
        const tagText = tag.textContent.trim();
        if (tagText && tagText.length < 50) {
          data.tags.push(tagText);
        }
      });

      return data;
    });

    // Also try to get images from background styles and srcset
    const additionalImages = await this.page.evaluate(() => {
      const imgs = [];
      
      // Check for srcset images
      document.querySelectorAll('[srcset]').forEach(el => {
        const srcset = el.getAttribute('srcset');
        if (srcset) {
          const sources = srcset.split(',').map(s => s.trim().split(' ')[0]);
          const highestRes = sources[sources.length - 1];
          if (highestRes && !imgs.includes(highestRes)) {
            imgs.push(highestRes);
          }
        }
      });

      // Check for data-src images
      document.querySelectorAll('[data-src]').forEach(el => {
        const src = el.getAttribute('data-src');
        if (src && !imgs.includes(src)) {
          imgs.push(src);
        }
      });

      return imgs;
    });

    // Merge additional images
    additionalImages.forEach(src => {
      if (!articleData.images.find(img => img.src === src)) {
        articleData.images.push({ src, alt: '' });
      }
    });

    // Deduplicate images
    const uniqueImages = [];
    const seenUrls = new Set();
    
    for (const img of articleData.images) {
      const baseUrl = img.src.split('?')[0];
      if (!seenUrls.has(baseUrl)) {
        seenUrls.add(baseUrl);
        uniqueImages.push(img);
      }
    }
    
    articleData.images = uniqueImages;

    console.log(`✓ Found ${articleData.images.length} images`);
    
    return articleData;
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export default CivitaiScraper;
