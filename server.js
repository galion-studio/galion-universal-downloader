/**
 * RUNPOD UNIVERSAL DOWNLOADER - Master Server
 * Download EVERYTHING from ANY platform
 * Serverless-ready, modular, no rate limits on your infrastructure
 */

import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';

// Core modules
import { PlatformManager } from './src/core/PlatformManager.js';
import { ApiKeyManager } from './src/core/ApiKeyManager.js';
import { UniversalDownloader } from './src/core/UniversalDownloader.js';
import { TranscriptionService } from './src/core/TranscriptionService.js';
import { FileSystemScanner } from './src/core/FileSystemScanner.js';
import { PDFService } from './src/core/PDFService.js';
import { EmailService } from './src/core/EmailService.js';

// Platform modules
import { registerAllPlatforms } from './src/platforms/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for WebSocket support
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Global instances
let platformManager = null;
let apiKeyManager = null;
let downloader = null;

// Active WebSocket connections
const wsClients = new Set();

/**
 * Initialize all systems
 */
async function initializeSystems() {
  console.log('🚀 Initializing RunPod Universal Downloader...');
  
  // Initialize API Key Manager
  apiKeyManager = new ApiKeyManager();
  await apiKeyManager.init();
  
  // Initialize Platform Manager
  platformManager = new PlatformManager();
  await registerAllPlatforms(platformManager);
  
  // Load saved API keys into platforms
  for (const [platformId] of platformManager.platforms) {
    const key = apiKeyManager.getKey(platformId);
    if (key) {
      platformManager.setApiKey(platformId, key);
    }
  }
  
  // Initialize Universal Downloader
  downloader = new UniversalDownloader({
    downloadDir: path.join(process.cwd(), 'downloads'),
    concurrent: 5
  });
  
  console.log('✓ All systems initialized');
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket connection handling
wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log('WebSocket client connected');
  
  ws.on('close', () => {
    wsClients.delete(ws);
  });
});

/**
 * Broadcast message to all connected clients
 */
function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of wsClients) {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  }
}

// ==============================
// API ENDPOINTS
// ==============================

/**
 * Get system status and available platforms
 */
app.get('/api/status', async (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    platforms: platformManager.getRegisteredPlatforms(),
    downloads: downloader.getStats(),
    configuredKeys: apiKeyManager.getConfiguredPlatforms()
  });
});

/**
 * Get all platforms info
 */
app.get('/api/platforms', (req, res) => {
  res.json(platformManager.getRegisteredPlatforms());
});

/**
 * Parse URL and detect platform/content type
 */
