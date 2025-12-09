 /**
 * Onion/Dark Web Platform - Download from .onion sites via Tor
 * Requires: Tor running locally (SOCKS5 proxy on 127.0.0.1:9050)
 * 
 * ⚠️ DISCLAIMER: This is for research and educational purposes only.
 * Users are responsible for complying with applicable laws.
 */

import { GenericPlatform } from './GenericPlatform.js';

export class OnionPlatform extends GenericPlatform {
  constructor() {
    super();
    this.id = 'onion';
    this.name = 'Onion/Tor Network';
    this.patterns = [
      /\.onion\/?/i,
      /\.onion$/i,
    ];
    this.features = ['anonymous', 'tor-network', 'text', 'files'];
    this.requiresAuth = false;
    
    // Tor SOCKS5 proxy settings
    this.torProxy = {
      host: '127.0.0.1',
      port: 9050,
      type: 'socks5'
    };
  }

  async parseUrl(url) {
    const isOnion = url.includes('.onion');
    
    return {
      platformId: 'onion',
      contentType: isOnion ? 'onion-site' : 'clearnet',
      url,
      requiresTor: isOnion,
      features: ['download', 'anonymous', 'text-extract'],
      warning: isOnion ? '⚠️ This is a .onion address. Requires Tor to access.' : null
    };
  }

  /**
   * Check if Tor is running
   */
  async checkTorConnection() {
    try {
      // Import socks-proxy-agent dynamically
      const { SocksProxyAgent } = await import('socks-proxy-agent');
      const agent = new SocksProxyAgent(`socks5h://${this.torProxy.host}:${this.torProxy.port}`);
      
      // Test connection to Tor check service
      const response = await fetch('https://check.torproject.org/api/ip', {
        agent,
        timeout: 10000
      });
      
      const data = await response.json();
      return {
        connected: data.IsTor === true,
        ip: data.IP,
        message: data.IsTor ? 'Connected to Tor network' : 'Not using Tor'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        instructions: this.getTorInstallInstructions()
      };
    }
  }

  /**
   * Get Tor installation instructions
   */
  getTorInstallInstructions() {
    return {
      windows: [
        '1. Download Tor Browser: https://www.torproject.org/download/',
        '2. Or install Tor Expert Bundle for just the proxy',
        '3. Ensure Tor is running on port 9050',
        '4. Or run: tor --SocksPort 9050'
      ],
      linux: [
        '1. sudo apt install tor',
        '2. sudo systemctl start tor',
        '3. Verify: netstat -tlnp | grep 9050'
      ],
      mac: [
        '1. brew install tor',
        '2. tor',
        '3. Or download Tor Browser from torproject.org'
      ],
      docker: [
        'docker run -d -p 9050:9050 dperson/torproxy'
      ]
    };
  }

  async download(url, options = {}) {
    console.log(`🧅 Downloading from Onion network: ${url}`);
    
    if (!url.includes('.onion')) {
      console.log('Not an onion address, using clearnet...');
      return await this.downloadClearnet(url, options);
    }
    
    try {
      // Check Tor connection first
      const torStatus = await this.checkTorConnection();
      if (!torStatus.connected) {
        return {
          success: false,
          error: 'Tor not running. Please start Tor first.',
          instructions: torStatus.instructions
        };
      }
      
      // Download via Tor
      return await this.downloadViaTor(url, options);
    } catch (error) {
      console.error('Onion download error:', error);
      return { 
        success: false, 
        error: error.message,
        hint: 'Make sure Tor is running on port 9050'
      };
    }
  }

