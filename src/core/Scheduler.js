/**
 * Galion Universal Downloader - Download Scheduler
 * Schedule downloads for specific times, recurring downloads, bandwidth optimization
 */

const EventEmitter = require('events')
const fs = require('fs').promises
const path = require('path')

class Scheduler extends EventEmitter {
  constructor(options = {}) {
    super()
    this.scheduledJobs = new Map() // id -> job
    this.recurringJobs = new Map() // id -> recurring config
    this.timers = new Map() // id -> timeout/interval handle
    this.configPath = options.configPath || path.join(process.cwd(), 'config', 'scheduler.json')
    this.downloadManager = options.downloadManager
    this.isRunning = false

    // Bandwidth optimization settings
    this.bandwidthRules = {
      offPeak: { start: 0, end: 6, speedLimit: null }, // Midnight to 6 AM - unlimited
      peak: { start: 18, end: 23, speedLimit: 5 * 1024 * 1024 } // 6 PM to 11 PM - 5 MB/s limit
    }
  }

  /**
   * Initialize scheduler
   */
  async initialize() {
    try {
      await this.loadSchedule()
      this.isRunning = true
      this.startAllJobs()
      console.log('[Scheduler] Initialized with', this.scheduledJobs.size, 'scheduled jobs')
    } catch (error) {
      console.error('[Scheduler] Init error:', error.message)
    }
    return this
  }

  // ================================
  // SCHEDULE MANAGEMENT
  // ================================

  /**
   * Schedule a download for a specific time
   */
  scheduleDownload(options) {
    const job = {
      id: options.id || `job_${Date.now()}`,
      url: options.url,
      urls: options.urls || [options.url], // Support multiple URLs
      quality: options.quality || 'best',
      outputDir: options.outputDir,
      scheduledTime: options.scheduledTime, // Date object or ISO string
      recurring: options.recurring || null, // 'daily', 'weekly', 'monthly'
      recurringDays: options.recurringDays || [], // [0,1,2,3,4,5,6] for days of week
      enabled: options.enabled !== false,
      createdAt: new Date(),
      lastRun: null,
      nextRun: null,
      status: 'scheduled',
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      priority: options.priority || 'normal', // 'high', 'normal', 'low'
      tags: options.tags || [],
      notes: options.notes || ''
    }

    // Calculate next run time
    job.nextRun = this.calculateNextRun(job)

    this.scheduledJobs.set(job.id, job)
    this.startJob(job)
    this.saveSchedule()

    this.emit('jobScheduled', job)
    console.log(`[Scheduler] Job scheduled: ${job.id} at ${job.nextRun}`)

    return job
  }

  /**
   * Schedule a playlist/channel for recurring downloads
   */
  scheduleRecurring(options) {
    const job = this.scheduleDownload({
      ...options,
      recurring: options.recurring || 'daily'
    })

    this.recurringJobs.set(job.id, job)
    return job
  }

