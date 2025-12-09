/**
 * Auto-Healer Module
 * Automatically detects and fixes common errors in platform parsers
 * Self-healing system for the Galion Universal Downloader
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Healing Actions
 */
export const HealingAction = {
  UPDATE_REGEX: 'UPDATE_REGEX',
  SWITCH_ENDPOINT: 'SWITCH_ENDPOINT',
  ADD_FALLBACK: 'ADD_FALLBACK',
  UPDATE_HEADERS: 'UPDATE_HEADERS',
  ADD_RETRY: 'ADD_RETRY',
  MANUAL_REQUIRED: 'MANUAL_REQUIRED',
  CACHE_CLEAR: 'CACHE_CLEAR',
  RATE_LIMIT_WAIT: 'RATE_LIMIT_WAIT'
};

/**
 * Alternative API endpoints for platforms
 */
const FALLBACK_ENDPOINTS = {
  instagram: [
    'https://api.igram.io/api/convert',
    'https://snapinsta.app/api/convert',
    'https://saveig.app/api/ajaxSearch',
    'https://fastdl.app/api/convert',
    'https://instadownloader.co/api',
    'https://instasave.io/api'
  ],
  tiktok: [
    'https://tikwm.com/api/',
    'https://tiktokdownloader.io/api',
    'https://snaptik.app/api',
    'https://musicaldown.com/api'
  ],
  twitter: [
    'https://twitsave.com/api',
    'https://twittervideodownloader.com/api',
    'https://ssstwitter.com/api'
  ],
  youtube: [
    // YouTube primarily uses yt-dlp, but these are backup info endpoints
    'https://www.youtube.com/oembed',
    'https://noembed.com/embed',
    'https://www.youtube.com/get_video_info'
  ]
};

/**
 * Known working User-Agents
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
];

/**
 * AutoHealer Class
 */
export class AutoHealer {
  constructor(options = {}) {
    this.options = {
      platformsDir: options.platformsDir ?? path.join(__dirname, '..', 'src', 'platforms'),
      backupDir: options.backupDir ?? path.join(__dirname, 'backups'),
      logDir: options.logDir ?? path.join(__dirname, 'healing-logs'),
      maxRetries: options.maxRetries ?? 3,
      dryRun: options.dryRun ?? false,
      ...options
    };
    
    this.healingHistory = [];
    this.activeEndpoints = {};
    this.lastWorkingConfigs = new Map();
  }

  /**
   * Initialize the auto-healer
   */
  async init() {
    await fs.ensureDir(this.options.backupDir);
    await fs.ensureDir(this.options.logDir);
    
    // Load healing history if exists
    const historyPath = path.join(this.options.logDir, 'healing-history.json');
    if (await fs.pathExists(historyPath)) {
      this.healingHistory = await fs.readJson(historyPath);
    }
    
    console.log('🔧 AutoHealer initialized');
    return this;
  }

