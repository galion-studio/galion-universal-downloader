/**
 * Galion Universal Downloader - IndexedDB Cache Service
 * Caches metadata locally for instant queue previews and history search
 */

const DB_NAME = 'galion-downloader'
const DB_VERSION = 1

interface CachedMetadata {
  url: string
  platform: string
  title: string
  thumbnail?: string
  duration?: number
  size?: number
  quality?: string
  author?: string
  uploadDate?: string
  cachedAt: number
  expiresAt: number
}

interface DownloadHistory {
  id: string
  url: string
  platform: string
  title: string
  filename: string
  path: string
  size: number
  downloadedAt: number
  duration?: number
  status: 'completed' | 'failed'
  error?: string
}

interface QueueItem {
  id: string
  url: string
  platform: string
  title?: string
  quality: string
  priority: number
  addedAt: number
  status: 'pending' | 'downloading' | 'paused'
}

class CacheService {
  private db: IDBDatabase | null = null
  private readyPromise: Promise<void>

  constructor() {
    this.readyPromise = this.initialize()
  }

  /**
   * Initialize IndexedDB
   */
  private async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        console.warn('[CacheService] IndexedDB not available')
        resolve()
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('[CacheService] Failed to open database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('[CacheService] Database ready')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Metadata cache store
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'url' })
          metadataStore.createIndex('platform', 'platform', { unique: false })
          metadataStore.createIndex('cachedAt', 'cachedAt', { unique: false })
          metadataStore.createIndex('expiresAt', 'expiresAt', { unique: false })
        }

        // Download history store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' })
          historyStore.createIndex('url', 'url', { unique: false })
          historyStore.createIndex('platform', 'platform', { unique: false })
          historyStore.createIndex('downloadedAt', 'downloadedAt', { unique: false })
          historyStore.createIndex('status', 'status', { unique: false })
        }

        // Queue store (persists queue across sessions)
        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'id' })
          queueStore.createIndex('addedAt', 'addedAt', { unique: false })
          queueStore.createIndex('priority', 'priority', { unique: false })
          queueStore.createIndex('status', 'status', { unique: false })
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }

        console.log('[CacheService] Database upgraded to version', DB_VERSION)
      }
    })
  }

  /**
   * Wait for database to be ready
   */
  async ready(): Promise<void> {
    return this.readyPromise
  }

  // ===================
  // METADATA CACHE
  // ===================

  /**
   * Cache URL metadata
   */
  async cacheMetadata(metadata: CachedMetadata): Promise<void> {
    await this.ready()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite')
      const store = transaction.objectStore('metadata')
      
      // Set expiration (1 hour default)
      const data = {
        ...metadata,
        cachedAt: Date.now(),
        expiresAt: metadata.expiresAt || Date.now() + 3600000
      }
      
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get cached metadata for URL
   */
  async getMetadata(url: string): Promise<CachedMetadata | null> {
    await this.ready()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly')
      const store = transaction.objectStore('metadata')
      const request = store.get(url)

      request.onsuccess = () => {
        const data = request.result as CachedMetadata | undefined
        if (data && data.expiresAt > Date.now()) {
          resolve(data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear expired metadata
   */
  async cleanupMetadata(): Promise<number> {
    await this.ready()
    if (!this.db) return 0

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite')
      const store = transaction.objectStore('metadata')
      const index = store.index('expiresAt')
      const now = Date.now()
      let deletedCount = 0

      const request = index.openCursor(IDBKeyRange.upperBound(now))
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // ===================
  // DOWNLOAD HISTORY
  // ===================

  /**
   * Add download to history
   */
  async addToHistory(item: DownloadHistory): Promise<void> {
    await this.ready()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite')
      const store = transaction.objectStore('history')
      const request = store.put(item)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get download history
   */
  async getHistory(options: {
    limit?: number
    platform?: string
    status?: 'completed' | 'failed'
    search?: string
  } = {}): Promise<DownloadHistory[]> {
    await this.ready()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly')
      const store = transaction.objectStore('history')
      const results: DownloadHistory[] = []

      let request: IDBRequest
      if (options.platform) {
        const index = store.index('platform')
        request = index.openCursor(IDBKeyRange.only(options.platform), 'prev')
      } else {
        const index = store.index('downloadedAt')
        request = index.openCursor(null, 'prev')
      }

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && (options.limit ? results.length < options.limit : true)) {
          const item = cursor.value as DownloadHistory
          
          // Apply filters
          if (options.status && item.status !== options.status) {
            cursor.continue()
            return
          }
          
          if (options.search) {
            const searchLower = options.search.toLowerCase()
            if (!item.title.toLowerCase().includes(searchLower) &&
                !item.url.toLowerCase().includes(searchLower)) {
              cursor.continue()
              return
            }
          }
          
          results.push(item)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Search history with full-text search
   */
  async searchHistory(query: string): Promise<DownloadHistory[]> {
    return this.getHistory({ search: query, limit: 100 })
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    await this.ready()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite')
      const store = transaction.objectStore('history')
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete history item
   */
  async deleteHistoryItem(id: string): Promise<void> {
    await this.ready()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite')
      const store = transaction.objectStore('history')
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // ===================
  // QUEUE PERSISTENCE
  // ===================

  /**
   * Save queue item
   */
  async saveQueueItem(item: QueueItem): Promise<void> {
    await this.ready()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['queue'], 'readwrite')
      const store = transaction.objectStore('queue')
      const request = store.put(item)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all queue items
   */
  async getQueue(): Promise<QueueItem[]> {
    await this.ready()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['queue'], 'readonly')
      const store = transaction.objectStore('queue')
      const index = store.index('priority')
      const results: QueueItem[] = []

      const request = index.openCursor(null, 'prev')
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove queue item
   */
  async removeQueueItem(id: string): Promise<void> {
    await this.ready()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['queue'], 'readwrite')
      const store = transaction.objectStore('queue')
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear queue
   */
  async clearQueue(): Promise<void> {
    await this.ready()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['queue'], 'readwrite')
      const store = transaction.objectStore('queue')
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // ===================
  // SETTINGS
  // ===================

  /**
   * Save setting
   */
  async setSetting(key: string, value: unknown): Promise<void> {
    await this.ready()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite')
      const store = transaction.objectStore('settings')
      const request = store.put({ key, value, updatedAt: Date.now() })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get setting
   */
  async getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    await this.ready()
    if (!this.db) return defaultValue

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly')
      const store = transaction.objectStore('settings')
      const request = store.get(key)
      
      request.onsuccess = () => {
        resolve(request.result?.value ?? defaultValue)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // ===================
  // STATISTICS
  // ===================

  /**
   * Get download statistics
   */
  async getStats(): Promise<{
    totalDownloads: number
    totalSize: number
    byPlatform: Record<string, number>
    byStatus: Record<string, number>
    lastDownload?: DownloadHistory
  }> {
    const history = await this.getHistory()
    
    const stats = {
      totalDownloads: history.length,
      totalSize: 0,
      byPlatform: {} as Record<string, number>,
      byStatus: { completed: 0, failed: 0 },
      lastDownload: history[0] as DownloadHistory | undefined
    }

    for (const item of history) {
      stats.totalSize += item.size || 0
      stats.byPlatform[item.platform] = (stats.byPlatform[item.platform] || 0) + 1
      stats.byStatus[item.status]++
    }

    return stats
  }

  /**
   * Check for duplicate URL in history
   */
  async isDuplicate(url: string): Promise<boolean> {
    await this.ready()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly')
      const store = transaction.objectStore('history')
      const index = store.index('url')
      const request = index.count(url)
      
      request.onsuccess = () => {
        resolve(request.result > 0)
      }
      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
export const cacheService = new CacheService()

// Export types
export type { CachedMetadata, DownloadHistory, QueueItem }
