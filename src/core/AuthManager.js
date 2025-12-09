/**
 * Galion Universal Downloader - Authentication & Proxy Manager
 * Handles cookie import, proxy chains, and VPN for private/paywalled content
 */

const fs = require('fs').promises
const path = require('path')

class AuthManager {
  constructor(options = {}) {
    this.cookiesDir = options.cookiesDir || path.join(process.cwd(), 'cookies')
    this.cookies = new Map() // platform -> cookies
    this.proxies = []
    this.currentProxyIndex = 0
    this.rotateProxies = options.rotateProxies || false
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ]
  }

  /**
   * Initialize AuthManager
   */
  async initialize() {
    try {
      await fs.mkdir(this.cookiesDir, { recursive: true })
      await this.loadAllCookies()
      console.log('[AuthManager] Initialized')
    } catch (error) {
      console.error('[AuthManager] Init error:', error.message)
    }
  }

  // ==================
  // COOKIE MANAGEMENT
  // ==================

  /**
   * Import cookies from Netscape format file (exported from browser)
   */
  async importCookiesFromFile(filePath, platform = 'generic') {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const cookies = this.parseNetscapeCookies(content)
      
      this.cookies.set(platform, cookies)
      
      // Save to persistent storage
      const savePath = path.join(this.cookiesDir, `${platform}.json`)
      await fs.writeFile(savePath, JSON.stringify(cookies, null, 2))
      
      console.log(`[AuthManager] Imported ${cookies.length} cookies for ${platform}`)
      return { success: true, count: cookies.length }
    } catch (error) {
      console.error('[AuthManager] Cookie import error:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Import cookies from JSON format (browser extension export)
   */
  async importCookiesFromJson(jsonData, platform = 'generic') {
    try {
      let cookies = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      
      // Normalize format
      cookies = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        expires: c.expirationDate || c.expires,
        httpOnly: c.httpOnly || false,
        secure: c.secure || false,
        sameSite: c.sameSite || 'Lax'
      }))
      
      this.cookies.set(platform, cookies)
      
      const savePath = path.join(this.cookiesDir, `${platform}.json`)
      await fs.writeFile(savePath, JSON.stringify(cookies, null, 2))
      
      console.log(`[AuthManager] Imported ${cookies.length} JSON cookies for ${platform}`)
      return { success: true, count: cookies.length }
    } catch (error) {
      console.error('[AuthManager] JSON cookie import error:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Parse Netscape cookie format
   */
  parseNetscapeCookies(content) {
    const lines = content.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    )

    return lines.map(line => {
      const parts = line.split('\t')
      if (parts.length >= 7) {
        return {
          domain: parts[0],
          includeSubdomains: parts[1] === 'TRUE',
          path: parts[2],
          secure: parts[3] === 'TRUE',
          expires: parseInt(parts[4], 10),
          name: parts[5],
          value: parts[6]
        }
      }
      return null
    }).filter(Boolean)
  }

  /**
   * Load all saved cookies
   */
  async loadAllCookies() {
    try {
      const files = await fs.readdir(this.cookiesDir)
      const jsonFiles = files.filter(f => f.endsWith('.json'))

      for (const file of jsonFiles) {
        const platform = path.basename(file, '.json')
        const content = await fs.readFile(path.join(this.cookiesDir, file), 'utf8')
        this.cookies.set(platform, JSON.parse(content))
      }

      console.log(`[AuthManager] Loaded cookies for: ${[...this.cookies.keys()].join(', ')}`)
    } catch (error) {
      // Directory might not exist yet
    }
  }

  /**
   * Get cookies for a platform
   */
  getCookies(platform) {
    return this.cookies.get(platform) || this.cookies.get('generic') || []
  }

  /**
   * Get cookies as header string
   */
  getCookieHeader(platform) {
    const cookies = this.getCookies(platform)
    return cookies.map(c => `${c.name}=${c.value}`).join('; ')
  }

  /**
   * Export cookies to yt-dlp format file
   */
  async exportForYtDlp(platform) {
    const cookies = this.getCookies(platform)
    if (!cookies.length) return null

    const netscapeContent = [
      '# Netscape HTTP Cookie File',
      '# https://curl.haxx.se/rfc/cookie_spec.html',
      ''
    ]

    for (const c of cookies) {
      const line = [
        c.domain,
        c.includeSubdomains ? 'TRUE' : 'FALSE',
        c.path || '/',
        c.secure ? 'TRUE' : 'FALSE',
        c.expires || 0,
        c.name,
        c.value
      ].join('\t')
      netscapeContent.push(line)
    }

    const exportPath = path.join(this.cookiesDir, `${platform}_ytdlp.txt`)
    await fs.writeFile(exportPath, netscapeContent.join('\n'))
    return exportPath
  }

  /**
   * Delete cookies for a platform
   */
  async deleteCookies(platform) {
    this.cookies.delete(platform)
    try {
      await fs.unlink(path.join(this.cookiesDir, `${platform}.json`))
      await fs.unlink(path.join(this.cookiesDir, `${platform}_ytdlp.txt`))
    } catch (e) {
      // Files might not exist
    }
    console.log(`[AuthManager] Deleted cookies for ${platform}`)
  }

  // ==================
  // PROXY MANAGEMENT
  // ==================

  /**
   * Add a proxy to the pool
   */
  addProxy(proxy) {
    // Format: protocol://[user:pass@]host:port
    const parsed = this.parseProxy(proxy)
    if (parsed) {
      this.proxies.push(parsed)
      console.log(`[AuthManager] Added proxy: ${parsed.host}:${parsed.port}`)
    }
  }

  /**
   * Add multiple proxies
   */
  addProxies(proxies) {
    proxies.forEach(p => this.addProxy(p))
  }

  /**
   * Parse proxy string
   */
  parseProxy(proxyStr) {
    try {
      const url = new URL(proxyStr)
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        port: parseInt(url.port, 10),
        auth: url.username ? {
          username: url.username,
          password: url.password
        } : null,
        raw: proxyStr
      }
    } catch (error) {
      console.error('[AuthManager] Invalid proxy format:', proxyStr)
      return null
    }
  }

  /**
   * Get next proxy (rotation)
   */
  getProxy() {
    if (!this.proxies.length) return null

    if (this.rotateProxies) {
      const proxy = this.proxies[this.currentProxyIndex]
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length
      return proxy
    }

    return this.proxies[0]
  }

  /**
   * Remove a proxy
   */
  removeProxy(proxyStr) {
    const index = this.proxies.findIndex(p => p.raw === proxyStr)
    if (index > -1) {
      this.proxies.splice(index, 1)
    }
  }

  /**
   * Test proxy connectivity
   */
  async testProxy(proxy) {
    const http = require('http')
    const https = require('https')

    return new Promise((resolve) => {
      const testUrl = 'https://httpbin.org/ip'
      const protocol = proxy.protocol === 'https' ? https : http

      const options = {
        hostname: 'httpbin.org',
        port: 443,
        path: '/ip',
        method: 'GET',
        timeout: 10000,
        agent: new (require('https-proxy-agent').HttpsProxyAgent)(proxy.raw)
      }

      const req = protocol.request(options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve({ success: true, ip: json.origin })
          } catch (e) {
            resolve({ success: false, error: 'Invalid response' })
          }
        })
      })

      req.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({ success: false, error: 'Timeout' })
      })

      req.end()
    })
  }

  // ==================
  // USER AGENT
  // ==================

  /**
   * Get a random user agent
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
  }

  /**
   * Add custom user agent
   */
  addUserAgent(ua) {
    this.userAgents.push(ua)
  }

  // ==================
  // REQUEST HEADERS
  // ==================

  /**
   * Get full headers for authenticated request
   */
  getAuthHeaders(platform, options = {}) {
    const headers = {
      'User-Agent': options.userAgent || this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }

    // Add cookies if available
    const cookieHeader = this.getCookieHeader(platform)
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    // Platform-specific headers
    if (platform === 'instagram') {
      headers['X-IG-App-ID'] = '936619743392459'
      headers['X-Requested-With'] = 'XMLHttpRequest'
    } else if (platform === 'tiktok') {
      headers['Referer'] = 'https://www.tiktok.com/'
    } else if (platform === 'twitter') {
      headers['Authorization'] = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
    }

    return headers
  }

  /**
   * Get status of auth for all platforms
   */
  getStatus() {
    const platforms = {}
    for (const [platform, cookies] of this.cookies) {
      platforms[platform] = {
        hasCookies: true,
        cookieCount: cookies.length,
        domains: [...new Set(cookies.map(c => c.domain))]
      }
    }

    return {
      authenticated: platforms,
      proxies: {
        count: this.proxies.length,
        rotating: this.rotateProxies,
        list: this.proxies.map(p => `${p.host}:${p.port}`)
      }
    }
  }
}

// Singleton instance
let authManagerInstance = null

function getAuthManager(options) {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager(options)
  }
  return authManagerInstance
}

module.exports = {
  AuthManager,
  getAuthManager
}
