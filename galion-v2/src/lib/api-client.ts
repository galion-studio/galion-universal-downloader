/**
 * Galion Universal Downloader - API Client
 * Connects frontend to backend API
 */

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:4444/api' 
  : '/api';

export interface DownloadProgress {
  type: 'progress' | 'complete' | 'error';
  status?: string;
  progress?: number;
  platform?: string;
  contentType?: string;
  result?: DownloadResult;
  message?: string;
}

export interface DownloadResult {
  success: boolean;
  platformId?: string;
  contentType?: string;
  title?: string;
  files?: FileInfo[];
  images?: ImageInfo[];
  outputDir?: string;
  error?: string;
}

export interface FileInfo {
  name: string;
  url?: string;
  downloadUrl?: string;
  size?: number;
  format?: string;
}

export interface ImageInfo {
  url?: string;
  src?: string;
  width?: number;
  height?: number;
}

export interface PlatformInfo {
  id: string;
  name: string;
  patterns: string[];
  features: string[];
  hasApiKey: boolean;
}

export interface TranscriptionStatus {
  backend: string | null;
  backendInstalled: boolean;
  ffmpegInstalled: boolean;
  defaultModel: string;
  currentModel: string;
  availableModels: string[];
  initialized: boolean;
}

export interface HistoryItem {
  folder: string;
  path: string;
  createdAt: string;
  size: number;
  metadata?: {
    title?: string;
    platform?: string;
    type?: string;
  };
}

// Utility to format file sizes
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * API Client for Galion Universal Downloader
 */
export const apiClient = {
  /**
   * Get API status
   */
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error('API not available');
      return await res.json();
    } catch (error) {
      console.log('API not available, running in demo mode');
      return { status: 'demo', platforms: [], downloads: { total: 0 } };
    }
  },

  /**
   * Get all platforms
   */
  async getPlatforms(): Promise<PlatformInfo[]> {
    try {
      const res = await fetch(`${API_BASE}/platforms`);
      if (!res.ok) throw new Error('Failed to fetch platforms');
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Parse URL and detect platform
   */
  async parseUrl(url: string) {
    try {
      const res = await fetch(`${API_BASE}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Failed to parse URL');
      return await res.json();
    } catch (error) {
      return { error: 'Failed to parse URL' };
    }
  },

  /**
   * Start download with streaming progress
   */
  async download(
    url: string, 
    options: { downloadFiles?: boolean } = {},
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...options })
      });

      if (!res.ok) {
        throw new Error('Download failed');
      }

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result: DownloadResult = { success: false };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line) as DownloadProgress;
              if (data.type === 'complete' && data.result) {
                result = data.result;
              }
              onProgress?.(data);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Download failed' 
      };
    }
  },

  /**
   * Get download history
   */
  async getHistory(): Promise<HistoryItem[]> {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Delete a download from history
   */
  async deleteDownload(folder: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/history/${encodeURIComponent(folder)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Open folder in file explorer
   */
  async openFolder(folderPath: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get configured API keys
   */
  async getApiKeys(): Promise<Record<string, boolean>> {
    try {
      const res = await fetch(`${API_BASE}/keys`);
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  },

  /**
   * Save API key for a platform
   */
  async saveApiKey(platform: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/keys/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      return { success: res.ok, ...data };
    } catch (error) {
      return { success: false, error: 'Failed to save API key' };
    }
  },

  /**
   * Delete API key for a platform
   */
  async deleteApiKey(platform: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/keys/${platform}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Verify API key for a platform
   */
  async verifyApiKey(platform: string, apiKey?: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/keys/${platform}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      return await res.json();
    } catch {
      return { valid: false, error: 'Verification failed' };
    }
  },

  // ===== TRANSCRIPTION =====

  /**
   * Get transcription service status
   */
  async getTranscriptionStatus(): Promise<TranscriptionStatus> {
    try {
      const res = await fetch(`${API_BASE}/transcribe/status`);
      if (!res.ok) throw new Error('Failed to get status');
      return await res.json();
    } catch {
      return {
        backend: null,
        backendInstalled: false,
        ffmpegInstalled: false,
        defaultModel: 'tiny.en',
        currentModel: 'tiny.en',
        availableModels: [],
        initialized: false
      };
    }
  },

  /**
   * Initialize transcription service
   */
  async initTranscription() {
    try {
      const res = await fetch(`${API_BASE}/transcribe/init`, {
        method: 'POST'
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: 'Failed to initialize' };
    }
  },

  /**
   * Get available Whisper models
   */
  async getWhisperModels() {
    try {
      const res = await fetch(`${API_BASE}/transcribe/models`);
      return await res.json();
    } catch {
      return { models: {}, recommended: 'tiny.en' };
    }
  },

  /**
   * Download a Whisper model
   */
  async downloadWhisperModel(model: string, onProgress?: (progress: unknown) => void) {
    try {
      const res = await fetch(`${API_BASE}/transcribe/models/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              onProgress?.(data);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Download failed' };
    }
  },

  /**
   * Transcribe a file
   */
  async transcribe(
    filePath: string,
    options: { language?: string; model?: string; formats?: string[] } = {},
    onProgress?: (progress: unknown) => void
  ) {
    try {
      const res = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, ...options })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = { success: false };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.type === 'complete') {
                result = data;
              }
              onProgress?.(data);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      return result;
    } catch (error) {
      return { success: false, error: 'Transcription failed' };
    }
  },

  /**
   * Get transcription installation instructions
   */
  async getTranscriptionInstall() {
    try {
      const res = await fetch(`${API_BASE}/transcribe/install`);
      return await res.json();
    } catch {
      return { quickStart: 'pip install faster-whisper' };
    }
  },

  // ===== FILE SCANNER =====

  /**
   * Find videos needing transcription
   */
  async findVideosNeedingTranscription(dirPath?: string) {
    try {
      const url = dirPath 
        ? `${API_BASE}/scan/needs-transcription?path=${encodeURIComponent(dirPath)}`
        : `${API_BASE}/scan/needs-transcription`;
      const res = await fetch(url);
      return await res.json();
    } catch {
      return { results: [], total: 0 };
    }
  },

  /**
   * Get download stats
   */
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      return await res.json();
    } catch {
      return { total: 0, completed: 0, failed: 0 };
    }
  }
};

// WebSocket connection for real-time updates
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const wsUrl = import.meta.env.DEV 
      ? 'ws://localhost:4444' 
      : `ws://${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type || 'message';
          this.emit(type, data);
          this.emit('*', data);
        } catch {
          // Skip invalid JSON
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.tryReconnect();
      };

      this.ws.onerror = () => {
        console.log('WebSocket error');
      };
    } catch (error) {
      console.log('WebSocket connection failed');
    }
  }

  private tryReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }

  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: (data: unknown) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

// Singleton WebSocket client
export const wsClient = new WebSocketClient();

export default apiClient;
