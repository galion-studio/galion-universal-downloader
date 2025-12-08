/**
 * FileSystemScanner - Developer Tools for File System Analysis
 * Scans directories, analyzes files, generates reports
 * Useful for developers managing downloaded content
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

// File type categories
const FILE_CATEGORIES = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.raw', '.psd', '.ai'],
  video: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp', '.ts'],
  audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff'],
  document: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx', '.md'],
  code: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.json', '.xml', '.yaml', '.yml', '.sh', '.bat'],
  model: ['.safetensors', '.ckpt', '.pt', '.pth', '.bin', '.onnx', '.h5', '.pkl', '.joblib'],
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tar.gz'],
  subtitle: ['.srt', '.vtt', '.ass', '.ssa', '.sub'],
  data: ['.csv', '.json', '.xml', '.sql', '.db', '.sqlite']
};

// Codec and format information
const VIDEO_CODECS = ['h264', 'h265', 'hevc', 'vp8', 'vp9', 'av1', 'mpeg4', 'xvid', 'divx'];
const AUDIO_CODECS = ['aac', 'mp3', 'opus', 'vorbis', 'flac', 'alac', 'pcm', 'ac3', 'dts'];
const CONTAINER_FORMATS = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'ts', 'm2ts', 'ogg'];

export class FileSystemScanner {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 10;
    this.includeHidden = options.includeHidden || false;
    this.followSymlinks = options.followSymlinks || false;
    this.excludePatterns = options.excludePatterns || ['node_modules', '.git', '__pycache__'];
  }

  /**
   * Get file category based on extension
   */
  getCategory(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }
    return 'other';
  }

  /**
   * Calculate file hash
   */
  async getFileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Get detailed file info
   */
  async getFileInfo(filePath) {
    const stat = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      name: path.basename(filePath),
      path: filePath,
      extension: ext,
      category: this.getCategory(filePath),
      size: stat.size,
      sizeFormatted: this.formatBytes(stat.size),
      created: stat.birthtime,
      modified: stat.mtime,
      accessed: stat.atime,
      isSymlink: stat.isSymbolicLink(),
      permissions: stat.mode.toString(8).slice(-3)
    };
  }

  /**
   * Scan directory recursively
   */
  async scanDirectory(dirPath, options = {}) {
    const {
      depth = 0,
      onProgress = () => {},
      includeHashes = false
    } = options;

    if (depth > this.maxDepth) {
      return { files: [], directories: [], stats: {} };
    }

    const results = {
      path: dirPath,
      files: [],
      directories: [],
      stats: {
        totalFiles: 0,
        totalDirectories: 0,
        totalSize: 0,
        byCategory: {},
        byExtension: {},
        largestFiles: [],
        duplicates: []
      }
    };

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip excluded patterns
        if (this.excludePatterns.some(pattern => entry.name.includes(pattern))) {
          continue;
        }
        
        // Skip hidden files unless requested
        if (!this.includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          results.stats.totalDirectories++;
          
          // Recursively scan subdirectory
          const subResults = await this.scanDirectory(fullPath, {
            depth: depth + 1,
            onProgress,
            includeHashes
          });
          
          results.directories.push({
            name: entry.name,
            path: fullPath,
            ...subResults.stats
          });
          
          // Merge stats
          results.stats.totalFiles += subResults.stats.totalFiles;
          results.stats.totalDirectories += subResults.stats.totalDirectories;
          results.stats.totalSize += subResults.stats.totalSize;
          
          // Merge files for duplicate detection
          results.files.push(...subResults.files);
          
        } else if (entry.isFile()) {
          const fileInfo = await this.getFileInfo(fullPath);
          
          if (includeHashes && fileInfo.size < 100 * 1024 * 1024) { // Only hash files < 100MB
            fileInfo.hash = await this.getFileHash(fullPath);
          }
          
          results.files.push(fileInfo);
          results.stats.totalFiles++;
          results.stats.totalSize += fileInfo.size;
          
          // Track by category
          if (!results.stats.byCategory[fileInfo.category]) {
            results.stats.byCategory[fileInfo.category] = { count: 0, size: 0 };
          }
          results.stats.byCategory[fileInfo.category].count++;
          results.stats.byCategory[fileInfo.category].size += fileInfo.size;
          
          // Track by extension
          if (!results.stats.byExtension[fileInfo.extension]) {
            results.stats.byExtension[fileInfo.extension] = { count: 0, size: 0 };
          }
          results.stats.byExtension[fileInfo.extension].count++;
          results.stats.byExtension[fileInfo.extension].size += fileInfo.size;
        }
      }

      // Find largest files
      results.stats.largestFiles = results.files
        .sort((a, b) => b.size - a.size)
        .slice(0, 20)
        .map(f => ({ name: f.name, path: f.path, size: f.sizeFormatted }));

      // Find duplicates (by hash or size+name)
      if (includeHashes) {
        const hashMap = {};
        for (const file of results.files) {
          if (file.hash) {
            if (!hashMap[file.hash]) {
              hashMap[file.hash] = [];
            }
            hashMap[file.hash].push(file);
          }
        }
        
        results.stats.duplicates = Object.values(hashMap)
          .filter(group => group.length > 1)
          .map(group => ({
            hash: group[0].hash,
            size: group[0].sizeFormatted,
            files: group.map(f => f.path)
          }));
      }

      results.stats.totalSizeFormatted = this.formatBytes(results.stats.totalSize);

    } catch (error) {
      results.error = error.message;
    }

    return results;
  }

  /**
   * Find files by pattern
   */
  async findFiles(dirPath, pattern, options = {}) {
    const { recursive = true, maxResults = 1000 } = options;
    const regex = new RegExp(pattern, 'i');
    const results = [];

    const scan = async (dir) => {
      if (results.length >= maxResults) return;

      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (results.length >= maxResults) break;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isFile() && regex.test(entry.name)) {
          const info = await this.getFileInfo(fullPath);
          results.push(info);
        } else if (entry.isDirectory() && recursive) {
          if (!this.excludePatterns.some(p => entry.name.includes(p))) {
            await scan(fullPath);
          }
        }
      }
    };

    await scan(dirPath);
    return results;
  }

  /**
   * Find media files (videos, audio)
   */
  async findMediaFiles(dirPath) {
    const mediaExtensions = [...FILE_CATEGORIES.video, ...FILE_CATEGORIES.audio];
    const results = await this.findFiles(dirPath, `(${mediaExtensions.join('|').replace(/\./g, '\\.')})$`);
    return results;
  }

  /**
   * Find model files
   */
  async findModelFiles(dirPath) {
    const modelExtensions = FILE_CATEGORIES.model;
    const results = await this.findFiles(dirPath, `(${modelExtensions.join('|').replace(/\./g, '\\.')})$`);
    return results;
  }

  /**
   * Find videos needing transcription (no matching .srt file)
   */
  async findVideosNeedingTranscription(dirPath) {
    const videos = await this.findFiles(dirPath, `(${FILE_CATEGORIES.video.join('|').replace(/\./g, '\\.')})$`);
    const videosNeedingSrt = [];

    for (const video of videos) {
      const baseName = path.basename(video.path, path.extname(video.path));
      const srtPath = path.join(path.dirname(video.path), `${baseName}.srt`);
      
      if (!await fs.pathExists(srtPath)) {
        videosNeedingSrt.push(video);
      }
    }

    return videosNeedingSrt;
  }

  /**
   * Generate project structure tree
   */
  async generateTree(dirPath, options = {}) {
    const { maxDepth = 5, showFiles = true, showSize = false } = options;
    
    const buildTree = async (dir, prefix = '', depth = 0) => {
      if (depth > maxDepth) return '';
      
      let tree = '';
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      // Sort: directories first, then files
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });
      
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        
        // Skip excluded
        if (this.excludePatterns.some(p => entry.name.includes(p))) continue;
        if (!this.includeHidden && entry.name.startsWith('.')) continue;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          tree += `${prefix}${connector}📁 ${entry.name}/\n`;
          tree += await buildTree(fullPath, newPrefix, depth + 1);
        } else if (showFiles) {
          let size = '';
          if (showSize) {
            const stat = await fs.stat(fullPath);
            size = ` (${this.formatBytes(stat.size)})`;
          }
          const icon = this.getFileIcon(entry.name);
          tree += `${prefix}${connector}${icon} ${entry.name}${size}\n`;
        }
      }
      
      return tree;
    };

    const rootName = path.basename(dirPath);
    return `📂 ${rootName}/\n` + await buildTree(dirPath);
  }

  /**
   * Get file icon based on extension
   */
  getFileIcon(filename) {
    const ext = path.extname(filename).toLowerCase();
    const category = this.getCategory(filename);
    
    const icons = {
      image: '🖼️',
      video: '🎬',
      audio: '🎵',
      document: '📄',
      code: '📝',
      model: '🧠',
      archive: '📦',
      subtitle: '💬',
      data: '📊',
      other: '📎'
    };
    
    return icons[category] || '📎';
  }

  /**
   * Generate detailed report
   */
  async generateReport(dirPath, options = {}) {
    const scanResults = await this.scanDirectory(dirPath, { includeHashes: true });
    const tree = await this.generateTree(dirPath, { maxDepth: 3 });
    const videosNeedingSrt = await this.findVideosNeedingTranscription(dirPath);
    
    const report = {
      generatedAt: new Date().toISOString(),
      path: dirPath,
      summary: {
        totalFiles: scanResults.stats.totalFiles,
        totalDirectories: scanResults.stats.totalDirectories,
        totalSize: scanResults.stats.totalSizeFormatted,
        byCategory: Object.entries(scanResults.stats.byCategory).map(([cat, data]) => ({
          category: cat,
          count: data.count,
          size: this.formatBytes(data.size)
        }))
      },
      largestFiles: scanResults.stats.largestFiles,
      duplicates: scanResults.stats.duplicates,
      videosNeedingTranscription: videosNeedingSrt.map(v => ({
        name: v.name,
        path: v.path,
        size: v.sizeFormatted
      })),
      tree: tree,
      supportedFormats: {
        video: FILE_CATEGORIES.video,
        audio: FILE_CATEGORIES.audio,
        model: FILE_CATEGORIES.model,
        videoCodecs: VIDEO_CODECS,
        audioCodecs: AUDIO_CODECS,
        containers: CONTAINER_FORMATS
      }
    };

    return report;
  }

  /**
   * Export report to file
   */
  async exportReport(dirPath, outputPath = null) {
    const report = await this.generateReport(dirPath);
    const exportPath = outputPath || path.join(dirPath, 'file_system_report.json');
    
    await fs.writeJson(exportPath, report, { spaces: 2 });
    
    // Also create markdown report
    const mdPath = exportPath.replace('.json', '.md');
    const mdContent = this.reportToMarkdown(report);
    await fs.writeFile(mdPath, mdContent);
    
    return { json: exportPath, markdown: mdPath };
  }

  /**
   * Convert report to Markdown
   */
  reportToMarkdown(report) {
    let md = `# File System Report\n\n`;
    md += `Generated: ${report.generatedAt}\n`;
    md += `Path: \`${report.path}\`\n\n`;
    
    md += `## Summary\n\n`;
    md += `- **Total Files:** ${report.summary.totalFiles}\n`;
    md += `- **Total Directories:** ${report.summary.totalDirectories}\n`;
    md += `- **Total Size:** ${report.summary.totalSize}\n\n`;
    
    md += `### By Category\n\n`;
    md += `| Category | Count | Size |\n|----------|-------|------|\n`;
    for (const cat of report.summary.byCategory) {
      md += `| ${cat.category} | ${cat.count} | ${cat.size} |\n`;
    }
    md += '\n';
    
    if (report.largestFiles.length > 0) {
      md += `## Largest Files\n\n`;
      for (const file of report.largestFiles.slice(0, 10)) {
        md += `- ${file.name} (${file.size})\n`;
      }
      md += '\n';
    }
    
    if (report.videosNeedingTranscription.length > 0) {
      md += `## Videos Needing Transcription\n\n`;
      for (const video of report.videosNeedingTranscription) {
        md += `- ${video.name} (${video.size})\n`;
      }
      md += '\n';
    }
    
    if (report.duplicates.length > 0) {
      md += `## Duplicate Files\n\n`;
      for (const dup of report.duplicates) {
        md += `### ${dup.size}\n`;
        for (const file of dup.files) {
          md += `- \`${file}\`\n`;
        }
        md += '\n';
      }
    }
    
    md += `## Directory Structure\n\n\`\`\`\n${report.tree}\`\`\`\n`;
    
    return md;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default FileSystemScanner;