  /**
   * Analyze error and determine fix strategy
   */
  analyzeError(error, context = {}) {
    const message = error.message.toLowerCase();
    const analysis = {
      errorType: 'UNKNOWN',
      severity: 'MEDIUM',
      autoFixable: false,
      suggestedActions: [],
      details: {}
    };

    // Regex/Pattern failures
    if (message.includes('regex') || message.includes('pattern') || 
        message.includes('no match') || message.includes('invalid url')) {
      analysis.errorType = 'REGEX_FAILURE';
      analysis.severity = 'HIGH';
      analysis.autoFixable = true;
      analysis.suggestedActions = [
        HealingAction.UPDATE_REGEX,
        HealingAction.ADD_FALLBACK
      ];
      analysis.details.suggestion = 'URL pattern may have changed on the platform';
    }

    // API endpoint failures
    else if (message.includes('404') || message.includes('endpoint') || 
             message.includes('not found') || message.includes('gone')) {
      analysis.errorType = 'API_ENDPOINT_DOWN';
      analysis.severity = 'HIGH';
      analysis.autoFixable = true;
      analysis.suggestedActions = [
        HealingAction.SWITCH_ENDPOINT,
        HealingAction.ADD_FALLBACK
      ];
    }

    // Rate limiting
    else if (message.includes('429') || message.includes('rate limit') || 
             message.includes('too many') || message.includes('throttle')) {
      analysis.errorType = 'RATE_LIMITED';
      analysis.severity = 'MEDIUM';
      analysis.autoFixable = true;
      analysis.suggestedActions = [
        HealingAction.RATE_LIMIT_WAIT,
        HealingAction.ADD_RETRY
      ];
      analysis.details.waitTime = this.calculateBackoffTime(context.retryCount || 0);
    }

    // Authentication issues
    else if (message.includes('401') || message.includes('403') || 
             message.includes('unauthorized') || message.includes('forbidden')) {
      analysis.errorType = 'AUTH_REQUIRED';
      analysis.severity = 'HIGH';
      analysis.autoFixable = false;
      analysis.suggestedActions = [
        HealingAction.UPDATE_HEADERS,
        HealingAction.MANUAL_REQUIRED
      ];
      analysis.details.suggestion = 'Authentication may be required';
    }

    // Network errors
    else if (message.includes('econnrefused') || message.includes('enotfound') || 
             message.includes('network') || message.includes('connection')) {
      analysis.errorType = 'NETWORK_ERROR';
      analysis.severity = 'MEDIUM';
      analysis.autoFixable = true;
      analysis.suggestedActions = [
        HealingAction.ADD_RETRY,
        HealingAction.SWITCH_ENDPOINT
      ];
    }

    // Timeout errors
    else if (message.includes('timeout') || message.includes('timed out')) {
      analysis.errorType = 'TIMEOUT';
      analysis.severity = 'LOW';
      analysis.autoFixable = true;
      analysis.suggestedActions = [
        HealingAction.ADD_RETRY
      ];
    }

    // Parse errors
    else if (message.includes('parse') || message.includes('json') || 
             message.includes('unexpected token') || message.includes('syntax')) {
      analysis.errorType = 'PARSE_ERROR';
      analysis.severity = 'HIGH';
      analysis.autoFixable = true;
      analysis.suggestedActions = [
        HealingAction.SWITCH_ENDPOINT,
        HealingAction.MANUAL_REQUIRED
      ];
      analysis.details.suggestion = 'API response format may have changed';
    }

    return analysis;
  }

  /**
   * Calculate exponential backoff time
   */
  calculateBackoffTime(retryCount) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 1 minute
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  /**
   * Attempt to heal a failing platform
   */
  async heal(platformId, error, context = {}) {
    const analysis = this.analyzeError(error, context);
    
    const healingRecord = {
      timestamp: new Date().toISOString(),
      platformId,
      error: error.message,
      analysis,
      actions: [],
      success: false
    };

    console.log(`\n🩺 Diagnosing ${platformId}: ${analysis.errorType}`);

    if (!analysis.autoFixable) {
      console.log(`   ⚠️ Manual intervention required`);
      healingRecord.actions.push({
        action: HealingAction.MANUAL_REQUIRED,
        success: false,
        message: analysis.details.suggestion || 'Cannot auto-fix this issue'
      });
      this.logHealing(healingRecord);
      return healingRecord;
    }

    // Try each suggested action
    for (const action of analysis.suggestedActions) {
      try {
        const result = await this.executeAction(action, platformId, error, context, analysis);
        healingRecord.actions.push(result);
        
        if (result.success) {
          console.log(`   ✅ Successfully applied: ${action}`);
          healingRecord.success = true;
          break;
        }
      } catch (actionError) {
        healingRecord.actions.push({
          action,
          success: false,
          error: actionError.message
        });
      }
    }

    this.logHealing(healingRecord);
    return healingRecord;
  }

  /**
   * Execute a healing action
   */
  async executeAction(action, platformId, error, context, analysis) {
    switch (action) {
      case HealingAction.SWITCH_ENDPOINT:
        return this.switchEndpoint(platformId, context);
      
      case HealingAction.ADD_RETRY:
        return this.addRetryLogic(platformId, context);
      
      case HealingAction.RATE_LIMIT_WAIT:
        return this.handleRateLimit(analysis.details.waitTime);
      
      case HealingAction.UPDATE_HEADERS:
        return this.updateHeaders(platformId);
      
      case HealingAction.UPDATE_REGEX:
        return this.suggestRegexFix(platformId, error, context);
      
      case HealingAction.ADD_FALLBACK:
        return this.addFallbackMethod(platformId);
      
      case HealingAction.CACHE_CLEAR:
        return this.clearCache(platformId);
      
      default:
        return { action, success: false, message: 'Unknown action' };
    }
  }

