/**
 * Galion Universal Downloader - AI Intelligence Module
 * Auto-quality selection, duplicate detection, content tagging using local models
 */

const crypto = require('crypto')
const path = require('path')
const fs = require('fs').promises

class AIIntelligence {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || path.join(process.cwd(), 'cache')
    this.fingerprints = new Map() // Store file fingerprints for duplicate detection
    this.tags = new Map() // URL -> tags cache
    this.deviceProfile = null
    this.userPreferences = {
      preferredQuality: 'best',
      preferredFormat: 'mp4',
      audioOnly: false,
      maxFileSize: null,
      diskSpaceThreshold: 1024 * 1024 * 1024 // 1GB minimum
    }
  }

  /**
   * Initialize AI module
   */
  async initialize() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      await this.loadCache()
      this.deviceProfile = await this.analyzeDevice()
      console.log('[AIIntelligence] Initialized with device profile:', this.deviceProfile.category)
    } catch (error) {
      console.error('[AIIntelligence] Init error:', error.message)
    }
    return this
  }

  // ================================
  // AUTO-QUALITY SELECTION (Smart)
  // ================================

  /**
   * Analyze device capabilities
   */
  async analyzeDevice() {
    const os = require('os')
    
    const profile = {
      cpuCores: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      platform: os.platform(),
      arch: os.arch(),
      networkSpeed: await this.estimateNetworkSpeed()
    }

    // Categorize device
    if (profile.cpuCores >= 8 && profile.totalMemory >= 16 * 1024 * 1024 * 1024) {
      profile.category = 'high-end'
      profile.recommendedQuality = '4k'
    } else if (profile.cpuCores >= 4 && profile.totalMemory >= 8 * 1024 * 1024 * 1024) {
      profile.category = 'mid-range'
      profile.recommendedQuality = '1080p'
    } else {
      profile.category = 'low-end'
      profile.recommendedQuality = '720p'
    }

    // Adjust for network speed
    if (profile.networkSpeed < 5) { // Less than 5 Mbps
      profile.recommendedQuality = '480p'
    } else if (profile.networkSpeed < 15) { // Less than 15 Mbps
      if (profile.recommendedQuality === '4k') {
        profile.recommendedQuality = '1080p'
      }
    }

    return profile
  }

  /**
   * Estimate network speed (simplified)
   */
  async estimateNetworkSpeed() {
    // In production, this would actually test download speed
    // For now, return a reasonable default
    return 50 // Mbps
  }

  /**
   * Get optimal quality for a given video
   */
  async getOptimalQuality(videoInfo, userOverride = null) {
    if (userOverride && userOverride !== 'auto') {
      return userOverride
    }

    const availableFormats = videoInfo.formats || []
    const qualities = ['4k', '2160p', '1440p', '1080p', '720p', '480p', '360p']
    
    // Check available disk space
    const freeSpace = await this.getFreeDiskSpace()
    
    // Find best quality that fits constraints
    for (const quality of qualities) {
      const format = availableFormats.find(f => 
        f.height === this.qualityToHeight(quality) ||
        f.format_note?.includes(quality)
      )

      if (!format) continue

      // Check file size constraints
      const estimatedSize = format.filesize || format.filesize_approx || 0
      
      if (this.userPreferences.maxFileSize && estimatedSize > this.userPreferences.maxFileSize) {
        continue
      }

      if (estimatedSize > freeSpace - this.userPreferences.diskSpaceThreshold) {
        continue
      }

      // Check device capability
      const height = this.qualityToHeight(quality)
      const deviceMaxHeight = this.qualityToHeight(this.deviceProfile?.recommendedQuality || '1080p')
      
      if (height <= deviceMaxHeight) {
        return quality
      }
    }

    return this.deviceProfile?.recommendedQuality || '720p'
  }

  /**
   * Convert quality string to height
   */
  qualityToHeight(quality) {
    const map = {
      '8k': 4320,
      '4k': 2160,
      '2160p': 2160,
      '1440p': 1440,
      '1080p': 1080,
      '720p': 720,
      '480p': 480,
      '360p': 360,
      '240p': 240
    }
    return map[quality?.toLowerCase()] || 1080
  }

  /**
   * Get free disk space
   */
  async getFreeDiskSpace() {
    try {
      const os = require('os')
      // Simplified - in production use disk-space package
      return os.freemem() * 10 // Rough estimate
    } catch (error) {
      return 10 * 1024 * 1024 * 1024 // 10GB default
    }
  }

  // ================================
  // DUPLICATE DETECTION
  // ================================

  /**
   * Generate content fingerprint
   */
  generateFingerprint(data) {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(data))
    return hash.digest('hex').substring(0, 16)
  }

  /**
   * Check if content is duplicate
   */
  async checkDuplicate(videoInfo, downloadedFiles = []) {
    const fingerprint = this.generateFingerprint({
      title: videoInfo.title,
      duration: videoInfo.duration,
      uploader: videoInfo.uploader || videoInfo.channel,
      uploadDate: videoInfo.upload_date
    })

    // Check in-memory cache
    if (this.fingerprints.has(fingerprint)) {
      return {
        isDuplicate: true,
        existingPath: this.fingerprints.get(fingerprint),
        confidence: 0.95
      }
    }

    // Check against provided downloaded files
    for (const file of downloadedFiles) {
      const existingFingerprint = this.generateFingerprint({
        title: file.title,
        duration: file.duration,
        uploader: file.uploader,
        uploadDate: file.uploadDate
      })

      if (existingFingerprint === fingerprint) {
        return {
          isDuplicate: true,
          existingPath: file.path,
          confidence: 0.95
        }
      }
    }

    // Check by title similarity
    const similarFile = await this.findSimilarByTitle(videoInfo.title, downloadedFiles)
    if (similarFile) {
      return {
        isDuplicate: true,
        existingPath: similarFile.path,
        confidence: similarFile.similarity,
        reason: 'Similar title detected'
      }
    }

    return { isDuplicate: false }
  }

  /**
   * Find similar content by title
   */
  async findSimilarByTitle(title, files) {
    if (!title || !files.length) return null

    const normalizedTitle = this.normalizeTitle(title)

    for (const file of files) {
      const normalizedFileTitle = this.normalizeTitle(file.title || '')
      const similarity = this.calculateSimilarity(normalizedTitle, normalizedFileTitle)

      if (similarity > 0.85) {
        return { ...file, similarity }
      }
    }

    return null
  }

  /**
   * Normalize title for comparison
   */
  normalizeTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Calculate string similarity (Jaccard)
   */
  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.split(' '))
    const words2 = new Set(str2.split(' '))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Register downloaded file fingerprint
   */
  registerDownload(videoInfo, filePath) {
    const fingerprint = this.generateFingerprint({
      title: videoInfo.title,
      duration: videoInfo.duration,
      uploader: videoInfo.uploader || videoInfo.channel,
      uploadDate: videoInfo.upload_date
    })

    this.fingerprints.set(fingerprint, filePath)
  }

  // ================================
  // CONTENT TAGGING (AI)
  // ================================

  /**
   * Auto-generate tags for content
   */
  async generateTags(videoInfo) {
    const tags = new Set()

    // Extract from title
    const titleWords = this.extractKeywords(videoInfo.title || '')
    titleWords.forEach(w => tags.add(w))

    // Extract from description
    const descWords = this.extractKeywords(videoInfo.description || '')
    descWords.slice(0, 5).forEach(w => tags.add(w))

    // Add category tags
    if (videoInfo.categories) {
      videoInfo.categories.forEach(c => tags.add(c.toLowerCase()))
    }

    // Add platform-specific tags
    if (videoInfo.extractor) {
      tags.add(videoInfo.extractor.toLowerCase())
    }

    // Add quality tags
    if (videoInfo.height >= 2160) tags.add('4k')
    else if (videoInfo.height >= 1080) tags.add('1080p')
    else if (videoInfo.height >= 720) tags.add('hd')

    // Add format tags
    if (videoInfo.duration && videoInfo.duration < 60) tags.add('short')
    if (videoInfo.duration && videoInfo.duration > 3600) tags.add('long-form')

    // Add content type classification
    const contentType = this.classifyContent(videoInfo)
    if (contentType) tags.add(contentType)

    // Cache tags
    if (videoInfo.webpage_url) {
      this.tags.set(videoInfo.webpage_url, [...tags])
    }

    return [...tags]
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your'
    ])

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10)
  }

  /**
   * Classify content type
   */
  classifyContent(videoInfo) {
    const title = (videoInfo.title || '').toLowerCase()
    const description = (videoInfo.description || '').toLowerCase()
    const combined = title + ' ' + description

    const categories = {
      'music-video': ['music video', 'official video', 'lyrics', 'mv', 'music'],
      'tutorial': ['tutorial', 'how to', 'guide', 'learn', 'course', 'lesson'],
      'gaming': ['gameplay', 'gaming', 'playthrough', 'walkthrough', 'stream', 'lets play'],
      'vlog': ['vlog', 'day in my life', 'routine', 'daily'],
      'review': ['review', 'unboxing', 'comparison', 'vs', 'honest opinion'],
      'podcast': ['podcast', 'episode', 'ep.', 'interview'],
      'documentary': ['documentary', 'history', 'explained'],
      'news': ['news', 'breaking', 'update', 'report'],
      'comedy': ['comedy', 'funny', 'prank', 'try not to laugh'],
      'sports': ['sports', 'highlights', 'match', 'game', 'championship'],
      'travel': ['travel', 'trip', 'vacation', 'tour', 'explore'],
      'food': ['recipe', 'cooking', 'food', 'mukbang', 'eating'],
      'fitness': ['workout', 'fitness', 'exercise', 'gym', 'training'],
      'tech': ['tech', 'technology', 'gadget', 'iphone', 'android', 'computer']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (combined.includes(keyword)) {
          return category
        }
      }
    }

    return null
  }

  // ================================
  // SMART RECOMMENDATIONS
  // ================================

  /**
   * Recommend download settings based on content
   */
  async recommendSettings(videoInfo) {
    const recommendations = {
      quality: await this.getOptimalQuality(videoInfo),
      format: 'mp4',
      audioFormat: 'aac',
      subtitles: false,
      thumbnail: true
    }

    // Music content -> prefer audio
    const contentType = this.classifyContent(videoInfo)
    if (contentType === 'music-video' || contentType === 'podcast') {
      recommendations.extractAudio = true
      recommendations.audioFormat = 'mp3'
      recommendations.audioBitrate = '320k'
    }

    // Long content -> enable subtitles
    if (videoInfo.duration && videoInfo.duration > 1800) {
      recommendations.subtitles = true
    }

    // Tutorial/educational -> enable subtitles
    if (contentType === 'tutorial' || contentType === 'documentary') {
      recommendations.subtitles = true
    }

    return recommendations
  }

  // ================================
  // CACHE MANAGEMENT
  // ================================

  /**
   * Load cache from disk
   */
  async loadCache() {
    try {
      const fingerprintsPath = path.join(this.cacheDir, 'fingerprints.json')
      const content = await fs.readFile(fingerprintsPath, 'utf8')
      const data = JSON.parse(content)
      this.fingerprints = new Map(Object.entries(data))
    } catch (error) {
      // Cache doesn't exist yet
    }
  }

  /**
   * Save cache to disk
   */
  async saveCache() {
    try {
      const fingerprintsPath = path.join(this.cacheDir, 'fingerprints.json')
      const data = Object.fromEntries(this.fingerprints)
      await fs.writeFile(fingerprintsPath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('[AIIntelligence] Cache save error:', error.message)
    }
  }

  /**
   * Get AI status
   */
  getStatus() {
    return {
      initialized: !!this.deviceProfile,
      deviceProfile: this.deviceProfile,
      cachedFingerprints: this.fingerprints.size,
      cachedTags: this.tags.size
    }
  }
}

// Singleton instance
let aiInstance = null

async function getAIIntelligence(options) {
  if (!aiInstance) {
    aiInstance = new AIIntelligence(options)
    await aiInstance.initialize()
  }
  return aiInstance
}

module.exports = {
  AIIntelligence,
  getAIIntelligence
}
