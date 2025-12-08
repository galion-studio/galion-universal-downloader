#!/usr/bin/env node
/**
 * Health Check & Debug Script
 * RunPod Universal Downloader - Part of Galion.studio Ecosystem
 * 
 * Run: node scripts/health-check.js
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║           🏥 RUNPOD UNIVERSAL DOWNLOADER - HEALTH CHECK              ║
╚══════════════════════════════════════════════════════════════════════╝
`);

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  const status = condition ? '✅' : '❌';
  const result = condition ? 'PASS' : 'FAIL';
  console.log(`${status} ${name}: ${result}${details ? ' - ' + details : ''}`);
  checks.push({ name, passed: condition, details });
  if (condition) passed++;
  else failed++;
  return condition;
}

async function runHealthChecks() {
  console.log('📁 CHECKING FILE STRUCTURE...\n');

  // Check core files
  check('package.json exists', fs.existsSync(path.join(rootDir, 'package.json')));
  check('server.js exists', fs.existsSync(path.join(rootDir, 'server.js')));
  check('index.js exists', fs.existsSync(path.join(rootDir, 'index.js')));

  // Check directories
  check('public/ directory', fs.existsSync(path.join(rootDir, 'public')));
  check('src/ directory', fs.existsSync(path.join(rootDir, 'src')));
  check('src/core/ directory', fs.existsSync(path.join(rootDir, 'src/core')));
  check('src/platforms/ directory', fs.existsSync(path.join(rootDir, 'src/platforms')));
  check('docs/ directory', fs.existsSync(path.join(rootDir, 'docs')));

  console.log('\n📦 CHECKING CORE MODULES...\n');

  // Check core modules
  const coreModules = [
    'PlatformManager.js',
    'ApiKeyManager.js',
    'UniversalDownloader.js',
    'TranscriptionService.js',
    'FileSystemScanner.js',
    'PDFService.js'
  ];

  for (const mod of coreModules) {
    check(`src/core/${mod}`, fs.existsSync(path.join(rootDir, 'src/core', mod)));
  }

  console.log('\n🌍 CHECKING PLATFORM MODULES...\n');

  // Check platform modules
  const platformModules = [
    'index.js',
    'CivitaiPlatform.js',
    'GithubPlatform.js',
    'YoutubePlatform.js',
    'TelegramPlatform.js',
    'GenericPlatform.js'
  ];

  for (const mod of platformModules) {
    check(`src/platforms/${mod}`, fs.existsSync(path.join(rootDir, 'src/platforms', mod)));
  }

  console.log('\n🎨 CHECKING FRONTEND FILES...\n');

  // Check frontend files
  const frontendFiles = [
    'index.html',
    'about.html',
    'app.js',
    'styles.css'
  ];

  for (const file of frontendFiles) {
    check(`public/${file}`, fs.existsSync(path.join(rootDir, 'public', file)));
  }

  console.log('\n📚 CHECKING DOCUMENTATION...\n');

  check('README.md', fs.existsSync(path.join(rootDir, 'README.md')));
  check('docs/GALION_ECOSYSTEM.md', fs.existsSync(path.join(rootDir, 'docs/GALION_ECOSYSTEM.md')));

  console.log('\n📌 CHECKING PACKAGE.JSON CONFIGURATION...\n');

  try {
    const pkg = await fs.readJson(path.join(rootDir, 'package.json'));
    check('Package name set', pkg.name === 'runpod-universal-downloader');
    check('Version 2.0.0', pkg.version === '2.0.0');
    check('Type is module', pkg.type === 'module');
    check('Start script exists', !!pkg.scripts?.start);
    check('Serverless script exists', !!pkg.scripts?.['start:serverless']);
    check('Homepage is galion.studio', pkg.homepage === 'https://galion.studio');
    
    // Check dependencies
    const requiredDeps = ['express', 'axios', 'cheerio', 'fs-extra', 'ws', 'archiver'];
    for (const dep of requiredDeps) {
      check(`Dependency: ${dep}`, !!pkg.dependencies?.[dep]);
    }
  } catch (e) {
    check('Package.json valid', false, e.message);
  }

  console.log('\n⚡ CHECKING SERVERLESS CONFIGURATION...\n');

  try {
    const pkg = await fs.readJson(path.join(rootDir, 'package.json'));
    check('Serverless config exists', !!pkg.serverless);
    check('RunPod provider set', pkg.serverless?.provider === 'runpod');
    check('GPU support enabled', pkg.serverless?.gpu === true);
  } catch (e) {
    check('Serverless config', false, e.message);
  }

  console.log('\n🔧 CHECKING NODE MODULES...\n');

  const nodeModulesExists = fs.existsSync(path.join(rootDir, 'node_modules'));
  check('node_modules installed', nodeModulesExists, nodeModulesExists ? '' : 'Run: npm install');

  console.log('\n📂 CHECKING DOWNLOADS DIRECTORY...\n');

  const downloadsDir = path.join(rootDir, 'downloads');
  if (fs.existsSync(downloadsDir)) {
    const files = await fs.readdir(downloadsDir);
    check('Downloads directory exists', true, `${files.length} items`);
  } else {
    check('Downloads directory exists', true, 'Will be created on first download');
  }

  // Summary
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                           📊 SUMMARY                                  ║
╠══════════════════════════════════════════════════════════════════════╣
║   Total Checks: ${(passed + failed).toString().padEnd(4)}                                           ║
║   Passed:       ${passed.toString().padEnd(4)} ✅                                          ║
║   Failed:       ${failed.toString().padEnd(4)} ${failed > 0 ? '❌' : '✅'}                                          ║
╠══════════════════════════════════════════════════════════════════════╣
║   Status: ${failed === 0 ? '✅ ALL SYSTEMS OPERATIONAL' : '⚠️  SOME ISSUES DETECTED'}                             ║
╚══════════════════════════════════════════════════════════════════════╝
`);

  if (failed > 0) {
    console.log('\n⚠️  FAILED CHECKS:');
    for (const c of checks.filter(x => !x.passed)) {
      console.log(`   ❌ ${c.name}${c.details ? ': ' + c.details : ''}`);
    }
  }

  console.log('\n🌐 ECOSYSTEM INFO:');
  console.log('   • Main Platform: https://galion.studio');
  console.log('   • Voice AI: https://galion.app');
  console.log('   • Developer Portal: https://developer.galion.app');
  console.log('   • This is part of the Galion Initiative (40% Open Source)');
  console.log('');

  return failed === 0;
}

// Test module imports
async function testImports() {
  console.log('\n🧪 TESTING MODULE IMPORTS...\n');

  try {
    const { PlatformManager } = await import('../src/core/PlatformManager.js');
    check('PlatformManager imports', true);
  } catch (e) {
    check('PlatformManager imports', false, e.message);
  }

  try {
    const { ApiKeyManager } = await import('../src/core/ApiKeyManager.js');
    check('ApiKeyManager imports', true);
  } catch (e) {
    check('ApiKeyManager imports', false, e.message);
  }

  try {
    const { UniversalDownloader } = await import('../src/core/UniversalDownloader.js');
    check('UniversalDownloader imports', true);
  } catch (e) {
    check('UniversalDownloader imports', false, e.message);
  }

  try {
    const { TranscriptionService } = await import('../src/core/TranscriptionService.js');
    check('TranscriptionService imports', true);
  } catch (e) {
    check('TranscriptionService imports', false, e.message);
  }

  try {
    const { FileSystemScanner } = await import('../src/core/FileSystemScanner.js');
    check('FileSystemScanner imports', true);
  } catch (e) {
    check('FileSystemScanner imports', false, e.message);
  }

  try {
    const { PDFService } = await import('../src/core/PDFService.js');
    check('PDFService imports', true);
  } catch (e) {
    check('PDFService imports', false, e.message);
  }

  try {
    const { EmailService } = await import('../src/core/EmailService.js');
    check('EmailService imports', true);
  } catch (e) {
    check('EmailService imports', false, e.message);
  }

  try {
    const { registerAllPlatforms } = await import('../src/platforms/index.js');
    check('Platform registry imports', true);
  } catch (e) {
    check('Platform registry imports', false, e.message);
  }
}

// Run all checks
async function main() {
  await runHealthChecks();
  await testImports();

  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                           🏁 COMPLETE                                 ║
╠══════════════════════════════════════════════════════════════════════╣
║   To start the server: npm start                                     ║
║   For serverless:      npm run start:serverless                      ║
║   Open in browser:     http://localhost:3000                         ║
╚══════════════════════════════════════════════════════════════════════╝
`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
