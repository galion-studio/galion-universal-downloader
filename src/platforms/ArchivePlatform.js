/**
 * Archive Platform - Download from web archives and text archives
 * Supports: Archive.org, Wayback Machine, Pastebin, GitHub Gist, and more
 */

import { GenericPlatform } from './GenericPlatform.js';

export class ArchivePlatform extends GenericPlatform {
  constructor() {
    super();
    this.id = 'archive';
    this.name = 'Web Archives & Text';
    this.patterns = [
      // Web Archives
      /archive\.org/i,
      /web\.archive\.org/i,
      /archive\.is/i,
      /archive\.ph/i,
      /archive\.today/i,
      /archive\.fo/i,
      /archive\.li/i,
      /archive\.md/i,
      /webcache\.googleusercontent\.com/i,
      /webcitation\.org/i,
      /perma\.cc/i,
      /cachedview\.com/i,
      /timetravel\.mementoweb\.org/i,
      // Text Hosting
      /pastebin\.com/i,
      /hastebin\.com/i,
      /paste\.ee/i,
      /dpaste\.org/i,
      /ghostbin\./i,
      /rentry\.co/i,
      /privatebin\./i,
      /paste\.mozilla\.org/i,
      /gist\.github\.com/i,
      /gitlab\.com\/snippets/i,
      // Document Archives
      /wikileaks\.org/i,
      /cryptome\.org/i,
      /scribd\.com/i,
      /issuu\.com/i,
      /slideshare\.net/i,
      /academia\.edu/i,
      /researchgate\.net/i,
      // Book/Text Archives
      /gutenberg\.org/i,
      /openlibrary\.org/i,
      /libgen\./i,
      /z-lib\./i,
      /annas-archive\.org/i,
      /textfiles\.com/i,
      /sacred-texts\.com/i,
      // Research
      /arxiv\.org/i,
      /biorxiv\.org/i,
      /medrxiv\.org/i,
      /ssrn\.com/i,
      /pubmed\./i,
      /springer\.com/i,
      /wiley\.com/i,
      /jstor\.org/i,
      /doi\.org/i,
    ];
    this.features = ['text', 'documents', 'snapshots', 'historical', 'metadata'];
    this.requiresAuth = false;
  }

  async parseUrl(url) {
    const urlLower = url.toLowerCase();
    let contentType = 'text';
    
    if (urlLower.includes('archive.org') || urlLower.includes('web.archive.org')) {
      contentType = 'wayback';
    } else if (urlLower.includes('gist.github')) {
      contentType = 'gist';
    } else if (urlLower.includes('pastebin') || urlLower.includes('paste')) {
      contentType = 'paste';
    } else if (urlLower.includes('arxiv') || urlLower.includes('doi.org')) {
      contentType = 'paper';
    } else if (urlLower.includes('gutenberg') || urlLower.includes('openlibrary')) {
      contentType = 'book';
    }
    
    return {
      platformId: 'archive',
      contentType,
      url,
      features: ['download', 'text-extract', 'metadata']
    };
  }

  async download(url, options = {}) {
    console.log(`📚 Downloading from archive: ${url}`);
    
    const urlLower = url.toLowerCase();
    
    try {
      if (urlLower.includes('web.archive.org')) {
        return await this.downloadWayback(url, options);
      } else if (urlLower.includes('gist.github.com')) {
        return await this.downloadGist(url, options);
      } else if (urlLower.includes('pastebin.com')) {
        return await this.downloadPastebin(url, options);
      } else if (urlLower.includes('archive.org') && !urlLower.includes('web.archive.org')) {
        return await this.downloadInternetArchive(url, options);
      } else {
        return await this.downloadGenericArchive(url, options);
      }
    } catch (error) {
      console.error('Archive download error:', error);
      return { success: false, error: error.message };
    }
  }