app.post('/api/parse', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const parsed = await platformManager.parseUrl(url);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Universal download endpoint
 */
app.post('/api/download', async (req, res) => {
  const { 
    url, 
    options = {},
    downloadFiles = true 
  } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Set headers for streaming response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  const sendProgress = (data) => {
    res.write(JSON.stringify({ type: 'progress', ...data }) + '\n');
    broadcast({ type: 'progress', url, ...data });
  };
  
  const sendComplete = (result) => {
    res.write(JSON.stringify({ type: 'complete', result }) + '\n');
    broadcast({ type: 'complete', url, result });
    res.end();
  };
  
  const sendError = (message) => {
    res.write(JSON.stringify({ type: 'error', message }) + '\n');
    broadcast({ type: 'error', url, message });
    res.end();
  };
  
  try {
    sendProgress({ status: 'Detecting platform...', progress: 5 });
    
    // Parse URL first
    const parsed = await platformManager.parseUrl(url);
    sendProgress({ 
      status: `Detected: ${parsed.platformId} - ${parsed.contentType}`, 
      progress: 10,
      platform: parsed.platformId,
      contentType: parsed.contentType
    });
    
    // Download content info
    sendProgress({ status: 'Fetching content...', progress: 20 });
    
    const result = await platformManager.download(url, {
      ...options,
      onProgress: (p) => {
        sendProgress({
          status: p.status || 'Downloading...',
          progress: 20 + (p.progress || 0) * 0.6,
          ...p
        });
      }
    });
    
    if (!result.success) {
      return sendError(result.error || 'Download failed');
    }
    
    // If we have files to download and downloadFiles is true
    if (downloadFiles && result.files && result.files.length > 0) {
      sendProgress({ status: 'Downloading files...', progress: 80 });
      
      const fileResults = await downloader.downloadFiles(
        result.files.map(f => f.downloadUrl || f.url || f.src),
        {
          destDir: result.outputDir,
          onProgress: (p) => {
            sendProgress({
              status: `Downloading: ${p.filename}`,
              progress: 80 + (p.overallProgress || 0) * 0.15
            });
          }
        }
      );
      
      result.downloadedFiles = fileResults;
    }
    
    // Also download images if present
    if (downloadFiles && result.images && result.images.length > 0) {
      sendProgress({ status: 'Downloading images...', progress: 90 });
      
      const imagesDir = path.join(result.outputDir, 'images');
      await fs.ensureDir(imagesDir);
      
      const imageUrls = result.images.map(i => i.url || i.src);
      const imageResults = await downloader.downloadFiles(imageUrls, {
        destDir: imagesDir,
        onProgress: (p) => {
          sendProgress({
            status: `Downloading image: ${p.filename}`,
            progress: 90 + (p.overallProgress || 0) * 0.08
          });
        }
      });
      
      result.downloadedImages = imageResults;
    }
    
    sendProgress({ status: 'Complete!', progress: 100 });
    sendComplete(result);
    
  } catch (error) {
    console.error('Download error:', error);
    sendError(error.message);
  }
});

/**
 * Download gallery/batch content
 */
app.post('/api/download/gallery', async (req, res) => {
  const { url, options = {} } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const result = await platformManager.downloadGallery(url, {
      ...options,
      onProgress: (p) => broadcast({ type: 'progress', url, ...p })
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download profile content
 */
app.post('/api/download/profile', async (req, res) => {
  const { url, options = {} } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const result = await platformManager.downloadProfile(url, {
      ...options,
      onProgress: (p) => broadcast({ type: 'progress', url, ...p })
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Direct file download
 */
app.post('/api/download/file', async (req, res) => {
  const { url, filename } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const result = await downloader.downloadFile(url, {
      filename,
      onProgress: (p) => broadcast({ type: 'progress', url, ...p })
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Batch download multiple URLs
 */
app.post('/api/download/batch', async (req, res) => {
  const { urls, options = {} } = req.body;
  
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'URLs array is required' });
  }
  
  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    broadcast({ 
      type: 'batch-progress', 
      current: i + 1, 
      total: urls.length, 
      url 
    });
    
    try {
      const result = await platformManager.download(url, options);
      results.push({ url, success: true, ...result });
    } catch (error) {
      results.push({ url, success: false, error: error.message });
    }
  }
  
  res.json({ results, success: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length });
});

// ==============================
// API KEY MANAGEMENT
// ==============================

/**
 * Set API key for a platform
 */
app.post('/api/keys/:platform', async (req, res) => {
  const { platform } = req.params;
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }
  
  try {
    // Validate key first
    const validation = await platformManager.validateApiKey(platform, apiKey);
    
    if (validation.valid) {
      // Save key
      await apiKeyManager.setKey(platform, apiKey);
      platformManager.setApiKey(platform, apiKey);
      res.json({ success: true, message: 'API key saved', ...validation });
    } else {
      res.status(400).json({ success: false, error: validation.error || 'Invalid API key' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete API key for a platform
 */
app.delete('/api/keys/:platform', async (req, res) => {
  const { platform } = req.params;
  
  await apiKeyManager.deleteKey(platform);
  res.json({ success: true });
});

/**
 * Get all configured API keys (masked)
 */
app.get('/api/keys', (req, res) => {
  res.json(apiKeyManager.getConfiguredPlatforms());
});

/**
 * Verify API key for a platform
 */
app.post('/api/keys/:platform/verify', async (req, res) => {
  const { platform } = req.params;
  const { apiKey } = req.body;
  
  const key = apiKey || apiKeyManager.getKey(platform);
  if (!key) {
    return res.status(400).json({ valid: false, error: 'No API key provided' });
  }
  
  const result = await platformManager.validateApiKey(platform, key);
  res.json(result);
});

// ==============================
// FILE MANAGEMENT
// ==============================

/**
 * Open folder in system file explorer
 */
app.post('/api/open-folder', (req, res) => {
  const { path: folderPath } = req.body;
  
  if (!folderPath || !fs.existsSync(folderPath)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  
  const command = process.platform === 'win32' 
    ? `explorer "${folderPath}"`
    : process.platform === 'darwin'
    ? `open "${folderPath}"`
    : `xdg-open "${folderPath}"`;
  
  exec(command, (error) => {
    if (error) {
      return res.status(500).json({ error: 'Could not open folder' });
    }
    res.json({ success: true });
  });
});

/**
 * Download as ZIP
 */
app.post('/api/download-zip', async (req, res) => {
  const { path: folderPath } = req.body;
  
  if (!folderPath || !fs.existsSync(folderPath)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  
  const folderName = path.basename(folderPath);
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);
  
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.directory(folderPath, folderName);
  archive.finalize();
});

/**
 * Get download history
 */
app.get('/api/history', async (req, res) => {
  const downloadsDir = path.join(__dirname, 'downloads');
  
  if (!fs.existsSync(downloadsDir)) {
    return res.json([]);
  }
  
  const folders = await fs.readdir(downloadsDir);
  const history = [];
  
  for (const folder of folders) {
    const folderPath = path.join(downloadsDir, folder);
    const stat = await fs.stat(folderPath);
    
    if (stat.isDirectory()) {
      // Try to find metadata
      const metadataFiles = ['metadata.json', 'model_info.json', 'repo_info.json', 'profile.json', 'gallery.json'];
      let metadata = null;
      
      for (const metaFile of metadataFiles) {
        const metaPath = path.join(folderPath, metaFile);
        if (fs.existsSync(metaPath)) {
          try {
            metadata = await fs.readJson(metaPath);
            break;
          } catch (e) {}
        }
      }
      
      history.push({
        folder,
        path: folderPath,
        createdAt: stat.birthtime,
        size: await calculateFolderSize(folderPath),
        metadata
      });
    }
  }
  
  // Sort by date
  history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(history);
});

/**
 * Delete download
 */
app.delete('/api/history/:folder', async (req, res) => {
  const { folder } = req.params;
  const folderPath = path.join(__dirname, 'downloads', folder);
  
  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: 'Folder not found' });
  }
  
  await fs.remove(folderPath);
  res.json({ success: true });
});

/**
 * Get download stats
 */
app.get('/api/stats', (req, res) => {
  res.json(downloader.getStats());
});

/**
 * Clear download history (tracking only)
 */
app.post('/api/stats/clear', (req, res) => {
  downloader.clearHistory();
  res.json({ success: true });
});

// ==============================
// TRANSCRIPTION ENDPOINTS
// ==============================

const transcriptionService = new TranscriptionService();

/**
 * Check if transcription is available (Whisper installed)
 */
app.get('/api/transcribe/status', async (req, res) => {
  const status = await transcriptionService.checkWhisperInstalled();
  res.json({
    ...status,
    installInstructions: transcriptionService.getInstallInstructions()
  });
});

/**
 * Transcribe a video/audio file
 */
app.post('/api/transcribe', async (req, res) => {
  const { filePath, language, model, formats } = req.body;
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'Valid file path required' });
  }
  
  try {
    const result = await transcriptionService.transcribe(filePath, {
      language,
      model,
      formats,
      onProgress: (p) => broadcast({ type: 'transcription-progress', filePath, ...p })
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Batch transcribe files in a directory
 */
app.post('/api/transcribe/batch', async (req, res) => {
  const { dirPath, language, model } = req.body;
  
  if (!dirPath || !fs.existsSync(dirPath)) {
    return res.status(400).json({ error: 'Valid directory path required' });
  }
  
  try {
    const scanner = new FileSystemScanner();
    const videos = await scanner.findVideosNeedingTranscription(dirPath);
    
    if (videos.length === 0) {
      return res.json({ success: true, message: 'No videos needing transcription', results: [] });
    }
    
    const result = await transcriptionService.batchTranscribe(
      videos.map(v => v.path),
      {
        language,
        model,
        onProgress: (p) => broadcast({ type: 'transcription-batch-progress', ...p })
      }
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Convert subtitle format
 */
app.post('/api/transcribe/convert', async (req, res) => {
  const { inputPath, outputFormat } = req.body;
  
  if (!inputPath || !fs.existsSync(inputPath)) {
    return res.status(400).json({ error: 'Valid file path required' });
  }
  
  try {
    const outputPath = await transcriptionService.convertSubtitle(inputPath, outputFormat);
    res.json({ success: true, outputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// DEVELOPER TOOLS / FILE SCANNER
// ==============================

const fileScanner = new FileSystemScanner();

/**
 * Scan directory and get file statistics
 */
app.post('/api/scan', async (req, res) => {
  const { dirPath, includeHashes } = req.body;
  const targetPath = dirPath || path.join(__dirname, 'downloads');
  
  if (!fs.existsSync(targetPath)) {
    return res.status(400).json({ error: 'Directory not found' });
  }
  
  try {
    const result = await fileScanner.scanDirectory(targetPath, { 
      includeHashes,
      onProgress: (p) => broadcast({ type: 'scan-progress', ...p })
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Find files by pattern
 */
app.post('/api/scan/find', async (req, res) => {
  const { dirPath, pattern, maxResults } = req.body;
  const targetPath = dirPath || path.join(__dirname, 'downloads');
  
  if (!fs.existsSync(targetPath)) {
    return res.status(400).json({ error: 'Directory not found' });
  }
  
  try {
    const results = await fileScanner.findFiles(targetPath, pattern, { maxResults });
    res.json({ results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Find media files
 */
app.get('/api/scan/media', async (req, res) => {
  const dirPath = req.query.path || path.join(__dirname, 'downloads');
  
  try {
    const results = await fileScanner.findMediaFiles(dirPath);
    res.json({ 
      results, 
      total: results.length,
      videos: results.filter(f => f.category === 'video').length,
      audio: results.filter(f => f.category === 'audio').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Find AI model files
 */
app.get('/api/scan/models', async (req, res) => {
  const dirPath = req.query.path || path.join(__dirname, 'downloads');
  
  try {
    const results = await fileScanner.findModelFiles(dirPath);
    res.json({ results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Find videos needing transcription
 */
app.get('/api/scan/needs-transcription', async (req, res) => {
  const dirPath = req.query.path || path.join(__dirname, 'downloads');
  
  try {
    const results = await fileScanner.findVideosNeedingTranscription(dirPath);
    res.json({ results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate directory tree
 */
app.post('/api/scan/tree', async (req, res) => {
  const { dirPath, maxDepth, showFiles, showSize } = req.body;
  const targetPath = dirPath || path.join(__dirname, 'downloads');
  
  try {
    const tree = await fileScanner.generateTree(targetPath, { maxDepth, showFiles, showSize });
    res.json({ tree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate full report
 */
app.post('/api/scan/report', async (req, res) => {
  const { dirPath, export: shouldExport } = req.body;
  const targetPath = dirPath || path.join(__dirname, 'downloads');
  
  try {
    const report = await fileScanner.generateReport(targetPath);
    
    if (shouldExport) {
      const exportResult = await fileScanner.exportReport(targetPath);
      report.exportedFiles = exportResult;
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get file info
 */
app.post('/api/file/info', async (req, res) => {
  const { filePath } = req.body;
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'File not found' });
  }
  
  try {
    const info = await fileScanner.getFileInfo(filePath);
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get file hash
 */
app.post('/api/file/hash', async (req, res) => {
  const { filePath, algorithm } = req.body;
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'File not found' });
  }
  
  try {
    const hash = await fileScanner.getFileHash(filePath, algorithm || 'sha256');
    res.json({ hash, algorithm: algorithm || 'sha256' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// PDF & TEMPLATE ENDPOINTS
// ==============================

const pdfService = new PDFService();
pdfService.initialize().catch(console.error);

/**
 * Get available templates
 */
app.get('/api/templates', async (req, res) => {
  try {
    const templates = await pdfService.listTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate research paper template
 */
app.post('/api/templates/research', async (req, res) => {
  const { title, author, abstract, sections, references, style, theme } = req.body;
  
  try {
    const html = pdfService.generateResearchTemplate({
      title, author, abstract, sections, references, style, theme
    });
    res.json({ success: true, html });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate visual template (poster, infographic, slides)
 */
app.post('/api/templates/visual', async (req, res) => {
  const { type, title, subtitle, sections, theme } = req.body;
  
  try {
    const result = await pdfService.generateVisualTemplate({
      type, title, subtitle, sections, theme
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create editable document content
 */
app.post('/api/templates/editable', (req, res) => {
  const { content, fonts, images } = req.body;
  
  try {
    const editableContent = pdfService.createEditableContent({ content, fonts, images });
    res.json({ success: true, ...editableContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// EMAIL SCANNER ENDPOINTS
// ==============================

const emailService = new EmailService();
emailService.initialize().catch(console.error);

/**
 * Get supported email providers
 */
app.get('/api/email/providers', (req, res) => {
  res.json(emailService.getProviders());
});

/**
 * Detect email provider from address
 */
app.post('/api/email/detect', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address required' });
  }
  
  const provider = emailService.detectProvider(email);
  const guide = emailService.getConnectionGuide(provider);
  
  res.json({ email, provider, ...guide });
});

/**
 * Get connection guide for a provider
 */
app.get('/api/email/guide/:provider', (req, res) => {
  const { provider } = req.params;
  const guide = emailService.getConnectionGuide(provider);
  res.json({ provider, ...guide });
});

/**
 * Create IMAP configuration
 */
app.post('/api/email/config', (req, res) => {
  const { provider, email, password, customSettings } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const config = emailService.createImapConfig(
    provider || emailService.detectProvider(email),
    email,
    password,
    customSettings
  );
  
  // Don't return the password in the response
  res.json({ 
    success: true, 
    config: { ...config, password: '***' },
    message: 'Configuration created - install imapflow to connect'
  });
});

/**
 * Get folder structure (simulated)
 */
app.get('/api/email/folders', async (req, res) => {
  try {
    const folders = await emailService.scanFolders();
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search emails
 */
app.post('/api/email/search', async (req, res) => {
  try {
    const result = await emailService.searchEmails(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Extract attachments config
 */
app.post('/api/email/attachments', async (req, res) => {
  try {
    const result = await emailService.extractAttachments(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export emails config
 */
app.post('/api/email/export', async (req, res) => {
  try {
    const result = await emailService.exportEmails(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Backup mailbox config
 */
app.post('/api/email/backup', async (req, res) => {
  try {
    const result = await emailService.backupMailbox(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze email patterns
 */
app.post('/api/email/analyze', async (req, res) => {
  try {
    const result = await emailService.analyzePatterns(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get required packages for email
 */
app.get('/api/email/packages', (req, res) => {
  res.json(emailService.getRequiredPackages());
});

/**
 * Get sample code for IMAP connection
 */
app.get('/api/email/sample-code', (req, res) => {
  res.json({ 
    code: emailService.getSampleCode(),
    language: 'javascript'
  });
});

/**
 * Get supported formats info
 */
app.get('/api/formats', (req, res) => {
  res.json({
    video: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp', '.ts'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.raw', '.psd'],
    model: ['.safetensors', '.ckpt', '.pt', '.pth', '.bin', '.onnx', '.h5', '.pkl'],
    subtitle: ['.srt', '.vtt', '.ass', '.ssa', '.sub'],
    document: ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf'],
    archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    code: ['.js', '.ts', '.py', '.java', '.cpp', '.html', '.css', '.json'],
    videoCodecs: ['h264', 'h265', 'hevc', 'vp8', 'vp9', 'av1', 'mpeg4', 'xvid'],
    audioCodecs: ['aac', 'mp3', 'opus', 'vorbis', 'flac', 'alac', 'pcm', 'ac3', 'dts'],
    containers: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'ts', 'ogg']
  });
});

// ==============================
// UTILITY FUNCTIONS
// ==============================

async function calculateFolderSize(folderPath) {
  let size = 0;
  const files = await fs.readdir(folderPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(folderPath, file.name);
    if (file.isDirectory()) {
      size += await calculateFolderSize(filePath);
    } else {
      const stat = await fs.stat(filePath);
      size += stat.size;
    }
  }
  
  return size;
}

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==============================
// START SERVER
// ==============================

async function start() {
  await initializeSystems();
  
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   🚀 RUNPOD UNIVERSAL DOWNLOADER v2.0                               ║
║   ═══════════════════════════════════                               ║
║                                                                      ║
║   Server running at: http://localhost:${PORT}                          ║
║                                                                      ║
║   ✓ Download from ANY platform                                      ║
║   ✓ CivitAI, GitHub, YouTube, Telegram, and more                   ║
║   ✓ Models, Images, Videos, Profiles, Galleries                    ║
║   ✓ No rate limits (your own infrastructure)                       ║
║   ✓ Serverless deployment ready                                    ║
║                                                                      ║
║   📖 Open this URL in your browser to start downloading!           ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);

export default app;
