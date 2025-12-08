/**
 * TranscriptionService - Automatic Video/Audio Transcription
 * Generates SRT subtitles for all video formats
 * Inspired by Scriberr (https://scriberr.app)
 */

import fs from 'fs-extra';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Supported formats for transcription
const SUPPORTED_VIDEO_FORMATS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.m4v', '.mpeg', '.mpg', '.3gp', '.3g2', '.ts', '.mts', '.m2ts'
];

const SUPPORTED_AUDIO_FORMATS = [
  '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a',
  '.opus', '.aiff', '.ape', '.alac'
];

export class TranscriptionService {
  constructor(options = {}) {
    this.whisperPath = options.whisperPath || 'whisper';
    this.model = options.model || 'base'; // tiny, base, small, medium, large
    this.language = options.language || 'auto';
    this.device = options.device || 'cpu'; // cpu or cuda
    this.outputFormats = options.outputFormats || ['srt', 'vtt', 'txt', 'json'];
    this.threads = options.threads || 4;
  }

  /**
   * Check if file is supported for transcription
   */
  isSupported(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_VIDEO_FORMATS.includes(ext) || SUPPORTED_AUDIO_FORMATS.includes(ext);
  }

  /**
   * Check if Whisper is installed
   */
  async checkWhisperInstalled() {
    try {
      await execAsync('whisper --help');
      return { installed: true, type: 'openai-whisper' };
    } catch {
      try {
        await execAsync('whisper-cpp --help');
        return { installed: true, type: 'whisper-cpp' };
      } catch {
        return { installed: false, type: null };
      }
    }
  }

  /**
   * Get installation instructions
   */
  getInstallInstructions() {
    return {
      windows: `
# Install OpenAI Whisper (requires Python 3.8+)
pip install openai-whisper

# Or install Whisper.cpp (faster, no Python needed)
# Download from: https://github.com/ggerganov/whisper.cpp

# Install FFmpeg (required)
winget install ffmpeg
# or download from https://ffmpeg.org
      `,
      linux: `
# Install OpenAI Whisper
pip install openai-whisper

# Install FFmpeg
sudo apt install ffmpeg
      `,
      docker: `
# Use Scriberr Docker container
docker run -d -p 3050:3050 -v /path/to/data:/data ghcr.io/scriberr/scriberr:latest
      `
    };
  }