  async downloadWayback(url, options) {
    // Extract original URL from Wayback URL
    const waybackMatch = url.match(/web\.archive\.org\/web\/(\d+)\/(.+)/);
    const timestamp = waybackMatch ? waybackMatch[1] : 'latest';
    const originalUrl = waybackMatch ? waybackMatch[2] : url;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Galion Universal Downloader' }
    });
    const html = await response.text();
    
    const slug = originalUrl.replace(/https?:\/\//, '').replace(/[^\w]/g, '-').slice(0, 50);
    
    return {
      success: true,
      platformId: 'archive',
      contentType: 'wayback',
      title: `Wayback Snapshot: ${originalUrl}`,
      originalUrl,
      timestamp,
      snapshotUrl: url,
      content: html,
      files: [
        { name: `${slug}-${timestamp}.html`, type: 'html', content: html }
      ],
      outputDir: options.outputDir || `./downloads/wayback/${slug}`,
      downloadedAt: new Date().toISOString()
    };
  }

  async downloadGist(url, options) {
    // Extract gist ID
    const gistMatch = url.match(/gist\.github\.com\/([^\/]+)\/([a-f0-9]+)/i);
    if (!gistMatch) {
      return { success: false, error: 'Invalid Gist URL' };
    }
    
    const [, username, gistId] = gistMatch;
    
    // Fetch gist API
    const apiUrl = `https://api.github.com/gists/${gistId}`;
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (!response.ok) {
      return { success: false, error: 'Gist not found' };
    }
    
    const gist = await response.json();
    
    const files = Object.entries(gist.files).map(([filename, file]) => ({
      name: filename,
      type: file.language || 'text',
      size: file.size,
      content: file.content,
      rawUrl: file.raw_url
    }));
    
    return {
      success: true,
      platformId: 'archive',
      contentType: 'gist',
      title: gist.description || `Gist by ${username}`,
      author: username,
      gistId,
      files,
      outputDir: options.outputDir || `./downloads/gists/${gistId}`,
      downloadedAt: new Date().toISOString()
    };
  }

  async downloadPastebin(url, options) {
    // Extract paste ID
    const pasteMatch = url.match(/pastebin\.com\/(?:raw\/)?([a-zA-Z0-9]+)/);
    if (!pasteMatch) {
      return { success: false, error: 'Invalid Pastebin URL' };
    }
    
    const pasteId = pasteMatch[1];
    const rawUrl = `https://pastebin.com/raw/${pasteId}`;
    
    const response = await fetch(rawUrl);
    const content = await response.text();
    
    return {
      success: true,
      platformId: 'archive',
      contentType: 'paste',
      title: `Pastebin: ${pasteId}`,
      pasteId,
      content,
      files: [
        { name: `${pasteId}.txt`, type: 'text', content }
      ],
      outputDir: options.outputDir || `./downloads/pastes/${pasteId}`,
      downloadedAt: new Date().toISOString()
    };
  }

  async downloadInternetArchive(url, options) {
    // Internet Archive item page
    const itemMatch = url.match(/archive\.org\/details\/([^\/\?]+)/);
    if (!itemMatch) {
      return await this.downloadGenericArchive(url, options);
    }
    
    const itemId = itemMatch[1];
    const metadataUrl = `https://archive.org/metadata/${itemId}`;
    
    const response = await fetch(metadataUrl);
    const metadata = await response.json();
    
    const files = (metadata.files || [])
      .filter(f => !f.name.endsWith('_meta.xml') && !f.name.endsWith('_files.xml'))
      .slice(0, 50)
      .map(f => ({
        name: f.name,
        size: parseInt(f.size) || 0,
        format: f.format,
        downloadUrl: `https://archive.org/download/${itemId}/${f.name}`
      }));
    
    return {
      success: true,
      platformId: 'archive',
      contentType: 'archive-item',
      title: metadata.metadata?.title || itemId,
      description: metadata.metadata?.description,
      creator: metadata.metadata?.creator,
      date: metadata.metadata?.date,
      itemId,
      files,
      outputDir: options.outputDir || `./downloads/archive-org/${itemId}`,
      downloadedAt: new Date().toISOString()
    };
  }

  async downloadGenericArchive(url, options) {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Galion Universal Downloader' }
    });
    
    const contentType = response.headers.get('content-type') || '';
    const isText = contentType.includes('text') || contentType.includes('json');
    
    const content = isText ? await response.text() : await response.arrayBuffer();
    const filename = url.split('/').pop()?.split('?')[0] || 'download';
    
    return {
      success: true,
      platformId: 'archive',
      contentType: 'file',
      title: filename,
      url,
      files: [
        { name: filename, type: isText ? 'text' : 'binary' }
      ],
      outputDir: options.outputDir || `./downloads/archive/${filename}`,
      downloadedAt: new Date().toISOString()
    };
  }
}

export default ArchivePlatform;
