/**
 * Galion Universal Downloader - Worker Pool
 * Multi-threaded download processing for 10x faster parallel downloads
 */

const { Worker } = require('worker_threads')
const path = require('path')
const EventEmitter = require('events')
const os = require('os')

class WorkerPool extends EventEmitter {
  constructor(options = {}) {
    super()
    
    // Auto-detect optimal worker count (CPU cores - 1)
    this.numWorkers = options.numWorkers || Math.max(1, os.cpus().length - 1)
    this.maxQueue = options.maxQueue || 1000
    this.workers = []
    this.taskQueue = []
    this.activeJobs = new Map()
    this.completedJobs = 0
    this.failedJobs = 0
    
    // Initialize workers
    this.initialized = false
  }

  /**
   * Initialize worker pool
   */
  async initialize() {
    if (this.initialized) return
    
    console.log(`[WorkerPool] Starting ${this.numWorkers} workers...`)
    
    for (let i = 0; i < this.numWorkers; i++) {
      try {
        const worker = await this.createWorker(i)
        this.workers.push({
          instance: worker,
          id: i,
          busy: false
        })
      } catch (error) {
        console.error(`[WorkerPool] Failed to create worker ${i}:`, error.message)
      }
    }
    
    this.initialized = true
    this.emit('ready', { workerCount: this.workers.length })
    console.log(`[WorkerPool] Ready with ${this.workers.length} workers`)
    
    return this
  }

  /**
   * Create a single worker
   */
  createWorker(id) {
    return new Promise((resolve, reject) => {
      const workerCode = `
        const { parentPort, workerData } = require('worker_threads');
        const https = require('https');
        const http = require('http');
        const fs = require('fs');
        const path = require('path');
        const { URL } = require('url');

        // Download with progress tracking
        async function downloadFile(task) {
          const { url, outputPath, resumeFrom = 0, headers = {} } = task;
          
          return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;
            
            // Add resume header if needed
            if (resumeFrom > 0) {
              headers['Range'] = 'bytes=' + resumeFrom + '-';
            }
            
            const options = {
              hostname: urlObj.hostname,
              port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
              path: urlObj.pathname + urlObj.search,
              method: 'GET',
              headers: {
                'User-Agent': 'Galion-Universal-Downloader/2.0',
                ...headers
              }
            };
            
            const req = protocol.request(options, (res) => {
              // Handle redirects
              if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                task.url = res.headers.location;
                downloadFile(task).then(resolve).catch(reject);
                return;
              }
              
              if (res.statusCode !== 200 && res.statusCode !== 206) {
                reject(new Error('HTTP ' + res.statusCode));
                return;
              }
              
              const totalSize = parseInt(res.headers['content-length'] || '0', 10) + resumeFrom;
              let downloadedSize = resumeFrom;
              const startTime = Date.now();
              let lastProgressTime = startTime;
              let lastDownloadedSize = downloadedSize;
              
              // Ensure output directory exists
              const dir = path.dirname(outputPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              
              const writeStream = fs.createWriteStream(outputPath, { 
                flags: resumeFrom > 0 ? 'a' : 'w' 
              });
              
              res.on('data', (chunk) => {
                downloadedSize += chunk.length;
                const now = Date.now();
                
                // Report progress every 500ms
                if (now - lastProgressTime >= 500) {
                  const elapsedSecs = (now - lastProgressTime) / 1000;
                  const speed = (downloadedSize - lastDownloadedSize) / elapsedSecs;
                  const percent = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
                  const remaining = totalSize - downloadedSize;
                  const eta = speed > 0 ? remaining / speed : 0;
                  
                  parentPort.postMessage({
                    type: 'progress',
                    taskId: task.id,
                    data: {
                      downloaded: downloadedSize,
                      total: totalSize,
                      percent: Math.round(percent * 10) / 10,
                      speed: Math.round(speed),
                      eta: Math.round(eta)
                    }
                  });
                  
                  lastProgressTime = now;
                  lastDownloadedSize = downloadedSize;
                }
                
                writeStream.write(chunk);
              });
              
              res.on('end', () => {
                writeStream.end();
                resolve({
                  path: outputPath,
                  size: downloadedSize,
                  duration: Date.now() - startTime
                });
              });
              
              res.on('error', (err) => {
                writeStream.end();
                reject(err);
              });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
              req.destroy();
              reject(new Error('Request timeout'));
            });
            
            req.setTimeout(30000);
            req.end();
          });
        }

        // Listen for tasks from main thread
        parentPort.on('message', async (task) => {
          if (task.type === 'download') {
            try {
              const result = await downloadFile(task);
              parentPort.postMessage({
                type: 'complete',
                taskId: task.id,
                result
              });
            } catch (error) {
              parentPort.postMessage({
                type: 'error',
                taskId: task.id,
                error: error.message
              });
            }
          } else if (task.type === 'ping') {
            parentPort.postMessage({ type: 'pong', workerId: workerData.id });
          }
        });

        parentPort.postMessage({ type: 'ready', workerId: workerData.id });
      `
      
      // Create worker from inline code
      const worker = new Worker(workerCode, {
        eval: true,
        workerData: { id }
      })
      
      worker.on('message', (msg) => {
        if (msg.type === 'ready') {
          resolve(worker)
        } else {
          this.handleWorkerMessage(id, msg)
        }
      })
      
      worker.on('error', (error) => {
        console.error(`[Worker ${id}] Error:`, error)
        this.emit('workerError', { workerId: id, error })
      })
      
      worker.on('exit', (code) => {
        console.log(`[Worker ${id}] Exited with code ${code}`)
        this.emit('workerExit', { workerId: id, code })
        
        // Restart worker
        this.restartWorker(id)
      })
    })
  }

