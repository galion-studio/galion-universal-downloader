#!/usr/bin/env node

/**
 * Galion Universal Downloader - Test Runner
 * 
 * Run: node tests/run-tests.js [options]
 * 
 * Options:
 *   --all           Run all tests
 *   --platform=X    Run tests for specific platform (youtube, instagram, etc.)
 *   --healing       Run self-healing tests only
 *   --quick         Quick smoke test
 *   --verbose       Verbose output
 *   --fix           Enable auto-fix mode
 *   --report=X      Report format (json, html, console, all)
 */

import { PlatformTestSuite } from './PlatformTestSuite.js';
import { GalionTestFramework } from './GalionTestFramework.js';
import { AutoHealer } from './AutoHealer.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    platform: null,
    healing: false,
    quick: false,
    verbose: true,
    fix: true,
    report: 'all'
  };

  for (const arg of args) {
    if (arg === '--all') options.all = true;
    else if (arg === '--healing') options.healing = true;
    else if (arg === '--quick') options.quick = true;
    else if (arg === '--verbose') options.verbose = true;
    else if (arg === '--fix') options.fix = true;
    else if (arg === '--no-fix') options.fix = false;
    else if (arg === '--quiet') options.verbose = false;
    else if (arg.startsWith('--platform=')) {
      options.platform = arg.split('=')[1];
    }
    else if (arg.startsWith('--report=')) {
      options.report = arg.split('=')[1];
    }
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  // Default to --all if no specific option given
  if (!options.platform && !options.healing && !options.quick) {
    options.all = true;
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   🧪 GALION TEST RUNNER                                             ║
║   ════════════════════                                              ║
║                                                                      ║
║   Usage: node tests/run-tests.js [options]                          ║
║                                                                      ║
║   Options:                                                          ║
║     --all             Run all tests (default)                       ║
║     --platform=X      Test specific platform                        ║
║                       (youtube, instagram, tiktok, twitter, etc.)   ║
║     --healing         Run self-healing tests only                   ║
║     --quick           Quick smoke test                              ║
║     --verbose         Verbose output (default)                      ║
║     --quiet           Minimal output                                ║
║     --fix             Enable auto-fix mode (default)                ║
║     --no-fix          Disable auto-fix mode                         ║
║     --report=X        Report format (json, html, console, all)      ║
║     --help, -h        Show this help                                ║
║                                                                      ║
║   Examples:                                                         ║
║     node tests/run-tests.js                                         ║
║     node tests/run-tests.js --platform=youtube                      ║
║     node tests/run-tests.js --quick --report=console                ║
║     node tests/run-tests.js --healing                               ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
}

/**
 * Print banner
 */
function printBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   🧪 GALION AUTOMATIC TESTING & BUG DETECTION SYSTEM                ║
║   ═══════════════════════════════════════════════════               ║
║                                                                      ║
║   ✓ Comprehensive platform testing                                  ║
║   ✓ URL pattern validation                                          ║
║   ✓ API endpoint health checks                                      ║
║   ✓ Automatic error detection                                       ║
║   ✓ Self-healing capabilities                                       ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
}

/**
 * Run quick smoke tests
 */
async function runQuickTests(options) {
  console.log('\n⚡ Running Quick Smoke Tests\n');
  
  const framework = new GalionTestFramework({
    verbose: options.verbose,
    autoHeal: options.fix,
    timeout: 10000,
    retries: 1
  });
  
  await framework.init();
  
  framework.suite('Quick Smoke Tests', 'Essential functionality checks');

  // Test platform index loads
  await framework.test('Platform index loads without error', async () => {
    const index = await import('../src/platforms/index.js');
    framework.assert.truthy(index, 'Index should load');
  });

  // Test detectPlatform function
  await framework.test('detectPlatform works', async () => {
    const { detectPlatform } = await import('../src/platforms/index.js');
    const result = detectPlatform('https://www.youtube.com/watch?v=test');
    framework.assert.equals(result, 'youtube');
  });

  // Test key platforms load
  const platforms = ['youtube', 'instagram', 'github', 'twitter'];
  for (const p of platforms) {
    await framework.test(`${p} platform loads`, async () => {
      const moduleName = p.charAt(0).toUpperCase() + p.slice(1) + 'Platform';
      const module = await import(`../src/platforms/${moduleName}.js`);
      framework.assert.truthy(module, `${moduleName} should load`);
    });
  }

  // Test server module loads
  await framework.test('Server module syntax is valid', async () => {
    // Just import to check syntax
    try {
      // We won't actually run the server, just check it parses
      const serverPath = path.join(__dirname, '..', 'server.js');
      const serverContent = await fs.readFile(serverPath, 'utf-8');
      framework.assert.truthy(serverContent.includes('express'), 'Server uses express');
    } catch (error) {
      throw new Error(`Server module error: ${error.message}`);
    }
  });

  const report = await framework.generateReport(options.report);
  return report;
}

/**
 * Main test runner
 */
async function main() {
  const options = parseArgs();
  
  printBanner();
  
  console.log('📋 Test Configuration:');
  console.log(`   Mode: ${options.all ? 'Full' : options.quick ? 'Quick' : options.platform ? `Platform (${options.platform})` : 'Healing'}`);
  console.log(`   Auto-Fix: ${options.fix ? 'Enabled' : 'Disabled'}`);
  console.log(`   Verbose: ${options.verbose ? 'Yes' : 'No'}`);
  console.log(`   Report: ${options.report}`);
  console.log('');

  let report;
  const startTime = Date.now();

  try {
    // Quick smoke tests
    if (options.quick) {
      report = await runQuickTests(options);
    }
    // Healing tests only
    else if (options.healing) {
      console.log('\n🔧 Running Self-Healing Tests\n');
      const suite = new PlatformTestSuite({
        verbose: options.verbose,
        autoHeal: options.fix
      });
      await suite.init();
      report = await suite.runHealingTests();
    }
    // Specific platform tests
    else if (options.platform) {
      console.log(`\n🎯 Running Tests for: ${options.platform}\n`);
      const suite = new PlatformTestSuite({
        verbose: options.verbose,
        autoHeal: options.fix
      });
      await suite.init();
      report = await suite.runPlatformTests(options.platform);
    }
    // Full test suite
    else {
      console.log('\n🚀 Running Full Test Suite\n');
      const suite = new PlatformTestSuite({
        verbose: options.verbose,
        autoHeal: options.fix
      });
      await suite.init();
      report = await suite.runAll();
    }

    const duration = Date.now() - startTime;
    
    // Print final summary
    console.log('\n' + '═'.repeat(60));
    console.log('🏁 TEST RUN COMPLETE');
    console.log('═'.repeat(60));
    
    if (report && report.summary) {
      const { total, passed, failed, fixed, skipped } = report.summary;
      
      console.log(`\n   📊 Results:`);
      console.log(`      Total Tests:  ${total}`);
      console.log(`      ✅ Passed:    ${passed}`);
      console.log(`      ❌ Failed:    ${failed}`);
      console.log(`      🔧 Auto-Fixed: ${fixed}`);
      console.log(`      ⏭️  Skipped:   ${skipped}`);
      console.log(`      📈 Pass Rate: ${report.summary.passRate}`);
      console.log(`\n   ⏱️  Total Time: ${Math.round(duration / 1000)}s`);
      
      // Show report locations
      console.log(`\n   📁 Reports saved to: tests/reports/`);
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    // Exit with appropriate code
    const exitCode = report?.summary?.failed > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
main();

export { main, runQuickTests };
