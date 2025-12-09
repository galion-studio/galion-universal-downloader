/**
 * News Platform - Download articles from any news site
 * Supports: BBC, CNN, NYT, Guardian, Reuters, AP, and any news website
 */

import { GenericPlatform } from './GenericPlatform.js';

export class NewsPlatform extends GenericPlatform {
  constructor() {
    super();
    this.id = 'news';
    this.name = 'News & Articles';
    this.patterns = [
      // Major News Sites
      /bbc\.(com|co\.uk)/i,
      /cnn\.com/i,
      /nytimes\.com/i,
      /theguardian\.com/i,
      /reuters\.com/i,
      /apnews\.com/i,
      /washingtonpost\.com/i,
      /wsj\.com/i,
      /forbes\.com/i,
      /bloomberg\.com/i,
      /huffpost\.com/i,
      /nbcnews\.com/i,
      /cbsnews\.com/i,
      /foxnews\.com/i,
      /abcnews\.go\.com/i,
      /usatoday\.com/i,
      /latimes\.com/i,
      /nypost\.com/i,
      /dailymail\.co\.uk/i,
      /thesun\.co\.uk/i,
      /mirror\.co\.uk/i,
      /independent\.co\.uk/i,
      /telegraph\.co\.uk/i,
      /express\.co\.uk/i,
      // Tech News
      /techcrunch\.com/i,
      /theverge\.com/i,
      /wired\.com/i,
      /arstechnica\.com/i,
      /engadget\.com/i,
      /gizmodo\.com/i,
      /mashable\.com/i,
      /cnet\.com/i,
      /zdnet\.com/i,
      /venturebeat\.com/i,
      // International
      /aljazeera\.com/i,
      /rt\.com/i,
      /dw\.com/i,
      /france24\.com/i,
      /euronews\.com/i,
      /scmp\.com/i,
      /japantimes\.co\.jp/i,
      /straitstimes\.com/i,
      /thehindu\.com/i,
      /timesofindia\./i,
      // Finance
      /cnbc\.com/i,
      /marketwatch\.com/i,
      /ft\.com/i,
      /economist\.com/i,
      /businessinsider\.com/i,
      // Science
      /nature\.com/i,
      /sciencemag\.org/i,
      /scientificamerican\.com/i,
      /newscientist\.com/i,
      // Generic article patterns
      /\/article\//i,
      /\/news\//i,
      /\/story\//i,
      /\/blog\//i,
      /\/post\//i,
    ];
    this.features = ['articles', 'images', 'text', 'metadata', 'archive'];
    this.requiresAuth = false;
  }

  async parseUrl(url) {
    const parsed = await super.parseUrl(url);
    return {
      ...parsed,
      platformId: 'news',
      contentType: 'article',
      features: ['full-text', 'images', 'metadata', 'pdf-export']
    };
  }

  async download(url, options = {}) {
    console.log(`📰 Downloading article from: ${url}`);
    
    try {
      // Use readability-like extraction
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      
      const html = await response.text();
      
      // Extract article data
      const article = this.extractArticle(html, url);
      
      return {
        success: true,
        platformId: 'news',
        contentType: 'article',
        ...article,
        outputDir: options.outputDir || `./downloads/news/${article.slug}`,
        downloadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('News download error:', error);
      return { success: false, error: error.message };
    }
  }

  extractArticle(html, url) {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                       html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    const title = titleMatch ? this.cleanText(titleMatch[1]) : 'Untitled Article';
    
    // Extract description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                      html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    const description = descMatch ? this.cleanText(descMatch[1]) : '';
    
    // Extract author
    const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]+)"/i) ||
                        html.match(/by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    const author = authorMatch ? this.cleanText(authorMatch[1]) : 'Unknown Author';
    
    // Extract publish date
    const dateMatch = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i) ||
                      html.match(/<time[^>]*datetime="([^"]+)"/i);
    const publishedAt = dateMatch ? dateMatch[1] : null;
    
    // Extract images
    const images = [];
    const imgMatches = html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi);
    for (const match of imgMatches) {
      if (match[1] && !match[1].includes('data:') && !match[1].includes('tracking')) {
        images.push({ url: this.resolveUrl(match[1], url) });
      }
    }
    
    // Extract main content (simplified)
    const bodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                      html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : '';
    const bodyText = this.stripHtml(bodyHtml);
    
    // Generate slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
    
    return {
      title,
      description,
      author,
      publishedAt,
      url,
      domain: new URL(url).hostname,
      slug,
      content: bodyText,
      contentHtml: bodyHtml,
      wordCount: bodyText.split(/\s+/).length,
      images: images.slice(0, 20), // Limit images
      files: [
        { name: `${slug}.txt`, type: 'text' },
        { name: `${slug}.html`, type: 'html' },
        { name: `${slug}.json`, type: 'metadata' }
      ]
    };
  }

  cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  stripHtml(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  resolveUrl(src, baseUrl) {
    try {
      return new URL(src, baseUrl).href;
    } catch {
      return src;
    }
  }
}

export default NewsPlatform;
