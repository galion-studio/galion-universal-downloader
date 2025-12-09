/**
 * Galion Universal Downloader - Resumable Download Engine
 * Download with resume support via HTTP Range requests and bandwidth throttling
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')

class ResumableDownloader extends EventEmitter {
  constructor(options = {}) {
    super()
    this.downloadDir = options.downloadDir || path.join(process.cwd(), 'downloads')
    this.tempDir = options.tempDir || path.join(process.cwd(), 'downloads', '.temp')
    this.maxRetries = options.maxRetries || 5
    this.chunkSize = options.chunkSize || 1024 * 1024 // 1MB chunks
    
    // Bandwidth throttling
    this.speedLimit = options.speedLimit || null // bytes per second
    this.activeDownloads = new Map()
    
    // Resume tracking
    this.resumeData = new Map() // url -> { bytesDownloaded, totalBytes, tempPath }
  }

  /**
   * Initialize downloader
   */
  async initialize() {
    await fs.promises.mkdir(this.downloadDir, { recursive: true })
    await fs.promises.mkdir(this.tempDir, { recursive: true })
    await this.loadResumeData()
    console.log('[ResumableDownloader] Initialized')
    return this
  }

  /**
   * Download with resume support
   */
  async download(url, options = {}) {
    const downloadId = options.id || `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const filename = options.filename || this.extractFilename(url)
    const outputPath = path.join(this.downloadDir, filename)
    const tempPath = path.join(this.tempDir, `${downloadId}.part`)

    // Check for existing partial download
    let resumeFrom = 0
    let existingSize = 0

    try {
      const stats = await fs.promises.stat(tempPath)
      existingSize = stats.size
      resumeFrom = existingSize
      console.log(`[ResumableDownloader] Resuming from byte ${resumeFrom}`)
    } catch (e) {
      // No existing partial file
    }

    const download = {
      id: downloadId,
      url,
      filename,
      outputPath,
      tempPath,
      bytesDownloaded: existingSize,
      totalBytes: 0,
      speed: 0,
      eta: 0,
      progress: 0,
      status: 'starting',
      startTime: Date.now(),
      retries: 0,
      headers: options.headers || {},
      speedLimit: options.speedLimit || this.speedLimit
    }

    this.activeDownloads.set(downloadId, download)
    this.emit('start', download)

    try {
      await this.executeDownload(download, resumeFrom)
      
      // Move temp to final destination
      await fs.promises.rename(tempPath, outputPath)
      
      download.status = 'completed'
      download.outputPath = outputPath
      this.saveResumeData()
      
      this.emit('complete', download)
      return download

    } catch (error) {
      download.status = 'failed'
      download.error = error.message
      this.emit('error', { download, error })
      throw error
    } finally {
      this.activeDownloads.delete(downloadId)
    }
  }

  /**
   * Execute the actual download with range request support
   */
  async executeDownload(download, resumeFrom = 0) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(download.url)
      const protocol = urlObj.protocol === 'https:' ? https : http

      const headers = {
        'User-Agent': 'Galion-Universal-Downloader/2.0',
        ...download.headers
      }

      // Add Range header for resume
      if (resumeFrom > 0) {
        headers['Range'] = `bytes=${resumeFrom}-`
      }

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers
      }

      const req = protocol.request(options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download.url = res.headers.location
          this.executeDownload(download, resumeFrom).then(resolve).catch(reject)
          return
        }

        // Check response status
        if (res.statusCode !== 200 && res.statusCode !== 206) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
          return
        }

        // Check if server supports range requests
        const acceptRanges = res.headers['accept-ranges']
        const contentRange = res.headers['content-range']
        const supportsResume = acceptRanges === 'bytes' || contentRange

        // Calculate total size
        if (contentRange) {
          // Format: bytes 0-1023/146515
          const match = contentRange.match(/\/(\d+)/)
          if (match) {
            download.totalBytes = parseInt(match[1], 10)
          }
        } else {
          download.totalBytes = parseInt(res.headers['content-length'] || '0', 10) + resumeFrom
        }

        download.status = 'downloading'
        download.supportsResume = !!supportsResume

        // Open file for writing/appending
        const writeStream = fs.createWriteStream(download.tempPath, {
          flags: resumeFrom > 0 && supportsResume ? 'a' : 'w'
        })

        // Throttling variables
        let lastProgressTime = Date.now()
        let lastBytesDownloaded = download.bytesDownloaded
        let throttleBuffer = []
        let throttleInterval = null

        // Setup throttling if speed limit is set
        if (download.speedLimit) {
          const bytesPerInterval = download.speedLimit / 10 // 100ms intervals
          
          throttleInterval = setInterval(() => {
            if (throttleBuffer.length > 0) {
              const chunk = throttleBuffer.shift()
              writeStream.write(chunk)
              download.bytesDownloaded += chunk.length
            }
          }, 100)
        }

        res.on('data', (chunk) => {
          if (download.speedLimit) {
            throttleBuffer.push(chunk)
          } else {
            writeStream.write(chunk)
            download.bytesDownloaded += chunk.length
          }

          // Calculate progress
          const now = Date.now()
          if (now - lastProgressTime >= 500) {
            const elapsed = (now - lastProgressTime) / 1000
            const bytesDiff = download.bytesDownloaded - lastBytesDownloaded
            download.speed = Math.round(bytesDiff / elapsed)
            download.progress = download.totalBytes > 0 
              ? (download.bytesDownloaded / download.totalBytes) * 100 
              : 0
            download.eta = download.speed > 0 
              ? Math.round((download.totalBytes - download.bytesDownloaded) / download.speed)
              : 0

            this.emit('progress', {
              id: download.id,
              bytesDownloaded: download.bytesDownloaded,
              totalBytes: download.totalBytes,
              progress: Math.round(download.progress * 10) / 10,
              speed: download.speed,
              eta: download.eta
            })

            lastProgressTime = now
            lastBytesDownloaded = download.bytesDownloaded

            // Save resume data periodically
            this.resumeData.set(download.url, {
              bytesDownloaded: download.bytesDownloaded,
              totalBytes: download.totalBytes,
              tempPath: download.tempPath
            })
          }
        })

        res.on('end', () => {
          if (throttleInterval) clearInterval(throttleInterval)
          
          // Flush remaining throttle buffer
          while (throttleBuffer.length > 0) {
            const chunk = throttleBuffer.shift()
            writeStream.write(chunk)
            download.bytesDownloaded += chunk.length
          }
          
          writeStream.end()
          download.progress = 100
          this.resumeData.delete(download.url)
          resolve()
        })

        res.on('error', (err) => {
          if (throttleInterval) clearInterval(throttleInterval)
          writeStream.end()
          reject(err)
        })

        writeStream.on('error', (err) => {
          if (throttleInterval) clearInterval(throttleInterval)
          reject(err)
        })
      })

      req.on('error', async (err) => {
        // Retry on network errors
        if (download.retries < this.maxRetries) {
          download.retries++
          console.log(`[ResumableDownloader] Retry ${download.retries}/${this.maxRetries} for ${download.filename}`)
          
          // Wait before retry
          await new Promise(r => setTimeout(r, 1000 * download.retries))
          
          try {
            await this.executeDownload(download, download.bytesDownloaded)
            resolve()
          } catch (retryErr) {
            reject(retryErr)
          }
        } else {
          reject(err)
        }
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.setTimeout(30000)
      req.end()
    })
  }

  /**
   * Pause a download
   */
  pause(downloadId) {
    const download = this.activeDownloads.get(downloadId)
    if (download) {
      download.status = 'paused'
      this.saveResumeData()
      this.emit('paused', download)
    }
  }

  /**
   * Resume a paused download
   */
  async resume(downloadId) {
    const resumeInfo = [...this.resumeData.entries()]
      .find(([url, data]) => data.downloadId === downloadId)
    
    if (resumeInfo) {
      const [url, data] = resumeInfo
      return this.download(url, { id: downloadId })
    }
  }

  /**
   * Cancel a download
   */
  cancel(downloadId) {
    const download = this.activeDownloads.get(downloadId)
    if (download) {
      download.status = 'cancelled'
      
      // Delete temp file
      try {
        fs.unlinkSync(download.tempPath)
      } catch (e) {}
      
      this.resumeData.delete(download.url)
      this.activeDownloads.delete(downloadId)
      this.saveResumeData()
      this.emit('cancelled', download)
    }
  }

  /**
   * Set global speed limit (bytes/second)
   */
  setSpeedLimit(bytesPerSecond) {
    this.speedLimit = bytesPerSecond
    // Update active downloads
    for (const download of this.activeDownloads.values()) {
      download.speedLimit = bytesPerSecond
    }
  }

  /**
   * Extract filename from URL
   */
  extractFilename(url) {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = path.basename(pathname)
      return filename || `download_${Date.now()}`
    } catch (e) {
      return `download_${Date.now()}`
    }
  }

  /**
   * Load resume data from disk
   */
  async loadResumeData() {
    try {
      const resumePath = path.join(this.tempDir, 'resume.json')
      const content = await fs.promises.readFile(resumePath, 'utf8')
      const data = JSON.parse(content)
      this.resumeData = new Map(Object.entries(data))
      console.log(`[ResumableDownloader] Loaded ${this.resumeData.size} resume entries`)
    } catch (e) {
      // No resume data
    }
  }

  /**
   * Save resume data to disk
   */
  async saveResumeData() {
    try {
      const resumePath = path.join(this.tempDir, 'resume.json')
      const data = Object.fromEntries(this.resumeData)
      await fs.promises.writeFile(resumePath, JSON.stringify(data, null, 2))
    } catch (e) {
      console.error('[ResumableDownloader] Failed to save resume data:', e.message)
    }
  }

  /**
   * Get all active downloads
   */
  getActiveDownloads() {
    return [...this.activeDownloads.values()]
  }

  /**
   * Get all incomplete downloads (for resume)
   */
  getIncompleteDownloads() {
    return [...this.resumeData.entries()].map(([url, data]) => ({
      url,
      ...data
    }))
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      activeCount: this.activeDownloads.size,
      incompleteCount: this.resumeData.size,
      speedLimit: this.speedLimit,
      downloads: this.getActiveDownloads()
    }
  }
}

// Singleton instance
let downloaderInstance = null

async function getResumableDownloader(options) {
  if (!downloaderInstance) {
    downloaderInstance = new ResumableDownloader(options)
    await downloaderInstance.initialize()
  }
  return downloaderInstance
}

module.exports = {
  ResumableDownloader,
  getResumableDownloader
}
