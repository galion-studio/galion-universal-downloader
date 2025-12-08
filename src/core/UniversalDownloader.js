/**
 * Universal Downloader
 * Core downloading engine for all content types
 * Supports: Images, Videos, Models, Tensors, LoRAs, Documents, Archives, Profiles
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UniversalDownloader {
  constructor(options = {}) {
    this.downloadDir = options.downloadDir || path.join(process.cwd(), 'downloads');
    this.concurrent = options.concurrent || 5;
    this.retries = options.retries || 3;
    this.timeout = options.timeout || 300000; // 5 minutes
    this.chunkSize = options.chunkSize || 1024 * 1024; // 1MB chunks
    this.onProgress = options.onProgress || null;
    
    this.activeDownloads = new Map();
    this.completedDownloads = [];
    this.failedDownloads = [];
  }

  /**
   * Get content type from file extension
   */
  getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    const typeMap = {
      // Images
      '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image',
      '.webp': 'image', '.avif': 'image', '.bmp': 'image', '.svg': 'image',
      
      // Videos
      '.mp4': 'video', '.webm': 'video', '.mkv': 'video', '.avi': 'video',
      '.mov': 'video', '.wmv': 'video', '.flv': 'video', '.m4v': 'video',
      
      // Audio
      '.mp3': 'audio', '.wav': 'audio', '.flac': 'audio', '.aac': 'audio',
      '.ogg': 'audio', '.m4a': 'audio', '.wma': 'audio',
      
      // Models & Tensors
      '.safetensors': 'model', '.ckpt': 'model', '.pt': 'model',
      '.pth': 'model', '.bin': 'model', '.onnx': 'model', '.h5': 'model',
      '.pb': 'model', '.tflite': 'model',
      
      // Documents
      '.pdf': 'document', '.doc': 'document', '.docx': 'document',
      '.txt': 'document', '.md': 'document', '.rtf': 'document',
      '.json': 'document', '.yaml': 'document', '.yml': 'document',
      
      // Archives
      '.zip': 'archive', '.rar': 'archive', '.7z': 'archive',
      '.tar': 'archive', '.gz': 'archive', '.bz2': 'archive',
      
      // Code
      '.py': 'code', '.js': 'code', '.ts': 'code', '.html': 'code',
      '.css': 'code', '.java': 'code', '.cpp': 'code', '.c': 'code'
    };
    
    return typeMap[ext] || 'unknown';
  }

  /**
   * Get file extension from content type or URL
   */
  getExtension(url, contentType = '') {
    // Try URL first
    const urlMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
    if (urlMatch && urlMatch[1].length <= 10) {
      return urlMatch[1].toLowerCase();
    }
    
    // Try content type
    const typeMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/avif': 'avif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'application/pdf': 'pdf',
      'application/zip': 'zip',
      'application/json': 'json',
      'text/plain': 'txt',
      'text/html': 'html',
      'application/octet-stream': 'bin'
    };
    
    for (const [type, ext] of Object.entries(typeMap)) {
      if (contentType.includes(type)) {
        return ext;
      }
    }
    
    return 'bin';
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create download directory structure
   */
  async createDownloadDir(name, type = 'content') {
    const safeName = name.replace(/[<>:"/\\|?*]/g, '-').substring(0, 100);
    const timestamp = new Date().toISOString().split('T')[0];
    const dirName = `${safeName}_${timestamp}`;
    
    const baseDir = path.join(this.downloadDir, dirName);
    const dirs = {
      base: baseDir,
      images: path.join(baseDir, 'images'),
      videos: path.join(baseDir, 'videos'),
      models: path.join(baseDir, 'models'),
      documents: path.join(baseDir, 'documents'),
      audio: path.join(baseDir, 'audio'),
      other: path.join(baseDir, 'other')
    };

    await fs.ensureDir(baseDir);
    
    return dirs;
  }

  /**
   * Download a single file
   */
  async downloadFile(url, options = {}) {
    const {
      destPath,
      filename,
      headers = {},
      onProgress,
      retryCount = 0
    } = options;

    const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Start request
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          ...headers
        },
        maxRedirects: 10
      });

      const contentType = response.headers['content-type'] || '';
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      
      // Determine filename
      let finalFilename = filename;
      if (!finalFilename) {
        // Try content-disposition header
        const disposition = response.headers['content-disposition'];
        if (disposition) {
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match) {
            finalFilename = match[1].replace(/['"]/g, '');
          }
        }
        
        // Fallback to URL
        if (!finalFilename) {
          const urlPath = new URL(url).pathname;
          finalFilename = path.basename(urlPath) || 'download';
        }
      }

      // Ensure extension
      if (!path.extname(finalFilename)) {
        finalFilename += '.' + this.getExtension(url, contentType);
      }

      // Determine destination
      const finalPath = destPath 
        ? path.join(destPath, finalFilename)
        : path.join(this.downloadDir, finalFilename);

      await fs.ensureDir(path.dirname(finalPath));

      // Track progress
      let downloadedBytes = 0;
      
      this.activeDownloads.set(downloadId, {
        id: downloadId,
        url,
        filename: finalFilename,
        path: finalPath,
        size: contentLength,
        downloaded: 0,
        progress: 0,
        status: 'downloading'
      });

      // Stream to file with progress
      const writer = createWriteStream(finalPath);
      
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = contentLength ? (downloadedBytes / contentLength) * 100 : 0;
        
        const downloadInfo = this.activeDownloads.get(downloadId);
        if (downloadInfo) {
          downloadInfo.downloaded = downloadedBytes;
          downloadInfo.progress = progress;
        }

        if (onProgress) {
          onProgress({
            id: downloadId,
            filename: finalFilename,
            downloaded: downloadedBytes,
            total: contentLength,
            progress: progress
          });
        }
      });

      await pipeline(response.data, writer);

      // Complete
      const result = {
        success: true,
        id: downloadId,
        url,
        filename: finalFilename,
        path: finalPath,
        size: downloadedBytes,
        contentType: this.getContentType(finalFilename),
        mimeType: contentType
      };

      this.activeDownloads.delete(downloadId);
      this.completedDownloads.push(result);

      return result;

    } catch (error) {
      // Retry on failure
      if (retryCount < this.retries) {
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
        return this.downloadFile(url, { ...options, retryCount: retryCount + 1 });
      }

      const failedResult = {
        success: false,
        id: downloadId,
        url,
        error: error.message
      };

      this.activeDownloads.delete(downloadId);
      this.failedDownloads.push(failedResult);

      return failedResult;
    }
  }

  /**
   * Download multiple files in parallel
   */
  async downloadFiles(files, options = {}) {
    const { destDir, onProgress, onComplete } = options;
    
    const results = {
      successful: [],
      failed: [],
      total: files.length
    };

    let completed = 0;

    // Process in batches
    for (let i = 0; i < files.length; i += this.concurrent) {
      const batch = files.slice(i, i + this.concurrent);
      
      const batchPromises = batch.map(async (file) => {
        const url = typeof file === 'string' ? file : file.url;
        const filename = typeof file === 'string' ? null : file.filename;
        
        const result = await this.downloadFile(url, {
          destPath: destDir,
          filename,
          headers: options.headers,
          onProgress: (progress) => {
            if (onProgress) {
              onProgress({
                ...progress,
                overallProgress: ((completed + progress.progress / 100) / files.length) * 100
              });
            }
          }
        });

        completed++;
        
        if (result.success) {
          results.successful.push(result);
        } else {
          results.failed.push(result);
        }

        if (onComplete) {
          onComplete({
            file: result,
            completed,
            total: files.length
          });
        }

        return result;
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  /**
   * Download with resume support (for large files)
   */
  async downloadWithResume(url, destPath, options = {}) {
    const { headers = {}, onProgress } = options;
    
    let startByte = 0;
    
    // Check for existing partial download
    if (await fs.pathExists(destPath)) {
      const stats = await fs.stat(destPath);
      startByte = stats.size;
    }

    try {
      // First, get file size
      const headResponse = await axios.head(url, { headers });
      const totalSize = parseInt(headResponse.headers['content-length'] || '0', 10);
      
      // Check if server supports range requests
      const acceptRanges = headResponse.headers['accept-ranges'];
      
      if (startByte > 0 && acceptRanges === 'bytes') {
        // Resume download
        const response = await axios({
          method: 'GET',
          url,
          responseType: 'stream',
          headers: {
            ...headers,
            Range: `bytes=${startByte}-`
          }
        });

        const writer = createWriteStream(destPath, { flags: 'a' });
        let downloadedBytes = startByte;

        response.data.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (onProgress) {
            onProgress({
              downloaded: downloadedBytes,
              total: totalSize,
              progress: (downloadedBytes / totalSize) * 100,
              resumed: true
            });
          }
        });

        await pipeline(response.data, writer);
        
        return {
          success: true,
          path: destPath,
          size: downloadedBytes,
          resumed: true
        };
      } else {
        // Start fresh download
        return this.downloadFile(url, { destPath, ...options });
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get download statistics
   */
  getStats() {
    return {
      active: this.activeDownloads.size,
      completed: this.completedDownloads.length,
      failed: this.failedDownloads.length,
      totalDownloaded: this.completedDownloads.reduce((sum, d) => sum + (d.size || 0), 0),
      downloads: {
        active: Array.from(this.activeDownloads.values()),
        completed: this.completedDownloads,
        failed: this.failedDownloads
      }
    };
  }

  /**
   * Cancel a download
   */
  cancelDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (download) {
      download.status = 'cancelled';
      this.activeDownloads.delete(downloadId);
      return true;
    }
    return false;
  }

  /**
   * Clear completed/failed downloads
   */
  clearHistory() {
    this.completedDownloads = [];
    this.failedDownloads = [];
  }
}

export default UniversalDownloader;