  /**
   * Calculate next run time for a job
   */
  calculateNextRun(job) {
    if (!job.scheduledTime && !job.recurring) {
      return null
    }

    const now = new Date()

    if (job.scheduledTime) {
      const scheduled = new Date(job.scheduledTime)
      if (scheduled > now) {
        return scheduled
      }
    }

    if (job.recurring) {
      const nextDate = new Date(now)

      switch (job.recurring) {
        case 'hourly':
          nextDate.setHours(nextDate.getHours() + 1)
          nextDate.setMinutes(0)
          nextDate.setSeconds(0)
          break
        
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1)
          if (job.scheduledTime) {
            const time = new Date(job.scheduledTime)
            nextDate.setHours(time.getHours())
            nextDate.setMinutes(time.getMinutes())
          } else {
            nextDate.setHours(3, 0, 0) // Default 3 AM
          }
          break
        
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7)
          if (job.scheduledTime) {
            const time = new Date(job.scheduledTime)
            nextDate.setHours(time.getHours())
            nextDate.setMinutes(time.getMinutes())
          }
          break
        
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1)
          if (job.scheduledTime) {
            const time = new Date(job.scheduledTime)
            nextDate.setDate(time.getDate())
            nextDate.setHours(time.getHours())
            nextDate.setMinutes(time.getMinutes())
          } else {
            nextDate.setDate(1)
            nextDate.setHours(3, 0, 0)
          }
          break
      }

      return nextDate
    }

    return null
  }

  /**
   * Start a scheduled job timer
   */
  startJob(job) {
    if (!job.enabled || !job.nextRun) return

    // Clear existing timer
    if (this.timers.has(job.id)) {
      clearTimeout(this.timers.get(job.id))
    }

    const now = new Date()
    const delay = new Date(job.nextRun) - now

    if (delay <= 0) {
      // Run immediately if overdue
      this.executeJob(job)
    } else {
      // Schedule for later
      const timer = setTimeout(() => this.executeJob(job), delay)
      this.timers.set(job.id, timer)
      console.log(`[Scheduler] Job ${job.id} scheduled for ${job.nextRun} (in ${Math.round(delay/1000/60)} minutes)`)
    }
  }

  /**
   * Execute a scheduled job
   */
  async executeJob(job) {
    console.log(`[Scheduler] Executing job: ${job.id}`)
    job.status = 'running'
    job.lastRun = new Date()

    this.emit('jobStarted', job)

    try {
      // Check bandwidth rules
      const speedLimit = this.getCurrentSpeedLimit()

      // Download all URLs
      for (const url of job.urls) {
        if (this.downloadManager) {
          await this.downloadManager.download(url, {
            quality: job.quality,
            outputDir: job.outputDir,
            speedLimit
          })
        } else {
          // Emit event for external handling
          this.emit('downloadRequest', { url, job })
        }
      }

      job.status = 'completed'
      job.retryCount = 0
      this.emit('jobCompleted', job)
      console.log(`[Scheduler] Job completed: ${job.id}`)

    } catch (error) {
      console.error(`[Scheduler] Job failed: ${job.id}`, error.message)
      job.status = 'failed'
      job.retryCount++
      job.lastError = error.message

      this.emit('jobFailed', { job, error })

      // Retry if under limit
      if (job.retryCount < job.maxRetries) {
        console.log(`[Scheduler] Retrying job ${job.id} (${job.retryCount}/${job.maxRetries})`)
        setTimeout(() => this.executeJob(job), 60000) // Retry in 1 minute
        return
      }
    }

    // Schedule next run for recurring jobs
    if (job.recurring) {
      job.nextRun = this.calculateNextRun(job)
      job.status = 'scheduled'
      this.startJob(job)
      this.saveSchedule()
    } else {
      // Remove one-time jobs
      this.scheduledJobs.delete(job.id)
      this.timers.delete(job.id)
      this.saveSchedule()
    }
  }

  /**
   * Start all scheduled jobs
   */
  startAllJobs() {
    for (const job of this.scheduledJobs.values()) {
      this.startJob(job)
    }
  }

  /**
   * Pause a scheduled job
   */
  pauseJob(jobId) {
    const job = this.scheduledJobs.get(jobId)
    if (job) {
      job.enabled = false
      if (this.timers.has(jobId)) {
        clearTimeout(this.timers.get(jobId))
        this.timers.delete(jobId)
      }
      this.saveSchedule()
      this.emit('jobPaused', job)
    }
  }

  /**
   * Resume a paused job
   */
  resumeJob(jobId) {
    const job = this.scheduledJobs.get(jobId)
    if (job) {
      job.enabled = true
      job.nextRun = this.calculateNextRun(job)
      this.startJob(job)
      this.saveSchedule()
      this.emit('jobResumed', job)
    }
  }

  /**
   * Delete a scheduled job
   */
  deleteJob(jobId) {
    if (this.timers.has(jobId)) {
      clearTimeout(this.timers.get(jobId))
      this.timers.delete(jobId)
    }
    this.scheduledJobs.delete(jobId)
    this.recurringJobs.delete(jobId)
    this.saveSchedule()
    this.emit('jobDeleted', { jobId })
  }

  /**
   * Update a scheduled job
   */
  updateJob(jobId, updates) {
    const job = this.scheduledJobs.get(jobId)
    if (job) {
      Object.assign(job, updates)
      job.nextRun = this.calculateNextRun(job)
      this.startJob(job)
      this.saveSchedule()
      this.emit('jobUpdated', job)
    }
  }

  // ================================
  // BANDWIDTH OPTIMIZATION
  // ================================

  /**
   * Get current speed limit based on time
   */
  getCurrentSpeedLimit() {
    const hour = new Date().getHours()

    for (const [period, rule] of Object.entries(this.bandwidthRules)) {
      if (hour >= rule.start && hour < rule.end) {
        return rule.speedLimit
      }
    }

    return null // No limit
  }

  /**
   * Set bandwidth rules
   */
  setBandwidthRules(rules) {
    this.bandwidthRules = { ...this.bandwidthRules, ...rules }
    this.emit('bandwidthRulesUpdated', this.bandwidthRules)
  }

  /**
   * Check if current time is off-peak
   */
  isOffPeakTime() {
    const hour = new Date().getHours()
    const offPeak = this.bandwidthRules.offPeak
    return hour >= offPeak.start && hour < offPeak.end
  }

  // ================================
  // PERSISTENCE
  // ================================

  /**
   * Load schedule from disk
   */
  async loadSchedule() {
    try {
      const dir = path.dirname(this.configPath)
      await fs.mkdir(dir, { recursive: true })
      
      const content = await fs.readFile(this.configPath, 'utf8')
      const data = JSON.parse(content)

      for (const job of data.jobs || []) {
        this.scheduledJobs.set(job.id, job)
      }

      if (data.bandwidthRules) {
        this.bandwidthRules = data.bandwidthRules
      }

    } catch (error) {
      // File doesn't exist yet
    }
  }

  /**
   * Save schedule to disk
   */
  async saveSchedule() {
    try {
      const dir = path.dirname(this.configPath)
      await fs.mkdir(dir, { recursive: true })

      const data = {
        jobs: [...this.scheduledJobs.values()],
        bandwidthRules: this.bandwidthRules,
        updatedAt: new Date().toISOString()
      }

      await fs.writeFile(this.configPath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('[Scheduler] Save error:', error.message)
    }
  }

  // ================================
  // STATUS & UTILITIES
  // ================================

  /**
   * Get all scheduled jobs
   */
  getJobs(filter = {}) {
    let jobs = [...this.scheduledJobs.values()]

    if (filter.status) {
      jobs = jobs.filter(j => j.status === filter.status)
    }

    if (filter.recurring !== undefined) {
      jobs = jobs.filter(j => !!j.recurring === filter.recurring)
    }

    if (filter.enabled !== undefined) {
      jobs = jobs.filter(j => j.enabled === filter.enabled)
    }

    return jobs.sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun))
  }

  /**
   * Get job by ID
   */
  getJob(jobId) {
    return this.scheduledJobs.get(jobId)
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const jobs = this.getJobs()
    const now = new Date()

    return {
      isRunning: this.isRunning,
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'running').length,
      scheduledJobs: jobs.filter(j => j.status === 'scheduled').length,
      recurringJobs: this.recurringJobs.size,
      nextJob: jobs.find(j => j.nextRun && new Date(j.nextRun) > now),
      isOffPeak: this.isOffPeakTime(),
      currentSpeedLimit: this.getCurrentSpeedLimit()
    }
  }

  /**
   * Shutdown scheduler
   */
  shutdown() {
    this.isRunning = false
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    console.log('[Scheduler] Shutdown complete')
  }
}

// Singleton instance
let schedulerInstance = null

async function getScheduler(options) {
  if (!schedulerInstance) {
    schedulerInstance = new Scheduler(options)
    await schedulerInstance.initialize()
  }
  return schedulerInstance
}

module.exports = {
  Scheduler,
  getScheduler
}