  async downloadViaTor(url, options) {
    try {
      const { SocksProxyAgent } = await import('socks-proxy-agent');
      const agent = new SocksProxyAgent(`socks5h://${this.torProxy.host}:${this.torProxy.port}`);
      
      const response = await fetch(url, {
        agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 60000 // Onion sites can be slow
      });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const contentType = response.headers.get('content-type') || '';
      const isHtml = contentType.includes('text/html');
      const isText = contentType.includes('text') || contentType.includes('json');
      
      let content, files = [];
      const slug = this.generateSlug(url);
      
      if (isHtml) {
        content = await response.text();
        const extracted = this.extractContent(content, url);
        files = [
          { name: `${slug}.html`, type: 'html', content },
          { name: `${slug}.txt`, type: 'text', content: extracted.text }
        ];
        
        return {
          success: true,
          platformId: 'onion',
          contentType: 'webpage',
          title: extracted.title,
          url,
          text: extracted.text,
          links: extracted.links,
          files,
          usedTor: true,
          outputDir: options.outputDir || `./downloads/onion/${slug}`,
          downloadedAt: new Date().toISOString()
        };
      } else if (isText) {
        content = await response.text();
        files = [{ name: `${slug}.txt`, type: 'text', content }];
      } else {
        // Binary file
        const buffer = await response.arrayBuffer();
        const filename = url.split('/').pop() || `${slug}.bin`;
        files = [{ name: filename, type: 'binary', size: buffer.byteLength }];
        
        return {
          success: true,
          platformId: 'onion',
          contentType: 'file',
          title: filename,
          url,
          files,
          usedTor: true,
          outputDir: options.outputDir || `./downloads/onion/${slug}`,
          downloadedAt: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        platformId: 'onion',
        contentType: 'text',
        url,
        files,
        usedTor: true,
        outputDir: options.outputDir || `./downloads/onion/${slug}`,
        downloadedAt: new Date().toISOString()
      };
    } catch (error) {
      // If socks-proxy-agent not installed, provide instructions
      if (error.code === 'MODULE_NOT_FOUND') {
        return {
          success: false,
          error: 'socks-proxy-agent not installed',
          fix: 'npm install socks-proxy-agent',
          instructions: this.getTorInstallInstructions()
        };
      }
      throw error;
    }
  }

  async downloadClearnet(url, options) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const extracted = this.extractContent(html, url);
    const slug = this.generateSlug(url);
    
    return {
      success: true,
      platformId: 'onion',
      contentType: 'clearnet',
      title: extracted.title,
      url,
      text: extracted.text,
      files: [
        { name: `${slug}.html`, type: 'html' },
        { name: `${slug}.txt`, type: 'text' }
      ],
      usedTor: false,
      outputDir: options.outputDir || `./downloads/onion/${slug}`,
      downloadedAt: new Date().toISOString()
    };
  }

  extractContent(html, url) {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    // Extract text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract links
    const links = [];
    const linkMatches = html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>/gi);
    for (const match of linkMatches) {
      const href = match[1];
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const resolved = new URL(href, url).href;
          links.push(resolved);
        } catch {
          links.push(href);
        }
      }
    }
    
    return { title, text, links: [...new Set(links)] };
  }

  generateSlug(url) {
    return url
      .replace(/https?:\/\//, '')
      .replace(/\.onion/, '')
      .replace(/[^\w]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'onion-page';
  }

  /**
   * Known onion services directory (for reference/search)
   */
  getKnownServices() {
    return {
      search: [
        { name: 'Ahmia', description: 'Tor search engine', type: 'search' },
        { name: 'Torch', description: 'Oldest Tor search engine', type: 'search' },
        { name: 'Haystak', description: 'Dark web search', type: 'search' }
      ],
      news: [
        { name: 'ProPublica', description: 'Investigative journalism', type: 'news' },
        { name: 'BBC Tor', description: 'BBC News onion mirror', type: 'news' },
        { name: 'NYT Onion', description: 'New York Times onion', type: 'news' }
      ],
      whistleblowing: [
        { name: 'SecureDrop', description: 'Whistleblower platform', type: 'whistleblowing' }
      ],
      communication: [
        { name: 'OnionShare', description: 'Secure file sharing', type: 'filesharing' },
        { name: 'Proton Mail', description: 'Encrypted email', type: 'email' }
      ],
      note: 'Actual .onion addresses change frequently. Use trusted directories.'
    };
  }
}

export default OnionPlatform;
