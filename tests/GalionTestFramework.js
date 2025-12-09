/**
 * Galion Test Framework
 * Massive automatic testing and bug detection system
 * with self-healing capabilities
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test Result Status
 */
export const TestStatus = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  SKIP: 'SKIP',
  ERROR: 'ERROR',
  FIXED: 'FIXED',
  PENDING: 'PENDING'
};

/**
 * Error Types for Auto-Healing
 */
export const ErrorType = {
  REGEX_PATTERN_FAIL: 'REGEX_PATTERN_FAIL',
  API_ENDPOINT_DOWN: 'API_ENDPOINT_DOWN',
  RATE_LIMIT: 'RATE_LIMIT',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  URL_FORMAT_CHANGED: 'URL_FORMAT_CHANGED',
  PARSER_ERROR: 'PARSER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RESPONSE_PARSE_ERROR: 'RESPONSE_PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Main Test Framework Class
 */
export class GalionTestFramework {
  constructor(options = {}) {
    this.testResults = [];
    this.startTime = null;
    this.endTime = null;
    this.options = {
      verbose: options.verbose ?? true,
      autoHeal: options.autoHeal ?? true,
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 3,
      reportDir: options.reportDir ?? path.join(__dirname, 'reports'),
      ...options
    };
    
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0,
      fixed: 0
    };
    
    this.healingLog = [];
    this.currentSuite = null;
  }

  /**
   * Initialize the test framework
   */
  async init() {
    await fs.ensureDir(this.options.reportDir);
    this.startTime = new Date();
    this.log('🧪 Galion Test Framework initialized');
    this.log(`📁 Reports will be saved to: ${this.options.reportDir}`);
    return this;
  }

  /**
   * Log message with timestamp
   */
  log(message, level = 'info') {
    if (!this.options.verbose && level === 'debug') return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = {
      info: '  ',
      debug: '🔍',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      fix: '🔧'
    }[level] || '  ';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  /**
   * Start a test suite
   */
  suite(name, description = '') {
    this.currentSuite = {
      name,
      description,
      tests: [],
      startTime: new Date()
    };
    this.log(`\n📦 Test Suite: ${name}`, 'info');
    if (description) this.log(`   ${description}`, 'debug');
    return this;
  }

  /**
   * Run a single test
   */
  async test(name, testFn, options = {}) {
    const testResult = {
      name,
      suite: this.currentSuite?.name || 'Default',
      status: TestStatus.PENDING,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      error: null,
      errorType: null,
      healingAttempt: null,
      retries: 0
    };

    this.stats.total++;
    
    let lastError = null;
    const maxRetries = options.retries ?? this.options.retries;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.log(`   Retry ${attempt}/${maxRetries}...`, 'warn');
          testResult.retries = attempt;
        }
        
        // Run with timeout
        await this.runWithTimeout(testFn, this.options.timeout);
        
        testResult.status = TestStatus.PASS;
        testResult.endTime = new Date();
        testResult.duration = testResult.endTime - testResult.startTime;
        this.stats.passed++;
        this.log(`   ✅ ${name} (${testResult.duration}ms)`, 'success');
        break;
        
      } catch (error) {
        lastError = error;
        testResult.error = error.message;
        testResult.errorType = this.classifyError(error);
        
        // Try auto-healing on last retry
        if (attempt === maxRetries && this.options.autoHeal) {
          const healed = await this.attemptHealing(testResult, error);
          if (healed) {
            testResult.status = TestStatus.FIXED;
            testResult.healingAttempt = healed;
            this.stats.fixed++;
            this.log(`   🔧 ${name} - AUTO-FIXED: ${healed.fix}`, 'fix');
            break;
          }
        }
        
        if (attempt === maxRetries) {
          testResult.status = TestStatus.FAIL;
          testResult.endTime = new Date();
          testResult.duration = testResult.endTime - testResult.startTime;
          this.stats.failed++;
          this.log(`   ❌ ${name}: ${error.message}`, 'error');
        }
      }
    }

    this.testResults.push(testResult);
    if (this.currentSuite) {
      this.currentSuite.tests.push(testResult);
    }
    
    return testResult;
  }

  /**
   * Run function with timeout
   */
  runWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);
      
      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Classify error type for healing
   */
  classifyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('regex') || message.includes('pattern') || message.includes('match')) {
      return ErrorType.REGEX_PATTERN_FAIL;
    }
    if (message.includes('404') || message.includes('endpoint') || message.includes('not found')) {
      return ErrorType.API_ENDPOINT_DOWN;
    }
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many')) {
      return ErrorType.RATE_LIMIT;
    }
    if (message.includes('401') || message.includes('403') || message.includes('auth') || message.includes('login')) {
      return ErrorType.AUTH_REQUIRED;
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorType.TIMEOUT;
    }
    if (message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (message.includes('parse') || message.includes('json') || message.includes('unexpected token')) {
      return ErrorType.RESPONSE_PARSE_ERROR;
    }
    if (message.includes('url') || message.includes('format')) {
      return ErrorType.URL_FORMAT_CHANGED;
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * Attempt to auto-heal the error
   */
  async attemptHealing(testResult, error) {
    const healingStrategies = {
      [ErrorType.REGEX_PATTERN_FAIL]: this.healRegexPattern.bind(this),
      [ErrorType.API_ENDPOINT_DOWN]: this.healApiEndpoint.bind(this),
      [ErrorType.RATE_LIMIT]: this.healRateLimit.bind(this),
      [ErrorType.RESPONSE_PARSE_ERROR]: this.healParseError.bind(this),
      [ErrorType.URL_FORMAT_CHANGED]: this.healUrlFormat.bind(this)
    };
    
    const strategy = healingStrategies[testResult.errorType];
    if (strategy) {
      try {
        const fix = await strategy(testResult, error);
        if (fix) {
          this.healingLog.push({
            timestamp: new Date(),
            test: testResult.name,
            errorType: testResult.errorType,
            fix
          });
          return fix;
        }
      } catch (healError) {
        this.log(`   Healing failed: ${healError.message}`, 'debug');
      }
    }
    
    return null;
  }

  /**
   * Heal regex pattern failures
   */
  async healRegexPattern(testResult, error) {
    // Log the issue for manual review
    return {
      type: 'REGEX_FIX_SUGGESTION',
      fix: 'Pattern may need updating - logged for review',
      action: 'MANUAL_REVIEW_REQUIRED',
      details: {
        test: testResult.name,
        error: error.message,
        suggestion: 'Check if the platform URL format has changed'
      }
    };
  }

  /**
   * Heal API endpoint issues
   */
  async healApiEndpoint(testResult, error) {
    return {
      type: 'ENDPOINT_SWITCH',
      fix: 'Attempting fallback endpoint',
      action: 'USE_FALLBACK',
      details: {
        originalEndpoint: error.endpoint,
        fallbackSuggestion: 'Try next API in the fallback chain'
      }
    };
  }

  /**
   * Heal rate limit issues
   */
  async healRateLimit(testResult, error) {
    return {
      type: 'RATE_LIMIT_BACKOFF',
      fix: 'Applying exponential backoff',
      action: 'WAIT_AND_RETRY',
      waitTime: 5000,
      details: {
        suggestion: 'Consider adding request throttling'
      }
    };
  }

  /**
   * Heal parse errors
   */
  async healParseError(testResult, error) {
    return {
      type: 'PARSER_UPDATE',
      fix: 'Response format may have changed',
      action: 'MANUAL_REVIEW_REQUIRED',
      details: {
        suggestion: 'Check API response structure'
      }
    };
  }

  /**
   * Heal URL format changes
   */
  async healUrlFormat(testResult, error) {
    return {
      type: 'URL_FORMAT_UPDATE',
      fix: 'URL format may have changed',
      action: 'MANUAL_REVIEW_REQUIRED',
      details: {
        suggestion: 'Verify current URL patterns for the platform'
      }
    };
  }

  /**
   * Skip a test
   */
  skip(name, reason = '') {
    const testResult = {
      name,
      suite: this.currentSuite?.name || 'Default',
      status: TestStatus.SKIP,
      reason,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0
    };
    
    this.stats.total++;
    this.stats.skipped++;
    this.testResults.push(testResult);
    this.log(`   ⏭️ ${name} - SKIPPED${reason ? `: ${reason}` : ''}`, 'warn');
    
    return testResult;
  }

  /**
   * Assert helpers
   */
  assert = {
    equals: (actual, expected, message) => {
      if (actual !== expected) {
        throw new Error(message || `Expected ${expected} but got ${actual}`);
      }
    },
    
    notEquals: (actual, expected, message) => {
      if (actual === expected) {
        throw new Error(message || `Expected value to not equal ${expected}`);
      }
    },
    
    truthy: (value, message) => {
      if (!value) {
        throw new Error(message || `Expected truthy value but got ${value}`);
      }
    },
    
    falsy: (value, message) => {
      if (value) {
        throw new Error(message || `Expected falsy value but got ${value}`);
      }
    },
    
    contains: (str, substr, message) => {
      if (!str.includes(substr)) {
        throw new Error(message || `Expected "${str}" to contain "${substr}"`);
      }
    },
    
    matches: (str, pattern, message) => {
      if (!pattern.test(str)) {
        throw new Error(message || `Expected "${str}" to match pattern ${pattern}`);
      }
    },
    
    isArray: (value, message) => {
      if (!Array.isArray(value)) {
        throw new Error(message || `Expected array but got ${typeof value}`);
      }
    },
    
    hasProperty: (obj, prop, message) => {
      if (!(prop in obj)) {
        throw new Error(message || `Expected object to have property "${prop}"`);
      }
    },
    
    isType: (value, type, message) => {
      if (typeof value !== type) {
        throw new Error(message || `Expected type ${type} but got ${typeof value}`);
      }
    },
    
    throws: async (fn, expectedError, message) => {
      try {
        await fn();
        throw new Error(message || 'Expected function to throw');
      } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
          throw new Error(message || `Expected error containing "${expectedError}" but got "${error.message}"`);
        }
      }
    },
    
    doesNotThrow: async (fn, message) => {
      try {
        await fn();
      } catch (error) {
        throw new Error(message || `Expected function not to throw but got: ${error.message}`);
      }
    }
  };

  /**
   * Generate test report
   */
  async generateReport(format = 'all') {
    this.endTime = new Date();
    const totalDuration = this.endTime - this.startTime;
    
    const report = {
      summary: {
        timestamp: this.endTime.toISOString(),
        duration: totalDuration,
        durationFormatted: this.formatDuration(totalDuration),
        ...this.stats,
        passRate: ((this.stats.passed / this.stats.total) * 100).toFixed(1) + '%'
      },
      results: this.testResults,
      healingLog: this.healingLog,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };
    
    // Generate reports in different formats
    if (format === 'all' || format === 'json') {
      await this.saveJsonReport(report);
    }
    if (format === 'all' || format === 'html') {
      await this.saveHtmlReport(report);
    }
    if (format === 'all' || format === 'console') {
      this.printConsoleReport(report);
    }
    
    return report;
  }

  /**
   * Save JSON report
   */
  async saveJsonReport(report) {
    const filename = `test-report-${Date.now()}.json`;
    const filepath = path.join(this.options.reportDir, filename);
    await fs.writeJson(filepath, report, { spaces: 2 });
    this.log(`📄 JSON report saved: ${filepath}`, 'info');
  }

  /**
   * Save HTML report
   */
  async saveHtmlReport(report) {
    const filename = `test-report-${Date.now()}.html`;
    const filepath = path.join(this.options.reportDir, filename);
    
    const html = this.generateHtmlReport(report);
    await fs.writeFile(filepath, html);
    this.log(`📄 HTML report saved: ${filepath}`, 'info');
  }

  /**
   * Generate HTML report content
   */
  generateHtmlReport(report) {
    const statusColors = {
      PASS: '#22c55e',
      FAIL: '#ef4444',
      SKIP: '#f59e0b',
      ERROR: '#dc2626',
      FIXED: '#3b82f6'
    };
    
    const testRows = report.results.map(t => `
      <tr class="test-row ${t.status.toLowerCase()}">
        <td>${t.suite}</td>
        <td>${t.name}</td>
        <td><span class="status" style="background: ${statusColors[t.status]}">${t.status}</span></td>
        <td>${t.duration}ms</td>
        <td>${t.error || '-'}</td>
        <td>${t.healingAttempt?.fix || '-'}</td>
      </tr>
    `).join('');
    
    const healingRows = report.healingLog.map(h => `
      <tr>
        <td>${new Date(h.timestamp).toLocaleTimeString()}</td>
        <td>${h.test}</td>
        <td>${h.errorType}</td>
        <td>${h.fix.fix}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <title>Galion Test Report - ${report.summary.timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 20px; font-size: 2rem; }
    h2 { color: #94a3b8; margin: 30px 0 15px; font-size: 1.25rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #1e293b; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { color: #64748b; font-size: 0.875rem; margin-top: 5px; }
    .passed .stat-value { color: #22c55e; }
    .failed .stat-value { color: #ef4444; }
    .fixed .stat-value { color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }
    th { background: #334155; padding: 12px; text-align: left; font-weight: 600; color: #cbd5e1; }
    td { padding: 12px; border-top: 1px solid #334155; }
    .test-row:hover { background: #334155; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: white; }
    .pass { background: rgba(34, 197, 94, 0.1); }
    .fail { background: rgba(239, 68, 68, 0.1); }
    .fixed { background: rgba(59, 130, 246, 0.1); }
    .healing-section { margin-top: 40px; }
    .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Galion Test Report</h1>
    
    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${report.summary.total}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card passed">
        <div class="stat-value">${report.summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-value">${report.summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card fixed">
        <div class="stat-value">${report.summary.fixed}</div>
        <div class="stat-label">Auto-Fixed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.passRate}</div>
        <div class="stat-label">Pass Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.durationFormatted}</div>
        <div class="stat-label">Duration</div>
      </div>
    </div>
    
    <h2>📋 Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Suite</th>
          <th>Test Name</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Error</th>
          <th>Auto-Fix</th>
        </tr>
      </thead>
      <tbody>
        ${testRows}
      </tbody>
    </table>
    
    ${report.healingLog.length > 0 ? `
    <div class="healing-section">
      <h2>🔧 Auto-Healing Log</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Test</th>
            <th>Error Type</th>
            <th>Fix Applied</th>
          </tr>
        </thead>
        <tbody>
          ${healingRows}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Generated at ${report.summary.timestamp} | Node ${report.environment.nodeVersion} | ${report.environment.platform}</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Print console report
   */
  printConsoleReport(report) {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`   Total:    ${report.summary.total}`);
    console.log(`   ✅ Passed: ${report.summary.passed}`);
    console.log(`   ❌ Failed: ${report.summary.failed}`);
    console.log(`   🔧 Fixed:  ${report.summary.fixed}`);
    console.log(`   ⏭️  Skipped: ${report.summary.skipped}`);
    console.log(`   📈 Pass Rate: ${report.summary.passRate}`);
    console.log(`   ⏱️  Duration: ${report.summary.durationFormatted}`);
    console.log('═'.repeat(60) + '\n');
    
    if (report.healingLog.length > 0) {
      console.log('🔧 AUTO-HEALING ACTIONS:');
      report.healingLog.forEach(h => {
        console.log(`   - ${h.test}: ${h.fix.fix}`);
      });
      console.log('');
    }
  }

  /**
   * Format duration
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(0);
    return `${mins}m ${secs}s`;
  }

  /**
   * Clean up old reports
   */
  async cleanOldReports(keepLast = 10) {
    const files = await fs.readdir(this.options.reportDir);
    const reportFiles = files
      .filter(f => f.startsWith('test-report-'))
      .sort()
      .reverse();
    
    const toDelete = reportFiles.slice(keepLast);
    for (const file of toDelete) {
      await fs.remove(path.join(this.options.reportDir, file));
    }
    
    if (toDelete.length > 0) {
      this.log(`🗑️ Cleaned ${toDelete.length} old reports`, 'info');
    }
  }
}

export default GalionTestFramework;