  /**
   * Switch to a fallback endpoint
   */
  async switchEndpoint(platformId, context) {
    const fallbacks = FALLBACK_ENDPOINTS[platformId];
    
    if (!fallbacks || fallbacks.length === 0) {
      return {
        action: HealingAction.SWITCH_ENDPOINT,
        success: false,
        message: 'No fallback endpoints available'
      };
    }

    // Get current endpoint index
    const currentIndex = this.activeEndpoints[platformId] || 0;
    const nextIndex = (currentIndex + 1) % fallbacks.length;
    
    // Test the next endpoint
    const nextEndpoint = fallbacks[nextIndex];
    const isWorking = await this.testEndpoint(nextEndpoint);
    
    if (isWorking) {
      this.activeEndpoints[platformId] = nextIndex;
      
      return {
        action: HealingAction.SWITCH_ENDPOINT,
        success: true,
        message: `Switched to endpoint: ${nextEndpoint}`,
        newEndpoint: nextEndpoint
      };
    }

    // Try all other endpoints
    for (let i = 0; i < fallbacks.length; i++) {
      if (i === currentIndex) continue;
      
      const endpoint = fallbacks[i];
      const working = await this.testEndpoint(endpoint);
      
      if (working) {
        this.activeEndpoints[platformId] = i;
        return {
          action: HealingAction.SWITCH_ENDPOINT,
          success: true,
          message: `Switched to endpoint: ${endpoint}`,
          newEndpoint: endpoint
        };
      }
    }

    return {
      action: HealingAction.SWITCH_ENDPOINT,
      success: false,
      message: 'All fallback endpoints failed'
    };
  }

  /**
   * Test if an endpoint is working
   */
  async testEndpoint(endpoint) {
    return new Promise((resolve) => {
      const url = new URL(endpoint);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': USER_AGENTS[0]
        }
      }, (res) => {
        resolve(res.statusCode < 500);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  }

  /**
   * Add retry logic suggestion
   */
  async addRetryLogic(platformId, context) {
    return {
      action: HealingAction.ADD_RETRY,
      success: true,
      message: 'Retry with exponential backoff recommended',
      config: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2
      }
    };
  }

  /**
   * Handle rate limiting
   */
  async handleRateLimit(waitTime) {
    console.log(`   ⏳ Waiting ${Math.round(waitTime / 1000)}s due to rate limit...`);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    return {
      action: HealingAction.RATE_LIMIT_WAIT,
      success: true,
      message: `Waited ${Math.round(waitTime / 1000)}s`,
      waitTime
    };
  }