  /**
   * Extract audio from video file
   */
  async extractAudio(videoPath, outputPath = null) {
    const ext = path.extname(videoPath).toLowerCase();
    
    if (SUPPORTED_AUDIO_FORMATS.includes(ext)) {
      return videoPath; // Already audio
    }

    const audioPath = outputPath || videoPath.replace(ext, '.wav');

    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}" -y`
      );
      return audioPath;
    } catch (error) {
      throw new Error(`FFmpeg audio extraction failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio/video file
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

    onProgress({ status: 'Checking Whisper installation...', progress: 5 });

    const whisperCheck = await this.checkWhisperInstalled();
    
    if (!whisperCheck.installed) {
      // Fallback: Use built-in simple transcription or external API
      onProgress({ status: 'Whisper not installed. Using fallback method...', progress: 10 });
      return this.transcribeFallback(filePath, options);
    }

    onProgress({ status: 'Extracting audio...', progress: 15 });

    // Extract audio if video
    let audioPath = filePath;
    let tempAudio = false;
    
    if (SUPPORTED_VIDEO_FORMATS.includes(path.extname(filePath).toLowerCase())) {
      audioPath = path.join(outputDir, `${baseName}_temp.wav`);
      await this.extractAudio(filePath, audioPath);
      tempAudio = true;
    }

    onProgress({ status: 'Transcribing with Whisper...', progress: 30 });

    // Run Whisper
    const outputFiles = [];
    
    try {
      const formatArgs = formats.map(f => `--output_format ${f}`).join(' ');
      const langArg = language !== 'auto' ? `--language ${language}` : '';
      
      const cmd = `whisper "${audioPath}" --model ${model} ${langArg} --output_dir "${outputDir}" ${formatArgs}`;
      
      await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });

      // Collect output files
      for (const format of formats) {
        const outputFile = path.join(outputDir, `${path.basename(audioPath, '.wav')}.${format}`);
        if (await fs.pathExists(outputFile)) {
          // Rename to match original video name
          const finalPath = path.join(outputDir, `${baseName}.${format}`);
          await fs.move(outputFile, finalPath, { overwrite: true });
          outputFiles.push(finalPath);
        }
      }

      // Clean up temp audio
      if (tempAudio && await fs.pathExists(audioPath)) {
        await fs.remove(audioPath);
      }

      onProgress({ status: 'Transcription complete!', progress: 100 });

      return {
        success: true,
        sourceFile: filePath,
        outputFiles,
        language: language,
        model: model
      };

    } catch (error) {
      // Clean up
      if (tempAudio && await fs.pathExists(audioPath)) {
        await fs.remove(audioPath);
      }
      throw error;
    }
  }

  /**
   * Fallback transcription using free API or placeholder
   */
  async transcribeFallback(filePath, options = {}) {
    const { outputDir = path.dirname(filePath), onProgress = () => {} } = options;
    const baseName = path.basename(filePath, path.extname(filePath));

    onProgress({ status: 'Creating placeholder transcription files...', progress: 50 });

    // Create placeholder SRT file with instructions
    const srtContent = `1
00:00:00,000 --> 00:00:05,000
[Transcription requires Whisper installation]

2
00:00:05,000 --> 00:00:15,000
Install OpenAI Whisper: pip install openai-whisper

3
00:00:15,000 --> 00:00:25,000
Or use Scriberr: docker run -p 3050:3050 ghcr.io/scriberr/scriberr

4
00:00:25,000 --> 00:00:35,000
Then run: whisper "${filePath}" --output_format srt

5
00:00:35,000 --> 00:00:45,000
For GPU acceleration add: --device cuda
`;

    const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
[Transcription requires Whisper installation]

00:00:05.000 --> 00:00:15.000
Install OpenAI Whisper: pip install openai-whisper

00:00:15.000 --> 00:00:25.000
Or use Scriberr Docker: ghcr.io/scriberr/scriberr
`;

    const srtPath = path.join(outputDir, `${baseName}.srt`);
    const vttPath = path.join(outputDir, `${baseName}.vtt`);
    const infoPath = path.join(outputDir, `${baseName}_transcription_info.json`);

    await fs.writeFile(srtPath, srtContent);
    await fs.writeFile(vttPath, vttContent);
    await fs.writeJson(infoPath, {
      sourceFile: filePath,
      status: 'pending',
      needsWhisper: true,
      instructions: 'Install Whisper and run transcription manually',
      commands: {
        install: 'pip install openai-whisper',
        transcribe: `whisper "${filePath}" --model base --output_format srt vtt txt json`
      },
      scriberr: {
        docs: 'https://scriberr.app/docs/installation.html',
        docker: 'docker run -d -p 3050:3050 -v /data:/data ghcr.io/scriberr/scriberr:latest'
      }
    }, { spaces: 2 });

    onProgress({ status: 'Placeholder files created', progress: 100 });

    return {
      success: true,
      placeholder: true,
      sourceFile: filePath,
      outputFiles: [srtPath, vttPath, infoPath],
      message: 'Install Whisper for actual transcription',
      installGuide: this.getInstallInstructions()
    };
  }

  /**
   * Batch transcribe multiple files
   */
  async batchTranscribe(filePaths, options = {}) {
    const { onProgress = () => {} } = options;
    const results = [];

    for (let i = 0; i < filePaths.length; i++) {
      const file = filePaths[i];
      const progress = (i / filePaths.length) * 100;
      
      onProgress({ 
        status: `Transcribing ${i + 1}/${filePaths.length}: ${path.basename(file)}`,
        progress,
        current: i + 1,
        total: filePaths.length
      });

      try {
        const result = await this.transcribe(file, {
          ...options,
          onProgress: (p) => {
            onProgress({
              ...p,
              current: i + 1,
              total: filePaths.length,
              overallProgress: progress + (p.progress / 100) * (100 / filePaths.length)
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
      total: filePaths.length,
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
      converted = this.srtToVtt(content);
    } else if (inputFormat === 'vtt' && outputFormat === 'srt') {
      converted = this.vttToSrt(content);
    } else {
      throw new Error(`Conversion from ${inputFormat} to ${outputFormat} not supported`);
    }

    await fs.writeFile(outputPath, converted);
    return outputPath;
  }

  srtToVtt(srt) {
    let vtt = 'WEBVTT\n\n';
    vtt += srt
      .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4')
      .replace(/^\d+\s*$/gm, '')
      .trim();
    return vtt;
  }

  vttToSrt(vtt) {
    let srt = vtt
      .replace('WEBVTT\n', '')
      .replace(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/g, '$1:$2:$3,$4')
      .trim();
    
    // Add sequence numbers
    const blocks = srt.split('\n\n');
    srt = blocks.map((block, i) => `${i + 1}\n${block}`).join('\n\n');
    
    return srt;
  }
}

export default TranscriptionService;
