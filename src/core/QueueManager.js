/**
 * Galion Universal Downloader - Queue Manager
 * Handles batch downloads, multi-threaded processing, and queue management
 */

const EventEmitter = require('events')
const path = require('path')
const fs = require('fs').promises

class DownloadItem {
  constructor({ url, options = {} }) {
    this.id = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.url = url
    this.options = options
    this.status = 'pending' // pending, downloading, completed, failed, paused
    this.progress = 0
    this.speed = 0
    this.eta = null
    this.size = { downloaded: 0, total: 0 }
    this.error = null
    this.result = null
    this.createdAt = new Date()
    this.startedAt = null
    this.completedAt = null
    this.platform = null
    this.title = null
    this.thumbnail = null
    this.quality = options.quality || 'best'
    this.format = options.format || 'auto'
    this.priority = options.priority || 0
  }
}

class QueueManager extends EventEmitter {
  constructor(options = {}) {
    super()
    this.queue = []
    this.activeDownloads = new Map()
    this.completedDownloads = []
    this.failedDownloads = []
    
    // Configuration
    this.maxConcurrent = options.maxConcurrent || 3
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 5000
    this.downloadDir = options.downloadDir || './downloads'
    this.bandwidthLimit = options.bandwidthLimit || 0 // 0 = unlimited (bytes/sec)
    
    // Platform manager reference
    this.platformManager = null
    
    // Processing state
    this.isProcessing = false
    this.isPaused = false
    
    // Stats
    this.stats = {
      totalDownloaded: 0,
      totalFailed: 0,
      totalBytes: 0,
      sessionStarted: new Date()
    }
  }

  /**
   * Set platform manager reference
   */
  setPlatformManager(manager) {
    this.platformManager = manager
  }

  /**
   * Add single URL to queue
   */
  addUrl(url, options = {}) {
    const item = new DownloadItem({ url, options })
    this.queue.push(item)
    this.sortQueue()
    this.emit('itemAdded', item)
    this.processQueue()
    return item
  }

  /**
   * Add multiple URLs (batch)
   */
  addBatch(urls, options = {}) {
    const items = []
    for (const url of urls) {
      const item = new DownloadItem({ 
        url: typeof url === 'string' ? url : url.url,
        options: { ...options, ...(typeof url === 'object' ? url : {}) }
      })
      this.queue.push(item)
      items.push(item)
    }
    this.sortQueue()
    this.emit('batchAdded', items)
    this.processQueue()
    return items
  }

  /**
   * Add playlist or channel
   */
  async addPlaylist(playlistUrl, options = {}) {
    if (!this.platformManager) {
      throw new Error('Platform manager not set')
    }

    try {
      // Parse the playlist URL to get individual video URLs
      const parsed = await this.platformManager.parseUrl(playlistUrl)
      
      if (parsed.type === 'playlist' && parsed.items) {
        const items = this.addBatch(parsed.items.map(item => ({
          url: item.url,
          ...options,
          playlistId: parsed.id,
          playlistTitle: parsed.title
        })))
        
        this.emit('playlistAdded', {
          playlistId: parsed.id,
          playlistTitle: parsed.title,
          itemCount: items.length,
          items
        })
        
        return items
      }
      
      // If not a playlist, treat as single URL
      return [this.addUrl(playlistUrl, options)]
    } catch (error) {
      this.emit('error', { type: 'playlistParse', url: playlistUrl, error })
      throw error
    }
  }

