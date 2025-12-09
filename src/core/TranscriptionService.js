/**
 * TranscriptionService - Automatic Video/Audio Transcription
 * Uses faster-whisper with tiny.en model as default (English mini model)
 * Automatic model download from HuggingFace/GitHub
 * 
 * Supported backends:
 * - faster-whisper (recommended - 4x faster than OpenAI)
 * - whisper.cpp (C++ native)
 * - OpenAI Whisper (original)
 */

import fs from 'fs-extra';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http';

const execAsync = promisify(exec);

// Default model for quick English transcription
const DEFAULT_MODEL = 'tiny.en';

// Model download URLs from HuggingFace
const MODEL_URLS = {
  'tiny.en': 'https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/',
  'tiny': 'https://huggingface.co/Systran/faster-whisper-tiny/resolve/main/',
  'base.en': 'https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/',
  'base': 'https://huggingface.co/Systran/faster-whisper-base/resolve/main/',
  'small.en': 'https://huggingface.co/Systran/faster-whisper-small.en/resolve/main/',
  'small': 'https://huggingface.co/Systran/faster-whisper-small/resolve/main/',
  'medium.en': 'https://huggingface.co/Systran/faster-whisper-medium.en/resolve/main/',
  'medium': 'https://huggingface.co/Systran/faster-whisper-medium/resolve/main/',
  'large-v2': 'https://huggingface.co/Systran/faster-whisper-large-v2/resolve/main/',
  'large-v3': 'https://huggingface.co/Systran/faster-whisper-large-v3/resolve/main/'
};

// Model file structure for faster-whisper
const MODEL_FILES = [
  'config.json',
  'model.bin',
  'tokenizer.json',
  'vocabulary.txt'
];

// Whisper models info
const WHISPER_MODELS = {
  'tiny': { size: '75MB', params: '39M', speed: 'fastest', quality: 'basic', vram: '~1GB' },
  'tiny.en': { size: '75MB', params: '39M', speed: 'fastest', quality: 'basic', english_only: true, vram: '~1GB', recommended: true },
  'base': { size: '142MB', params: '74M', speed: 'fast', quality: 'good', vram: '~1GB' },
  'base.en': { size: '142MB', params: '74M', speed: 'fast', quality: 'good', english_only: true, vram: '~1GB' },
  'small': { size: '466MB', params: '244M', speed: 'medium', quality: 'better', vram: '~2GB' },
  'small.en': { size: '466MB', params: '244M', speed: 'medium', quality: 'better', english_only: true, vram: '~2GB' },
  'medium': { size: '1.5GB', params: '769M', speed: 'slow', quality: 'great', vram: '~5GB' },
  'medium.en': { size: '1.5GB', params: '769M', speed: 'slow', quality: 'great', english_only: true, vram: '~5GB' },
  'large-v2': { size: '2.9GB', params: '1550M', speed: 'slowest', quality: 'best', vram: '~10GB' },
  'large-v3': { size: '2.9GB', params: '1550M', speed: 'slowest', quality: 'best', vram: '~10GB' }
};

// Supported formats
const SUPPORTED_VIDEO = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp', '.ts'];
const SUPPORTED_AUDIO = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff'];

