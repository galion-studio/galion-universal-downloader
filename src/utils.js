import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sanitize filename by removing invalid characters
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 200)
    .trim();
}

/**
 * Extract article ID from Civitai URL
 */
export function extractArticleId(url) {
  const match = url.match(/articles\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract article slug from URL
 */
export function extractArticleSlug(url) {
  const match = url.match(/articles\/\d+\/([^?#]+)/);
  return match ? match[1] : null;
}

/**
 * Create download directory structure
 */
export async function createDownloadDir(articleName) {
  const baseDir = path.join(process.cwd(), 'downloads', sanitizeFilename(articleName));
  const imagesDir = path.join(baseDir, 'images');
  
  await fs.ensureDir(baseDir);
  await fs.ensureDir(imagesDir);
  
  return { baseDir, imagesDir };
}

/**
 * Get file extension from URL or content type
 */
export function getImageExtension(url, contentType = '') {
  // Try to get extension from URL
  const urlMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (urlMatch) {
    const ext = urlMatch[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) {
      return ext;
    }
  }
  
  // Try to get from content type
  const typeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif'
  };
  
  return typeMap[contentType] || 'jpg';
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load cookies from file
 */
export async function loadCookies(cookiesPath) {
  try {
    const cookiesFile = path.resolve(cookiesPath);
    if (await fs.pathExists(cookiesFile)) {
      const data = await fs.readJson(cookiesFile);
      return data;
    }
  } catch (error) {
    console.error('Error loading cookies:', error.message);
  }
  return null;
}

/**
 * Save cookies to file
 */
export async function saveCookies(cookies, cookiesPath) {
  try {
    await fs.writeJson(cookiesPath, cookies, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error saving cookies:', error.message);
    return false;
  }
}

/**
 * Convert HTML to Markdown
 */
export function htmlToMarkdown(html) {
  let md = html;
  
  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  
  // Bold and italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');
  
  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<\/?[uo]l[^>]*>/gi, '\n');
  
  // Paragraphs and breaks
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();
  
  return md;
}