  /**
   * Handle messages from workers
   */
  handleWorkerMessage(workerId, msg) {
    if (msg.type === 'progress') {
      const job = this.activeJobs.get(msg.taskId)
      if (job) {
        job.progress = msg.data
        this.emit('progress', { taskId: msg.taskId, ...msg.data })
      }
    } else if (msg.type === 'complete') {
      const job = this.activeJobs.get(msg.taskId)
      if (job) {
        job.status = 'completed'
        job.result = msg.result
        this.activeJobs.delete(msg.taskId)
        this.completedJobs++
        
        // Free up the worker
        const worker = this.workers.find(w => w.id === workerId)
        if (worker) worker.busy = false
        
        this.emit('complete', { taskId: msg.taskId, result: msg.result })
        
        // Process next task in queue
        this.processQueue()
      }
    } else if (msg.type === 'error') {
      const job = this.activeJobs.get(msg.taskId)
      if (job) {
        job.status = 'failed'
        job.error = msg.error
        this.activeJobs.delete(msg.taskId)
        this.failedJobs++
        
        // Free up the worker
        const worker = this.workers.find(w => w.id === workerId)
        if (worker) worker.busy = false
        
        this.emit('error', { taskId: msg.taskId, error: msg.error })
        
        // Process next task in queue
        this.processQueue()
      }
    }
  }

  /**
   * Restart a failed worker
   */
  async restartWorker(id) {
    const index = this.workers.findIndex(w => w.id === id)
    if (index > -1) {
      try {
        const newWorker = await this.createWorker(id)
        this.workers[index] = {
          instance: newWorker,
          id,
          busy: false
        }
        console.log(`[WorkerPool] Worker ${id} restarted`)
        this.processQueue()
      } catch (error) {
        console.error(`[WorkerPool] Failed to restart worker ${id}:`, error)
      }
    }
  }

  /**
   * Add a download task to the pool
   */
  addTask(task) {
    if (!this.initialized) {
      throw new Error('WorkerPool not initialized. Call initialize() first.')
    }
    
    const taskId = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const job = {
      id: taskId,
      task: { ...task, id: taskId, type: 'download' },
      status: 'pending',
      progress: null,
      result: null,
      error: null,
      createdAt: new Date()
    }
    
    this.taskQueue.push(job)
    this.emit('taskAdded', { taskId })
    
    this.processQueue()
    
    return taskId
  }

  /**
   * Add multiple tasks (batch)
   */
  addBatch(tasks) {
    return tasks.map(task => this.addTask(task))
  }

  /**
   * Process task queue
   */
  processQueue() {
    // Find available workers
    const availableWorkers = this.workers.filter(w => !w.busy)
    
    while (availableWorkers.length > 0 && this.taskQueue.length > 0) {
      const worker = availableWorkers.shift()
      const job = this.taskQueue.shift()
      
      if (worker && job) {
        worker.busy = true
        job.status = 'active'
        job.startedAt = new Date()
        
        this.activeJobs.set(job.id, job)
        worker.instance.postMessage(job.task)
        
        this.emit('taskStarted', { taskId: job.id, workerId: worker.id })
      }
    }
  }

  /**
   * Cancel a pending task
   */
  cancelTask(taskId) {
    const index = this.taskQueue.findIndex(j => j.id === taskId)
    if (index > -1) {
      this.taskQueue.splice(index, 1)
      this.emit('taskCancelled', { taskId })
      return true
    }
    return false
  }

  /**
   * Get pool status
   */
  getStatus() {
    return {
      workers: {
        total: this.workers.length,
        busy: this.workers.filter(w => w.busy).length,
        available: this.workers.filter(w => !w.busy).length
      },
      queue: {
        pending: this.taskQueue.length,
        active: this.activeJobs.size
      },
      stats: {
        completed: this.completedJobs,
        failed: this.failedJobs
      }
    }
  }

  /**
   * Shutdown the pool
   */
  async shutdown() {
    console.log('[WorkerPool] Shutting down...')
    
    for (const worker of this.workers) {
      await worker.instance.terminate()
    }
    
    this.workers = []
    this.taskQueue = []
    this.activeJobs.clear()
    this.initialized = false
    
    this.emit('shutdown')
    console.log('[WorkerPool] Shutdown complete')
  }
}

// Singleton instance
let workerPoolInstance = null

async function getWorkerPool(options) {
  if (!workerPoolInstance) {
    workerPoolInstance = new WorkerPool(options)
    await workerPoolInstance.initialize()
  }
  return workerPoolInstance
}

module.exports = {
  WorkerPool,
  getWorkerPool
}