export class TranscriptionService {
  constructor(options = {}) {
    this.model = options.model || DEFAULT_MODEL;
    this.language = options.language || 'en';
    this.device = options.device || 'auto'; // auto, cpu, cuda
    this.outputFormats = options.outputFormats || ['srt', 'vtt', 'txt', 'json'];
    this.threads = options.threads || 4;
    this.modelsDir = options.modelsDir || path.join(process.cwd(), 'models', 'whisper');
    this.backend = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the transcription service
   * Auto-detects backend and downloads model if needed
   */
  async initialize() {
    console.log('🎤 Initializing Transcription Service...');
    
    // Detect available backend
    this.backend = await this.detectBackend();
    
    if (!this.backend) {
      console.log('⚠️ No Whisper backend found. Will provide installation guide.');
      return { initialized: false, backend: null, needsInstall: true };
    }
    
    console.log(`✓ Using backend: ${this.backend.type}`);
    
    // Check/download model
    const modelReady = await this.ensureModelReady(this.model);
    
    this.isInitialized = modelReady;
    
    return {
      initialized: this.isInitialized,
      backend: this.backend,
      model: this.model,
      modelReady
    };
  }

  /**
   * Detect available Whisper backend
   */
  async detectBackend() {
    const backends = [
      { type: 'faster-whisper', cmd: 'faster-whisper', args: '--help', speed: 4, recommended: true },
      { type: 'whisper-ctranslate2', cmd: 'whisper-ctranslate2', args: '--help', speed: 3 },
      { type: 'insanely-fast-whisper', cmd: 'insanely-fast-whisper', args: '--help', speed: 5 },
      { type: 'whisper-cpp', cmd: 'whisper-cpp', args: '--help', speed: 2 },
      { type: 'openai-whisper', cmd: 'whisper', args: '--help', speed: 1 }
    ];

    for (const backend of backends) {
      try {
        await execAsync(`${backend.cmd} ${backend.args}`, { timeout: 10000 });
        return backend;
      } catch {
        // Try next backend
      }
    }

    // Check for Python with faster-whisper module
    try {
      await execAsync('python -c "import faster_whisper; print(\'ok\')"', { timeout: 10000 });
      return { type: 'faster-whisper-python', cmd: 'python', speed: 4, usePython: true };
    } catch {}

    return null;
  }

  /**
   * Ensure model is downloaded and ready
   */
  async ensureModelReady(modelName) {
    const modelPath = path.join(this.modelsDir, modelName);
    
    // Check if model exists
    if (await fs.pathExists(modelPath)) {
      const configPath = path.join(modelPath, 'config.json');
      if (await fs.pathExists(configPath)) {
        console.log(`✓ Model ${modelName} ready at ${modelPath}`);
        return true;
      }
    }

    // Try to download model
    console.log(`📥 Model ${modelName} not found. Attempting download...`);
    
    try {
      await this.downloadModel(modelName);
      return true;
    } catch (error) {
      console.log(`⚠️ Could not auto-download model: ${error.message}`);
      console.log('The model will be downloaded on first use by the backend.');
      return true; // Still return true - backend will handle download
    }
  }

  /**
   * Download model from HuggingFace
   */
  async downloadModel(modelName, onProgress = () => {}) {
    const baseUrl = MODEL_URLS[modelName];
    if (!baseUrl) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const modelPath = path.join(this.modelsDir, modelName);
    await fs.ensureDir(modelPath);

    console.log(`📥 Downloading ${modelName} model to ${modelPath}...`);
    onProgress({ status: 'starting', model: modelName });

    for (const file of MODEL_FILES) {
      const fileUrl = baseUrl + file;
      const filePath = path.join(modelPath, file);
      
      onProgress({ status: 'downloading', file, model: modelName });
      
      try {
        await this.downloadFile(fileUrl, filePath);
        console.log(`  ✓ ${file}`);
      } catch (error) {
        console.log(`  ⚠️ ${file} - ${error.message}`);
        // Some files may be optional
      }
    }

    onProgress({ status: 'complete', model: modelName });
    console.log(`✓ Model ${modelName} downloaded`);
    return modelPath;
  }

  /**
   * Download a file from URL
   */
  downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, { 
        headers: { 'User-Agent': 'Galion-Universal-Downloader/2.0' }
      }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          this.downloadFile(response.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(dest);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
  }

  /**
   * Check if file is supported for transcription
   */
  isSupported(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_VIDEO.includes(ext) || SUPPORTED_AUDIO.includes(ext);
  }

  /**
   * Get system status
   */
  async getStatus() {
    const backend = await this.detectBackend();
    const ffmpegInstalled = await this.checkFFmpeg();
    
    return {
      backend: backend ? backend.type : null,
      backendInstalled: !!backend,
      ffmpegInstalled,
      defaultModel: DEFAULT_MODEL,
      currentModel: this.model,
      modelsDir: this.modelsDir,
      availableModels: Object.keys(WHISPER_MODELS),
      supportedFormats: {
        video: SUPPORTED_VIDEO,
        audio: SUPPORTED_AUDIO
      },
      installInstructions: this.getInstallInstructions()
    };
  }

  /**
   * Check if FFmpeg is installed
   */
  async checkFFmpeg() {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available models info
   */
  getAvailableModels() {
    return WHISPER_MODELS;
  }

  /**
   * Get installation instructions
   */
  getInstallInstructions() {
    return {
      quickStart: `
# Quick Start - Install faster-whisper (recommended)
pip install faster-whisper

# Or use pipx for isolated install
pipx install faster-whisper

# Install FFmpeg (required for video processing)
# Windows: winget install ffmpeg
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
      `.trim(),
      
      windows: `
# Option 1: Install faster-whisper (Python required)
pip install faster-whisper

# Option 2: Install via Scoop
scoop install ffmpeg
pip install faster-whisper

# Option 3: Use pre-built binary
# Download from: https://github.com/Purfview/whisper-standalone-win/releases
      `.trim(),
      
      mac: `
# Install with Homebrew
brew install ffmpeg
pip3 install faster-whisper

# For Apple Silicon (M1/M2) GPU acceleration
pip3 install faster-whisper[cpu]
      `.trim(),
      
      linux: `
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg python3-pip
pip3 install faster-whisper

# Fedora
sudo dnf install ffmpeg python3-pip
pip3 install faster-whisper

# For NVIDIA GPU support
pip3 install faster-whisper[gpu]
      `.trim(),
      
      docker: `
# Use our pre-built Docker image with faster-whisper
docker pull galion/transcription:latest

# Or use standalone Whisper container
docker run --gpus all -v /data:/data \\
  onerahmet/openai-whisper-asr-webservice:latest
      `.trim()
    };
  }

  /**
   * Extract audio from video file (required before transcription)
   */
  async extractAudio(videoPath, outputPath = null) {
    const ext = path.extname(videoPath).toLowerCase();
    
    // Already audio file
    if (SUPPORTED_AUDIO.includes(ext)) {
      return videoPath;
    }

    const audioPath = outputPath || videoPath.replace(ext, '.wav');

    try {
      // Use FFmpeg to extract audio as 16kHz mono WAV (optimal for Whisper)
      await execAsync(
        `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}" -y`,
        { maxBuffer: 100 * 1024 * 1024 }
      );
      return audioPath;
    } catch (error) {
      throw new Error(`FFmpeg audio extraction failed: ${error.message}`);
    }
  }

  /**
   * Main transcription method
   */
  async transcribe(filePath, options = {}) {
    const {
      outputDir = path.dirname(filePath),
      language = this.language,
      model = this.model,
      formats = this.outputFormats,
      onProgress = () => {}
    } = options;

    const baseName = path.basename(filePath, path.extname(filePath));
    const results = { outputFiles: [], sourceFile: filePath };

    onProgress({ status: 'Initializing...', progress: 5 });

    // Ensure backend is available
    if (!this.backend) {
      this.backend = await this.detectBackend();
    }

    if (!this.backend) {
      onProgress({ status: 'No Whisper backend found', progress: 100 });
      return this.createFallbackOutput(filePath, outputDir, baseName);
    }

    onProgress({ status: 'Preparing audio...', progress: 10 });

    // Extract audio if video
    let audioPath = filePath;
    let tempAudio = false;
    
    if (SUPPORTED_VIDEO.includes(path.extname(filePath).toLowerCase())) {
      const tempDir = path.join(outputDir, '.temp');
      await fs.ensureDir(tempDir);
      audioPath = path.join(tempDir, `${baseName}.wav`);
      await this.extractAudio(filePath, audioPath);
      tempAudio = true;
    }

    onProgress({ status: `Transcribing with ${this.backend.type}...`, progress: 20 });

    try {
      // Run transcription based on backend
      const transcription = await this.runTranscription(audioPath, {
        language,
        model,
        outputDir,
        baseName,
        onProgress
      });

      // Generate output files
      onProgress({ status: 'Generating output files...', progress: 85 });
      
      for (const format of formats) {
        const outputPath = path.join(outputDir, `${baseName}.${format}`);
        await this.saveTranscription(transcription, outputPath, format);
        results.outputFiles.push(outputPath);
      }

      // Cleanup temp audio
      if (tempAudio) {
        await fs.remove(path.dirname(audioPath));
      }

      onProgress({ status: 'Complete!', progress: 100 });

      return {
        success: true,
        ...results,
        transcription,
        language,
        model,
        backend: this.backend.type
      };

    } catch (error) {
      // Cleanup on error
      if (tempAudio && await fs.pathExists(audioPath)) {
        await fs.remove(path.dirname(audioPath));
      }
      throw error;
    }
  }

  /**
   * Run transcription with detected backend
   */
  async runTranscription(audioPath, options) {
    const { language, model, outputDir, baseName, onProgress } = options;

    if (this.backend.usePython) {
      // Use Python faster-whisper module directly
      return this.runPythonTranscription(audioPath, options);
    }

    // Build command based on backend type
    let cmd;
    const modelPath = path.join(this.modelsDir, model);
    
    switch (this.backend.type) {
      case 'faster-whisper':
        cmd = `faster-whisper "${audioPath}" --model ${model} --language ${language} --output_dir "${outputDir}" --output_format all`;
        break;
      
      case 'whisper-ctranslate2':
        cmd = `whisper-ctranslate2 "${audioPath}" --model ${model} --language ${language} --output_dir "${outputDir}"`;
        break;
      
      case 'insanely-fast-whisper':
        cmd = `insanely-fast-whisper --file-name "${audioPath}" --model-name openai/whisper-${model} --language ${language}`;
        break;
      
      case 'whisper-cpp':
        cmd = `whisper-cpp -m "${modelPath}/ggml-model.bin" -f "${audioPath}" -l ${language}`;
        break;
      
      case 'openai-whisper':
      default:
        cmd = `whisper "${audioPath}" --model ${model} --language ${language} --output_dir "${outputDir}" --output_format all`;
    }

    onProgress({ status: `Running: ${this.backend.type}`, progress: 40 });

    try {
      const { stdout, stderr } = await execAsync(cmd, { 
        maxBuffer: 100 * 1024 * 1024,
        timeout: 30 * 60 * 1000 // 30 minute timeout
      });
      
      // Parse output for transcription
      return this.parseTranscriptionOutput(stdout, stderr, outputDir, baseName);
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Run transcription using Python faster-whisper module
   */
  async runPythonTranscription(audioPath, options) {
    const { language, model } = options;
    
    const pythonScript = `
import sys
import json
from faster_whisper import WhisperModel

model = WhisperModel("${model}", device="auto", compute_type="auto")
segments, info = model.transcribe("${audioPath.replace(/\\/g, '/')}", language="${language}")

result = {
    "language": info.language,
    "language_probability": info.language_probability,
    "segments": []
}

for segment in segments:
    result["segments"].append({
        "start": segment.start,
        "end": segment.end,
        "text": segment.text.strip()
    })

print(json.dumps(result))
    `.trim();

    const { stdout } = await execAsync(`python -c "${pythonScript}"`, {
      maxBuffer: 100 * 1024 * 1024
    });

    return JSON.parse(stdout);
  }

  /**
   * Parse transcription output from CLI
   */
  parseTranscriptionOutput(stdout, stderr, outputDir, baseName) {
    // Try to read generated files first
    const formats = ['json', 'srt', 'vtt', 'txt'];
    
    for (const format of formats) {
      const filePath = path.join(outputDir, `${baseName}.${format}`);
      if (fs.existsSync(filePath)) {
        if (format === 'json') {
          try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch {}
        }
        if (format === 'srt') {
          return this.parseSRT(fs.readFileSync(filePath, 'utf-8'));
        }
      }
    }

    // Parse from stdout if no files
    return { text: stdout.trim(), segments: [] };
  }

  /**
   * Parse SRT content into segments
   */
  parseSRT(content) {
    const segments = [];
    const blocks = content.trim().split(/\n\n+/);
    
    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const timeLine = lines[1];
        const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (match) {
          const start = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
          const end = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
          const text = lines.slice(2).join(' ').trim();
          segments.push({ start, end, text });
        }
      }
    }
    
    return { segments, text: segments.map(s => s.text).join(' ') };
  }

  /**
   * Save transcription to file
   */
  async saveTranscription(transcription, outputPath, format) {
    const segments = transcription.segments || [];
    let content;

    switch (format) {
      case 'srt':
        content = this.toSRT(segments);
        break;
      case 'vtt':
        content = this.toVTT(segments);
        break;
      case 'txt':
        content = transcription.text || segments.map(s => s.text).join('\n');
        break;
      case 'json':
        content = JSON.stringify(transcription, null, 2);
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    await fs.writeFile(outputPath, content, 'utf-8');
    return outputPath;
  }

  /**
   * Convert segments to SRT format
   */
  toSRT(segments) {
    return segments.map((s, i) => {
      const start = this.formatTime(s.start, ',');
      const end = this.formatTime(s.end, ',');
      return `${i + 1}\n${start} --> ${end}\n${s.text}\n`;
    }).join('\n');
  }

  /**
   * Convert segments to VTT format
   */
  toVTT(segments) {
    const content = segments.map(s => {
      const start = this.formatTime(s.start, '.');
      const end = this.formatTime(s.end, '.');
      return `${start} --> ${end}\n${s.text}\n`;
    }).join('\n');
    return `WEBVTT\n\n${content}`;
  }

  /**
   * Format seconds to timestamp
   */
  formatTime(seconds, msDelimiter = ',') {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.round((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s}${msDelimiter}${ms}`;
  }

  /**
   * Create fallback output when no backend available
   */
  async createFallbackOutput(filePath, outputDir, baseName) {
    const instructions = this.getInstallInstructions();
    
    const infoFile = path.join(outputDir, `${baseName}_transcription.json`);
    await fs.writeJson(infoFile, {
      status: 'pending',
      sourceFile: filePath,
      needsInstallation: true,
      instructions: instructions.quickStart,
      detailedInstructions: instructions,
      recommendedCommand: `pip install faster-whisper && faster-whisper "${filePath}" --model tiny.en`
    }, { spaces: 2 });

    return {
      success: false,
      needsInstallation: true,
      outputFiles: [infoFile],
      sourceFile: filePath,
      instructions
    };
  }

  /**
   * Batch transcribe multiple files
   */
  async batchTranscribe(filePaths, options = {}) {
    const { onProgress = () => {} } = options;
    const results = [];
    const total = filePaths.length;

    for (let i = 0; i < total; i++) {
      const file = filePaths[i];
      const progress = (i / total) * 100;

      onProgress({
        status: `Transcribing ${i + 1}/${total}: ${path.basename(file)}`,
        progress,
        current: i + 1,
        total
      });

      try {
        const result = await this.transcribe(file, {
          ...options,
          onProgress: (p) => {
            onProgress({
              ...p,
              current: i + 1,
              total,
              overallProgress: progress + (p.progress / 100) * (100 / total)
            });
          }
        });
        results.push({ file, ...result });
      } catch (error) {
        results.push({ file, success: false, error: error.message });
      }
    }

    return {
      success: true,
      total,
      completed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Convert between subtitle formats
   */
  async convertSubtitle(inputPath, outputFormat) {
    const content = await fs.readFile(inputPath, 'utf-8');
    const inputFormat = path.extname(inputPath).slice(1).toLowerCase();
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(path.dirname(inputPath), `${baseName}.${outputFormat}`);

    let converted;

    if (inputFormat === 'srt' && outputFormat === 'vtt') {
      converted = 'WEBVTT\n\n' + content
        .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4')
        .replace(/^\d+\s*$/gm, '');
    } else if (inputFormat === 'vtt' && outputFormat === 'srt') {
      converted = content
        .replace('WEBVTT\n', '')
        .replace(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/g, '$1:$2:$3,$4');
      // Add sequence numbers
      const blocks = converted.trim().split('\n\n');
      converted = blocks.map((block, i) => `${i + 1}\n${block}`).join('\n\n');
    } else {
      throw new Error(`Conversion from ${inputFormat} to ${outputFormat} not supported`);
    }

    await fs.writeFile(outputPath, converted);
    return outputPath;
  }
}

export default TranscriptionService;