  /**
   * Sort queue by priority
   */
  sortQueue() {
    this.queue.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Process queue - start downloading if slots available
   */
  async processQueue() {
    if (this.isPaused) return
    if (this.isProcessing) return
    
    this.isProcessing = true

    while (
      this.activeDownloads.size < this.maxConcurrent &&
      this.queue.length > 0 &&
      !this.isPaused
    ) {
      const item = this.queue.shift()
      if (item && item.status === 'pending') {
        this.startDownload(item)
      }
    }

    this.isProcessing = false
  }

  /**
   * Start individual download
   */
  async startDownload(item) {
    item.status = 'downloading'
    item.startedAt = new Date()
    this.activeDownloads.set(item.id, item)
    this.emit('downloadStarted', item)

    try {
      // Detect platform and get download info
      if (this.platformManager) {
        const result = await this.platformManager.download(item.url, {
          downloadPath: this.downloadDir,
          quality: item.quality,
          format: item.format,
          onProgress: (progress) => {
            item.progress = progress.percent || 0
            item.speed = progress.speed || 0
            item.eta = progress.eta || null
            item.size = {
              downloaded: progress.downloaded || 0,
              total: progress.total || 0
            }
            this.emit('progress', {
              id: item.id,
              ...progress
            })
          }
        })

        // Download complete
        item.status = 'completed'
        item.progress = 100
        item.completedAt = new Date()
        item.result = result
        item.platform = result.platformId
        item.title = result.title

        this.completedDownloads.push(item)
        this.stats.totalDownloaded++
        this.stats.totalBytes += item.size.total || 0

        this.emit('downloadCompleted', item)
      }
    } catch (error) {
      item.status = 'failed'
      item.error = error.message
      item.completedAt = new Date()
      
      // Retry logic
      const retries = item.options._retries || 0
      if (retries < this.maxRetries) {
        item.options._retries = retries + 1
        item.status = 'pending'
        setTimeout(() => {
          this.queue.unshift(item)
          this.processQueue()
        }, this.retryDelay)
        
        this.emit('downloadRetrying', { item, attempt: retries + 1, maxRetries: this.maxRetries })
      } else {
        this.failedDownloads.push(item)
        this.stats.totalFailed++
        this.emit('downloadFailed', item)
      }
    } finally {
      this.activeDownloads.delete(item.id)
      this.processQueue()
    }
  }

  /**
   * Pause all downloads
   */
  pause() {
    this.isPaused = true
    this.emit('queuePaused')
  }

  /**
   * Resume downloads
   */
  resume() {
    this.isPaused = false
    this.emit('queueResumed')
    this.processQueue()
  }

  /**
   * Cancel specific download
   */
  cancel(itemId) {
    // Remove from queue
    const queueIndex = this.queue.findIndex(i => i.id === itemId)
    if (queueIndex > -1) {
      const item = this.queue.splice(queueIndex, 1)[0]
      item.status = 'cancelled'
      this.emit('downloadCancelled', item)
      return true
    }

    // Remove from active (would need to implement cancellation in platform handlers)
    if (this.activeDownloads.has(itemId)) {
      const item = this.activeDownloads.get(itemId)
      item.status = 'cancelled'
      this.activeDownloads.delete(itemId)
      this.emit('downloadCancelled', item)
      return true
    }

    return false
  }

  /**
   * Clear completed downloads
   */
  clearCompleted() {
    this.completedDownloads = []
    this.emit('completedCleared')
  }

  /**
   * Clear failed downloads
   */
  clearFailed() {
    this.failedDownloads = []
    this.emit('failedCleared')
  }

  /**
   * Retry failed downloads
   */
  retryFailed() {
    const failed = [...this.failedDownloads]
    this.failedDownloads = []
    
    for (const item of failed) {
      item.status = 'pending'
      item.error = null
      item.options._retries = 0
      this.queue.push(item)
    }
    
    this.sortQueue()
    this.emit('failedRetrying', { count: failed.length })
    this.processQueue()
  }

  /**
   * Move item up in queue
   */
  moveUp(itemId) {
    const index = this.queue.findIndex(i => i.id === itemId)
    if (index > 0) {
      [this.queue[index - 1], this.queue[index]] = [this.queue[index], this.queue[index - 1]]
      this.emit('queueReordered')
      return true
    }
    return false
  }

  /**
   * Move item down in queue
   */
  moveDown(itemId) {
    const index = this.queue.findIndex(i => i.id === itemId)
    if (index > -1 && index < this.queue.length - 1) {
      [this.queue[index], this.queue[index + 1]] = [this.queue[index + 1], this.queue[index]]
      this.emit('queueReordered')
      return true
    }
    return false
  }

  /**
   * Move item to top of queue
   */
  moveToTop(itemId) {
    const index = this.queue.findIndex(i => i.id === itemId)
    if (index > 0) {
      const [item] = this.queue.splice(index, 1)
      this.queue.unshift(item)
      this.emit('queueReordered')
      return true
    }
    return false
  }

  /**
   * Set priority for item
   */
  setPriority(itemId, priority) {
    const item = this.queue.find(i => i.id === itemId)
    if (item) {
      item.priority = priority
      this.sortQueue()
      this.emit('priorityChanged', { itemId, priority })
      return true
    }
    return false
  }

  /**
   * Set concurrent download limit
   */
  setMaxConcurrent(max) {
    this.maxConcurrent = Math.max(1, Math.min(10, max))
    this.emit('configChanged', { maxConcurrent: this.maxConcurrent })
    this.processQueue()
  }

  /**
   * Set bandwidth limit
   */
  setBandwidthLimit(bytesPerSecond) {
    this.bandwidthLimit = Math.max(0, bytesPerSecond)
    this.emit('configChanged', { bandwidthLimit: this.bandwidthLimit })
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queue: this.queue.map(i => this.getItemSummary(i)),
      active: Array.from(this.activeDownloads.values()).map(i => this.getItemSummary(i)),
      completed: this.completedDownloads.slice(-50).map(i => this.getItemSummary(i)),
      failed: this.failedDownloads.map(i => this.getItemSummary(i)),
      stats: this.stats,
      config: {
        maxConcurrent: this.maxConcurrent,
        bandwidthLimit: this.bandwidthLimit,
        isPaused: this.isPaused
      }
    }
  }