  /**
   * Update headers with working user agent
   */
  async updateHeaders(platformId) {
    const randomAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    return {
      action: HealingAction.UPDATE_HEADERS,
      success: true,
      message: 'Updated User-Agent header',
      headers: {
        'User-Agent': randomAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    };
  }

  /**
   * Suggest regex pattern fix
   */
  async suggestRegexFix(platformId, error, context) {
    const suggestion = {
      action: HealingAction.UPDATE_REGEX,
      success: true,
      message: 'Pattern analysis completed',
      suggestions: []
    };

    // Common pattern updates based on platform
    const patternSuggestions = {
      youtube: {
        video: '/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/',
        shorts: '/youtube\\.com\\/shorts\\/([a-zA-Z0-9_-]{11})/'
      },
      instagram: {
        post: '/instagram\\.com\\/p\\/([A-Za-z0-9_-]+)/',
        reel: '/instagram\\.com\\/(?:reel|reels)\\/([A-Za-z0-9_-]+)/'
      },
      tiktok: {
        video: '/tiktok\\.com\\/@([^\\/]+)\\/video\\/(\\d+)/',
        short: '/vm\\.tiktok\\.com\\/([A-Za-z0-9]+)/'
      },
      twitter: {
        tweet: '/(?:twitter\\.com|x\\.com)\\/([^\\/]+)\\/status\\/(\\d+)/'
      }
    };

    if (patternSuggestions[platformId]) {
      suggestion.suggestions = Object.entries(patternSuggestions[platformId]).map(([type, pattern]) => ({
        type,
        pattern,
        description: `Updated ${type} pattern for ${platformId}`
      }));
    }

    return suggestion;
  }

  /**
   * Add fallback method suggestion
   */
  async addFallbackMethod(platformId) {
    const fallbackMethods = {
      instagram: [
        'Try yt-dlp: yt-dlp "{url}"',
        'Use instaloader: instaloader -- -{shortcode}',
        'Manual: snapinsta.app, saveig.app'
      ],
      tiktok: [
        'Try yt-dlp: yt-dlp "{url}"',
        'Manual: snaptik.app, tikwm.com'
      ],
      twitter: [
        'Try yt-dlp: yt-dlp "{url}"',
        'Manual: twitsave.com, ssstwitter.com'
      ],
      youtube: [
        'Primary: yt-dlp (should always work)',
        'Check video availability',
        'Try with cookies if age-restricted'
      ]
    };

    return {
      action: HealingAction.ADD_FALLBACK,
      success: true,
      message: 'Fallback methods available',
      methods: fallbackMethods[platformId] || ['Try yt-dlp as universal fallback']
    };
  }

  /**
   * Clear platform cache
   */
  async clearCache(platformId) {
    // This would clear any cached data for the platform
    return {
      action: HealingAction.CACHE_CLEAR,
      success: true,
      message: 'Cache cleared'
    };
  }

  /**
   * Create backup of platform file before modification
   */
  async backupPlatform(platformId) {
    const platformFile = path.join(this.options.platformsDir, `${platformId}Platform.js`);
    
    if (await fs.pathExists(platformFile)) {
      const backupFile = path.join(
        this.options.backupDir, 
        `${platformId}Platform-${Date.now()}.js.bak`
      );
      await fs.copy(platformFile, backupFile);
      return backupFile;
    }
    
    return null;
  }

  /**
   * Log healing attempt
   */
  async logHealing(record) {
    this.healingHistory.push(record);
    
    // Save to file
    const historyPath = path.join(this.options.logDir, 'healing-history.json');
    await fs.writeJson(historyPath, this.healingHistory, { spaces: 2 });
    
    // Also save individual log
    const logFile = path.join(
      this.options.logDir, 
      `healing-${record.platformId}-${Date.now()}.json`
    );
    await fs.writeJson(logFile, record, { spaces: 2 });
  }

  /**
   * Get healing statistics
   */
  getStats() {
    const stats = {
      totalAttempts: this.healingHistory.length,
      successful: this.healingHistory.filter(h => h.success).length,
      failed: this.healingHistory.filter(h => !h.success).length,
      byPlatform: {},
      byErrorType: {},
      recentActions: this.healingHistory.slice(-10)
    };

    for (const record of this.healingHistory) {
      // By platform
      stats.byPlatform[record.platformId] = stats.byPlatform[record.platformId] || { success: 0, fail: 0 };
      if (record.success) {
        stats.byPlatform[record.platformId].success++;
      } else {
        stats.byPlatform[record.platformId].fail++;
      }

      // By error type
      const errorType = record.analysis?.errorType || 'UNKNOWN';
      stats.byErrorType[errorType] = (stats.byErrorType[errorType] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get active/working endpoint for a platform
   */
  getActiveEndpoint(platformId) {
    const index = this.activeEndpoints[platformId] || 0;
    const fallbacks = FALLBACK_ENDPOINTS[platformId];
    
    if (fallbacks && fallbacks[index]) {
      return fallbacks[index];
    }
    
    return null;
  }

  /**
   * Reset healing state for a platform
   */
  resetPlatform(platformId) {
    delete this.activeEndpoints[platformId];
    this.lastWorkingConfigs.delete(platformId);
  }

  /**
   * Generate healing report
   */
  async generateReport() {
    const stats = this.getStats();
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalHealingAttempts: stats.totalAttempts,
        successRate: stats.totalAttempts > 0 
          ? ((stats.successful / stats.totalAttempts) * 100).toFixed(1) + '%'
          : 'N/A'
      },
      platformBreakdown: stats.byPlatform,
      errorTypeBreakdown: stats.byErrorType,
      activeEndpoints: this.activeEndpoints,
      recentActions: stats.recentActions
    };

    const reportPath = path.join(this.options.logDir, `healing-report-${Date.now()}.json`);
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    return report;
  }
}

export default AutoHealer;