  /**
   * Get summary for an item
   */
  getItemSummary(item) {
    return {
      id: item.id,
      url: item.url,
      status: item.status,
      progress: item.progress,
      speed: item.speed,
      eta: item.eta,
      size: item.size,
      title: item.title,
      platform: item.platform,
      quality: item.quality,
      error: item.error,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
      priority: item.priority
    }
  }

  /**
   * Parse multi-line input (from paste)
   */
  parseMultiLineInput(text) {
    const urls = []
    const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)
    
    for (const line of lines) {
      // Skip comments
      if (line.startsWith('#') || line.startsWith('//')) continue
      
      // Extract URLs from line
      const urlMatches = line.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi)
      if (urlMatches) {
        urls.push(...urlMatches)
      }
    }
    
    return [...new Set(urls)] // Remove duplicates
  }

  /**
   * Import from clipboard or file
   */
  async importUrls(source) {
    let text = source
    
    // If source is a file path, read it
    if (typeof source === 'string' && (source.endsWith('.txt') || source.endsWith('.json'))) {
      try {
        text = await fs.readFile(source, 'utf-8')
        
        // If JSON, parse it
        if (source.endsWith('.json')) {
          const data = JSON.parse(text)
          if (Array.isArray(data)) {
            text = data.map(item => typeof item === 'string' ? item : item.url).join('\n')
          }
        }
      } catch (error) {
        throw new Error(`Failed to read file: ${error.message}`)
      }
    }
    
    const urls = this.parseMultiLineInput(text)
    if (urls.length === 0) {
      throw new Error('No valid URLs found')
    }
    
    return this.addBatch(urls)
  }

  /**
   * Export queue/history to JSON
   */
  exportToJson() {
    return JSON.stringify({
      queue: this.queue.map(i => ({ url: i.url, options: i.options })),
      completed: this.completedDownloads.map(i => ({
        url: i.url,
        title: i.title,
        platform: i.platform,
        completedAt: i.completedAt,
        result: i.result
      })),
      failed: this.failedDownloads.map(i => ({
        url: i.url,
        error: i.error
      })),
      exportedAt: new Date()
    }, null, 2)
  }
}

// Singleton instance
let queueManagerInstance = null

function getQueueManager(options) {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager(options)
  }
  return queueManagerInstance
}

module.exports = {
  QueueManager,
  DownloadItem,
  getQueueManager
}
