/**
 * RunPod Universal Downloader - Frontend Application
 * Handles all UI interactions and API communication
 * 
 * Galion.app v3 Design System Integration
 * - Neural-net style usage analytics
 * - Adaptive UI based on user preferences
 * - Minimal, intentional design
 */

// ============================
// State Management
// ============================
const state = {
  currentDownload: null,
  platforms: [],
  apiKeys: [],
  history: [],
  ws: null,
  // API Keys modal state
  apiKeysExpanded: false,
  apiKeysFilter: 'all',
  apiKeysSearch: ''
};

// ============================
// Usage Analytics System (Neural-Net Style)
// ============================
class UsageAnalytics {
  constructor() {
    this.storageKey = 'galion_usage_analytics';
    this.decayRate = 0.95; // Daily decay rate for recency weighting
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Apply time-based decay
        return this.applyDecay(parsed);
      }
    } catch (e) {
      console.warn('Failed to load analytics:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      platforms: {},        // Platform usage counts with timestamps
      features: {},         // Feature usage (transcribe, batch, etc.)
      actions: {},          // Action counts (configure, search, filter)
      sessions: [],         // Session timestamps
      totalInteractions: 0,
      lastUpdated: Date.now()
    };
  }

  applyDecay(data) {
    const now = Date.now();
    const daysSinceUpdate = (now - (data.lastUpdated || now)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 0.5) return data; // Skip if less than 12 hours
    
    const decayFactor = Math.pow(this.decayRate, daysSinceUpdate);
    
    // Apply decay to platform scores
    for (const [key, value] of Object.entries(data.platforms || {})) {
      if (typeof value === 'object' && value.score) {
        data.platforms[key].score = Math.max(0, value.score * decayFactor);
      }
    }
    
    data.lastUpdated = now;
    return data;
  }

  save() {
    try {
      this.data.lastUpdated = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save analytics:', e);
    }
  }

  // Track platform interaction (view, configure, download)
  trackPlatform(platformId, interactionType = 'view', weight = 1) {
    if (!this.data.platforms[platformId]) {
      this.data.platforms[platformId] = {
        score: 0,
        views: 0,
        configures: 0,
        downloads: 0,
        lastUsed: null
      };
    }

    const platform = this.data.platforms[platformId];
    platform.lastUsed = Date.now();

    // Weight different interactions
    const weights = { view: 0.1, configure: 2, download: 5 };
    const interactionWeight = weights[interactionType] || weight;
    
    platform.score += interactionWeight;
    platform[interactionType + 's'] = (platform[interactionType + 's'] || 0) + 1;
    
    this.data.totalInteractions++;
    this.save();
  }

  // Track feature usage (transcribe, batch, devtools, etc.)
  trackFeature(featureId, weight = 1) {
    if (!this.data.features[featureId]) {
      this.data.features[featureId] = { count: 0, lastUsed: null };
    }
    this.data.features[featureId].count += weight;
    this.data.features[featureId].lastUsed = Date.now();
    this.data.totalInteractions++;
    this.save();
  }

  // Track action (search, filter, etc.)
  trackAction(actionId) {
    if (!this.data.actions[actionId]) {
      this.data.actions[actionId] = 0;
    }
    this.data.actions[actionId]++;
    this.save();
  }

  // Get top platforms by score (for recommendations)
  getTopPlatforms(limit = 3) {
    const platforms = Object.entries(this.data.platforms)
      .map(([id, data]) => ({ id, ...data }))
      .filter(p => p.score > 0)
      .sort((a, b) => {
        // Score + recency bonus
        const recencyA = a.lastUsed ? (Date.now() - a.lastUsed) / (1000 * 60 * 60 * 24) : 100;
        const recencyB = b.lastUsed ? (Date.now() - b.lastUsed) / (1000 * 60 * 60 * 24) : 100;
        const scoreA = a.score * Math.exp(-recencyA * 0.1);
        const scoreB = b.score * Math.exp(-recencyB * 0.1);
        return scoreB - scoreA;
      })
      .slice(0, limit);
    
    return platforms;
  }

  // Get usage score for a specific platform (0-100 normalized)
  getPlatformScore(platformId) {
    const platform = this.data.platforms[platformId];
    if (!platform || platform.score === 0) return 0;
    
    const maxScore = Math.max(
      ...Object.values(this.data.platforms).map(p => p.score || 0),
      1
    );
    return Math.min(100, Math.round((platform.score / maxScore) * 100));
  }

  // Get total interaction count
  getTotalInteractions() {
    return this.data.totalInteractions;
  }

  // Get recommendations based on usage patterns
  getRecommendations(allPlatforms, configuredPlatforms = []) {
    const recommendations = [];
    const topUsed = this.getTopPlatforms(5);
    
    // Recommend frequently used but not configured platforms
    for (const used of topUsed) {
      if (!configuredPlatforms.includes(used.id)) {
        recommendations.push({
          id: used.id,
          reason: 'frequently_used',
          score: used.score
        });
      }
    }

    // If user uses downloads, recommend civitai/github
    if (this.data.features.download?.count > 3) {
      if (!configuredPlatforms.includes('civitai')) {
        recommendations.push({ id: 'civitai', reason: 'model_downloads', score: 50 });
      }
      if (!configuredPlatforms.includes('github')) {
        recommendations.push({ id: 'github', reason: 'code_downloads', score: 40 });
      }
    }

    // Remove duplicates and limit
    const seen = new Set();
    return recommendations
      .filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .slice(0, 3);
  }
}

// Initialize analytics
const analytics = new UsageAnalytics();

// Platform icons mapping
const platformIcons = {
  civitai: '🎨',
  github: '🐙',
  youtube: '🎬',
  telegram: '📨',
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  tiktok: '🎵',
  huggingface: '🤗',
  generic: '🌐'
};

// ============================
// DOM Elements
// ============================
const elements = {
  urlInput: document.getElementById('url-input'),
  downloadBtn: document.getElementById('download-btn'),
  detectedPlatform: document.getElementById('detected-platform'),
  detectionPlatform: document.getElementById('detection-platform'),
  detectionType: document.getElementById('detection-type'),
  
  progressSection: document.getElementById('progress-section'),
  progressFill: document.getElementById('progress-fill'),
  progressPercent: document.getElementById('progress-percent'),
  progressStatus: document.getElementById('progress-status'),
  progressDetails: document.getElementById('progress-details'),
  
  resultsSection: document.getElementById('results-section'),
  resultSummary: document.getElementById('result-summary'),
  resultFiles: document.getElementById('result-files'),
  
  historyList: document.getElementById('history-list'),
  
  settingsModal: document.getElementById('settings-modal'),
  apiKeysList: document.getElementById('api-keys-list'),
  
  batchModal: document.getElementById('batch-modal'),
  batchUrls: document.getElementById('batch-urls'),
  
  toastContainer: document.getElementById('toast-container')
};

// ============================
// Initialization
// ============================
async function init() {
  console.log('🚀 Initializing RunPod Universal Downloader...');
  
  // Connect WebSocket for real-time updates
  connectWebSocket();
  
  // Load initial data
  await loadStatus();
  await loadHistory();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('✓ Application initialized');
}

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  state.ws = new WebSocket(`${protocol}//${window.location.host}`);
  
  state.ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (e) {
      console.error('WebSocket parse error:', e);
    }
  };
  
  state.ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting...');
    setTimeout(connectWebSocket, 3000);
  };
}

function handleWebSocketMessage(data) {
  if (data.type === 'progress') {
    updateProgress(data);
  } else if (data.type === 'complete') {
    handleDownloadComplete(data.result);
  } else if (data.type === 'error') {
    showToast(data.message, 'error');
    hideProgress();
  }
}

// ============================
// Event Listeners
// ============================
function setupEventListeners() {
  // URL input - detect platform on input
  elements.urlInput.addEventListener('input', debounce(handleUrlInput, 300));
  elements.urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startDownload();
  });
  
  // Download button
  elements.downloadBtn.addEventListener('click', startDownload);
  
  // Quick action buttons
  document.getElementById('batch-btn').addEventListener('click', openBatchModal);
  document.getElementById('gallery-btn').addEventListener('click', startGalleryDownload);
  document.getElementById('profile-btn').addEventListener('click', startProfileDownload);
  document.getElementById('model-btn').addEventListener('click', () => {
    elements.urlInput.placeholder = 'Paste CivitAI model URL...';
    elements.urlInput.focus();
  });
  
  // Settings modal
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('close-modal').addEventListener('click', closeSettings);
  document.getElementById('modal-backdrop').addEventListener('click', closeSettings);
  
  // Batch modal
  document.querySelectorAll('.close-batch').forEach(btn => {
    btn.addEventListener('click', closeBatchModal);
  });
  document.getElementById('batch-backdrop').addEventListener('click', closeBatchModal);
  document.getElementById('start-batch').addEventListener('click', startBatchDownload);
  
  // Results section
  document.getElementById('close-results').addEventListener('click', hideResults);
  document.getElementById('open-folder').addEventListener('click', openDownloadFolder);
  document.getElementById('download-zip').addEventListener('click', downloadAsZip);
  document.getElementById('new-download').addEventListener('click', () => {
    hideResults();
    elements.urlInput.value = '';
    elements.urlInput.focus();
  });
  
  // History
  document.getElementById('refresh-history').addEventListener('click', loadHistory);
  document.getElementById('clear-history').addEventListener('click', clearHistory);
}

// ============================
// URL Detection
// ============================
async function handleUrlInput() {
  const url = elements.urlInput.value.trim();
  
  if (!url) {
    resetDetection();
    return;
  }
  
  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const data = await response.json();
    
    if (data.platformId) {
      elements.detectedPlatform.textContent = platformIcons[data.platformId] || '🔗';
      elements.detectionPlatform.textContent = data.platformId.charAt(0).toUpperCase() + data.platformId.slice(1);
      elements.detectionType.textContent = data.contentType || 'Content';
      elements.detectionType.style.display = 'inline';
    }
  } catch (e) {
    resetDetection();
  }
}

function resetDetection() {
  elements.detectedPlatform.textContent = '🔗';
  elements.detectionPlatform.textContent = '-';
  elements.detectionType.textContent = '-';
  elements.detectionType.style.display = 'none';
}

// ============================
// Download Functions
// ============================
async function startDownload() {
  const url = elements.urlInput.value.trim();
  
  if (!url) {
    showToast('Please enter a URL', 'error');
    return;
  }
  
  // Track download feature usage
  analytics.trackFeature('download');
  
  // Get options
  const options = {
    downloadFiles: document.getElementById('opt-files').checked,
    downloadImages: document.getElementById('opt-images').checked,
    downloadVideos: document.getElementById('opt-videos').checked,
    saveMetadata: document.getElementById('opt-metadata').checked
  };
  
  showProgress();
  updateProgress({ progress: 0, status: 'Starting download...' });
  
  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options, downloadFiles: options.downloadFiles })
    });
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.type === 'progress') {
            updateProgress(data);
          } else if (data.type === 'complete') {
            handleDownloadComplete(data.result);
          } else if (data.type === 'error') {
            showToast(data.message, 'error');
            hideProgress();
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }
  } catch (error) {
    showToast('Download failed: ' + error.message, 'error');
    hideProgress();
  }
}

async function startGalleryDownload() {
  const url = elements.urlInput.value.trim();
  
  if (!url) {
    showToast('Please enter a gallery URL first', 'error');
    return;
  }
  
  // Track gallery feature usage
  analytics.trackFeature('gallery');
  
  showProgress();
  updateProgress({ progress: 0, status: 'Starting gallery download...' });
  
  try {
    const response = await fetch('/api/download/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options: { limit: 100 } })
    });
    
    const result = await response.json();
    
    if (result.success) {
      handleDownloadComplete(result);
    } else {
      showToast(result.error || 'Gallery download failed', 'error');
      hideProgress();
    }
  } catch (error) {
    showToast('Gallery download failed: ' + error.message, 'error');
    hideProgress();
  }
}

async function startProfileDownload() {
  const url = elements.urlInput.value.trim();
  
  if (!url) {
    showToast('Please enter a profile URL first', 'error');
    return;
  }
  
  // Track profile feature usage
  analytics.trackFeature('profile');
  
  showProgress();
  updateProgress({ progress: 0, status: 'Starting profile download...' });
  
  try {
    const response = await fetch('/api/download/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options: { limit: 50 } })
    });
    
    const result = await response.json();
    
    if (result.success) {
      handleDownloadComplete(result);
    } else {
      showToast(result.error || 'Profile download failed', 'error');
      hideProgress();
    }
  } catch (error) {
    showToast('Profile download failed: ' + error.message, 'error');
    hideProgress();
  }
}

async function startBatchDownload() {
  const urlsText = elements.batchUrls.value.trim();
  const urls = urlsText.split('\n').map(u => u.trim()).filter(u => u);
  
  if (urls.length === 0) {
    showToast('Please enter at least one URL', 'error');
    return;
  }
  
  // Track batch feature usage
  analytics.trackFeature('batch');
  
  closeBatchModal();
  showProgress();
  updateProgress({ progress: 0, status: `Starting batch download (${urls.length} URLs)...` });
  
  try {
    const response = await fetch('/api/download/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });
    
    const result = await response.json();
    
    updateProgress({ progress: 100, status: 'Batch download complete!' });
    
    setTimeout(() => {
      hideProgress();
      showToast(`Batch complete: ${result.success} succeeded, ${result.failed} failed`, 
        result.failed > 0 ? 'warning' : 'success');
      loadHistory();
    }, 1000);
    
  } catch (error) {
    showToast('Batch download failed: ' + error.message, 'error');
    hideProgress();
  }
}

// ============================
// Progress & Results
// ============================
function showProgress() {
  elements.progressSection.style.display = 'block';
  elements.resultsSection.style.display = 'none';
}

function hideProgress() {
  elements.progressSection.style.display = 'none';
}

function updateProgress(data) {
  const percent = Math.round(data.progress || 0);
  elements.progressFill.style.width = `${percent}%`;
  elements.progressPercent.textContent = `${percent}%`;
  
  if (data.status) {
    elements.progressStatus.textContent = data.status;
  }
  
  if (data.details) {
    elements.progressDetails.textContent = data.details;
  }
}

function handleDownloadComplete(result) {
  hideProgress();
  state.currentDownload = result;
  
  // Build summary
  let summary = `<div class="result-stats">`;
  summary += `<div><strong>Type:</strong> ${result.type || 'content'}</div>`;
  
  if (result.title || result.name) {
    summary += `<div><strong>Title:</strong> ${result.title || result.name}</div>`;
  }
  
  if (result.images && result.images.length > 0) {
    summary += `<div><strong>Images:</strong> ${result.images.length}</div>`;
  }
  
  if (result.files && result.files.length > 0) {
    summary += `<div><strong>Files:</strong> ${result.files.length}</div>`;
  }
  
  if (result.outputDir) {
    summary += `<div><strong>Location:</strong> ${result.outputDir}</div>`;
  }
  
  summary += `</div>`;
  elements.resultSummary.innerHTML = summary;
  
  // Show files if any
  if (result.downloadedFiles || result.downloadedImages) {
    let filesHtml = '';
    const allFiles = [
      ...(result.downloadedFiles?.successful || []),
      ...(result.downloadedImages?.successful || [])
    ];
    
    if (allFiles.length > 0) {
      filesHtml = '<div class="downloaded-files">';
      allFiles.slice(0, 10).forEach(f => {
        filesHtml += `<div class="file-item">📄 ${f.filename || 'File'}</div>`;
      });
      if (allFiles.length > 10) {
        filesHtml += `<div class="file-item more">...and ${allFiles.length - 10} more files</div>`;
      }
      filesHtml += '</div>';
    }
    elements.resultFiles.innerHTML = filesHtml;
  }
  
  elements.resultsSection.style.display = 'block';
  showToast('Download complete!', 'success');
  loadHistory();
}

function hideResults() {
  elements.resultsSection.style.display = 'none';
  state.currentDownload = null;
}

async function openDownloadFolder() {
  if (!state.currentDownload?.outputDir) {
    showToast('No download folder available', 'error');
    return;
  }
  
  try {
    await fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: state.currentDownload.outputDir })
    });
  } catch (error) {
    showToast('Could not open folder', 'error');
  }
}

async function downloadAsZip() {
  if (!state.currentDownload?.outputDir) {
    showToast('No download folder available', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/download-zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: state.currentDownload.outputDir })
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    showToast('Could not create ZIP', 'error');
  }
}

// ============================
// History
// ============================
async function loadHistory() {
  try {
    const response = await fetch('/api/history');
    state.history = await response.json();
    renderHistory();
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <span>No downloads yet. Paste a URL above to get started!</span>
      </div>
    `;
    return;
  }
  
  elements.historyList.innerHTML = state.history.map(item => `
    <div class="history-item" data-folder="${item.folder}">
      <div class="history-info">
        <div class="history-title">${item.metadata?.title || item.metadata?.name || item.folder}</div>
        <div class="history-meta">
          ${formatDate(item.createdAt)} • ${formatBytes(item.size)}
        </div>
      </div>
      <div class="history-actions">
        <button class="btn btn-ghost btn-sm" onclick="openHistoryFolder('${item.path}')">📁</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteHistoryItem('${item.folder}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function openHistoryFolder(folderPath) {
  try {
    await fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: folderPath })
    });
  } catch (error) {
    showToast('Could not open folder', 'error');
  }
}

async function deleteHistoryItem(folder) {
  if (!confirm('Delete this download?')) return;
  
  try {
    await fetch(`/api/history/${encodeURIComponent(folder)}`, {
      method: 'DELETE'
    });
    showToast('Download deleted', 'success');
    loadHistory();
  } catch (error) {
    showToast('Could not delete', 'error');
  }
}

async function clearHistory() {
  if (!confirm('Clear all download history?')) return;
  
  try {
    await fetch('/api/stats/clear', { method: 'POST' });
    showToast('History cleared', 'success');
    loadHistory();
  } catch (error) {
    showToast('Could not clear history', 'error');
  }
}

// ============================
// Settings Modal - Galion v3 Design
// ============================

// Default number of visible items (top 3)
const API_KEYS_VISIBLE_COUNT = 3;

async function openSettings() {
  elements.settingsModal.style.display = 'flex';
  
  // Reset state
  state.apiKeysExpanded = false;
  state.apiKeysFilter = 'all';
  state.apiKeysSearch = '';
  
  // Setup search and filter listeners
  setupApiKeysSearch();
  
  await loadApiKeys();
}

function closeSettings() {
  elements.settingsModal.style.display = 'none';
}

function setupApiKeysSearch() {
  const searchInput = document.getElementById('api-keys-search');
  const clearBtn = document.getElementById('clear-api-search');
  const filterChips = document.querySelectorAll('.filter-chip');
  const showMoreBtn = document.getElementById('show-more-api-keys');
  
  // Search input handler
  if (searchInput) {
    searchInput.value = '';
    searchInput.addEventListener('input', debounce((e) => {
      state.apiKeysSearch = e.target.value.toLowerCase().trim();
      clearBtn.style.display = state.apiKeysSearch ? 'block' : 'none';
      analytics.trackAction('api_keys_search');
      renderApiKeys();
    }, 200));
  }
  
  // Clear search button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.apiKeysSearch = '';
      clearBtn.style.display = 'none';
      renderApiKeys();
    });
  }
  
  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.apiKeysFilter = chip.dataset.filter;
      state.apiKeysExpanded = false; // Reset expansion on filter change
      analytics.trackAction('api_keys_filter_' + state.apiKeysFilter);
      renderApiKeys();
    });
  });
  
  // Show more button
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      state.apiKeysExpanded = !state.apiKeysExpanded;
      showMoreBtn.classList.toggle('expanded', state.apiKeysExpanded);
      analytics.trackAction('api_keys_show_more');
      renderApiKeys();
    });
  }
}

async function loadApiKeys() {
  try {
    // Show skeleton loading
    showApiKeysSkeleton();
    
    const response = await fetch('/api/keys');
    state.apiKeys = await response.json();
    
    // Track view for each visible platform (lightweight)
    state.apiKeys.slice(0, 3).forEach(p => {
      analytics.trackPlatform(p.id, 'view', 0.05);
    });
    
    renderApiKeys();
    renderSmartSuggestions();
    updateUsageStats();
  } catch (error) {
    console.error('Failed to load API keys:', error);
    elements.apiKeysList.innerHTML = `
      <div class="no-results">
        <span class="no-results-icon">⚠️</span>
        <span class="no-results-text">Failed to load platforms</span>
        <span class="no-results-hint">Check your connection</span>
      </div>
    `;
  }
}

function showApiKeysSkeleton() {
  elements.apiKeysList.innerHTML = Array(3).fill(0).map(() => `
    <div class="api-key-skeleton">
      <div class="skeleton-icon"></div>
      <div class="skeleton-text">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>
  `).join('');
}

function renderApiKeys() {
  let platforms = [...state.apiKeys];
  const configuredPlatforms = platforms.filter(p => p.hasKey).map(p => p.id);
  
  // Apply search filter
  if (state.apiKeysSearch) {
    platforms = platforms.filter(p => 
      p.name.toLowerCase().includes(state.apiKeysSearch) ||
      p.description.toLowerCase().includes(state.apiKeysSearch) ||
      p.id.toLowerCase().includes(state.apiKeysSearch)
    );
  }
  
  // Apply category filter
  switch (state.apiKeysFilter) {
    case 'configured':
      platforms = platforms.filter(p => p.hasKey);
      break;
    case 'required':
      platforms = platforms.filter(p => p.required);
      break;
    case 'frequent':
      // Sort by usage score
      platforms = platforms
        .map(p => ({ ...p, usageScore: analytics.getPlatformScore(p.id) }))
        .filter(p => p.usageScore > 0)
        .sort((a, b) => b.usageScore - a.usageScore);
      break;
  }
  
  // Adaptive sorting: prioritize frequently used platforms
  if (state.apiKeysFilter === 'all' && !state.apiKeysSearch) {
    platforms = sortByUsageAndStatus(platforms);
  }
  
  // Handle empty state
  if (platforms.length === 0) {
    elements.apiKeysList.innerHTML = `
      <div class="no-results">
        <span class="no-results-icon">🔍</span>
        <span class="no-results-text">No platforms found</span>
        <span class="no-results-hint">Try a different search or filter</span>
      </div>
    `;
    document.getElementById('show-more-api-keys').style.display = 'none';
    return;
  }
  
  // Determine visible count
  const isSearchOrFilter = state.apiKeysSearch || state.apiKeysFilter !== 'all';
  const visibleCount = isSearchOrFilter || state.apiKeysExpanded 
    ? platforms.length 
    : API_KEYS_VISIBLE_COUNT;
  
  const visiblePlatforms = platforms.slice(0, visibleCount);
  const hiddenCount = platforms.length - visibleCount;
  
  // Render platforms
  elements.apiKeysList.innerHTML = visiblePlatforms.map(platform => {
    const usageScore = analytics.getPlatformScore(platform.id);
    const isFrequent = usageScore > 30;
    
    return `
      <div class="api-key-item ${platform.hasKey ? 'configured' : ''} ${isFrequent ? 'frequent' : ''}"
           data-platform="${platform.id}"
           onclick="trackPlatformView('${platform.id}')">
        <span class="api-key-icon">${platform.icon}</span>
        <div class="api-key-info">
          <div class="api-key-name">${platform.name}</div>
          <div class="api-key-desc">${platform.description}</div>
        </div>
        ${usageScore > 0 ? `
          <div class="usage-indicator" title="Usage: ${usageScore}%">
            <div class="usage-bar" style="width: ${usageScore}%"></div>
          </div>
        ` : ''}
        <span class="api-key-status ${platform.hasKey ? 'configured' : platform.required ? 'required' : 'not-configured'}">
          ${platform.hasKey ? '✓ Configured' : platform.required ? '⚡ Required' : 'Not Set'}
        </span>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); configureApiKey('${platform.id}', '${platform.name}')">
          ⚙️
        </button>
      </div>
    `;
  }).join('');
  
  // Apply collapsed class if not expanded and not searching
  elements.apiKeysList.classList.toggle('collapsed', !state.apiKeysExpanded && !isSearchOrFilter && hiddenCount > 0);
  
  // Show/hide "Show More" button
  const showMoreBtn = document.getElementById('show-more-api-keys');
  if (hiddenCount > 0 && !isSearchOrFilter) {
    showMoreBtn.style.display = 'flex';
    showMoreBtn.querySelector('.show-more-text').textContent = state.apiKeysExpanded ? 'Show Less' : 'Show More';
    showMoreBtn.querySelector('.show-more-count').textContent = state.apiKeysExpanded ? '' : `(+${hiddenCount} platforms)`;
    showMoreBtn.classList.toggle('expanded', state.apiKeysExpanded);
  } else {
    showMoreBtn.style.display = 'none';
  }
}

function sortByUsageAndStatus(platforms) {
  return platforms.sort((a, b) => {
    // Priority 1: Configured platforms first
    if (a.hasKey && !b.hasKey) return -1;
    if (!a.hasKey && b.hasKey) return 1;
    
    // Priority 2: Sort by usage score
    const scoreA = analytics.getPlatformScore(a.id);
    const scoreB = analytics.getPlatformScore(b.id);
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    // Priority 3: Required platforms
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    
    return 0;
  });
}

function renderSmartSuggestions() {
  const suggestionsContainer = document.getElementById('smart-suggestions');
  const suggestionsList = document.getElementById('suggestions-list');
  
  const configuredPlatforms = state.apiKeys.filter(p => p.hasKey).map(p => p.id);
  const recommendations = analytics.getRecommendations(state.apiKeys, configuredPlatforms);
  
  // Only show suggestions if we have recommendations and user has some activity
  if (recommendations.length === 0 || analytics.getTotalInteractions() < 5) {
    suggestionsContainer.style.display = 'none';
    return;
  }
  
  suggestionsContainer.style.display = 'block';
  
  suggestionsList.innerHTML = recommendations.map(rec => {
    const platform = state.apiKeys.find(p => p.id === rec.id);
    if (!platform) return '';
    
    const reasonText = {
      'frequently_used': '🔥 Frequently used',
      'model_downloads': '🎨 For models',
      'code_downloads': '💻 For code'
    }[rec.reason] || '✨ Recommended';
    
    return `
      <div class="suggestion-item" onclick="scrollToPlatform('${rec.id}')">
        <span class="suggestion-icon">${platform.icon}</span>
        <span class="suggestion-name">${platform.name}</span>
        <span class="suggestion-score">${reasonText}</span>
      </div>
    `;
  }).join('');
}

function updateUsageStats() {
  const configuredCount = state.apiKeys.filter(p => p.hasKey).length;
  const totalCount = state.apiKeys.length;
  const usageCount = analytics.getTotalInteractions();
  
  const statConfigured = document.getElementById('stat-configured');
  const statTotal = document.getElementById('stat-total');
  const statUsage = document.getElementById('stat-usage');
  
  if (statConfigured) statConfigured.textContent = configuredCount;
  if (statTotal) statTotal.textContent = totalCount;
  if (statUsage) statUsage.textContent = usageCount;
}

function scrollToPlatform(platformId) {
  // Expand list if needed
  state.apiKeysExpanded = true;
  state.apiKeysSearch = '';
  state.apiKeysFilter = 'all';
  
  // Reset filter chips
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.filter-chip[data-filter="all"]')?.classList.add('active');
  
  renderApiKeys();
  
  // Scroll to platform
  setTimeout(() => {
    const platformEl = document.querySelector(`[data-platform="${platformId}"]`);
    if (platformEl) {
      platformEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      platformEl.style.animation = 'none';
      platformEl.offsetHeight; // Trigger reflow
      platformEl.style.animation = 'fadeInSlide 0.5s ease';
    }
  }, 100);
  
  // Track this action
  analytics.trackPlatform(platformId, 'view');
}

function trackPlatformView(platformId) {
  analytics.trackPlatform(platformId, 'view');
}

async function configureApiKey(platformId, platformName) {
  // Track the configuration attempt
  analytics.trackPlatform(platformId, 'configure');
  
  const key = prompt(`Enter API key for ${platformName}:`);
  
  if (key === null) return; // Cancelled
  
  if (key === '') {
    // Delete key
    try {
      await fetch(`/api/keys/${platformId}`, { method: 'DELETE' });
      showToast(`${platformName} API key removed`, 'success');
      await loadApiKeys();
    } catch (error) {
      showToast('Failed to remove API key', 'error');
    }
    return;
  }
  
  try {
    const response = await fetch(`/api/keys/${platformId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showToast(`${platformName} API key saved!`, 'success');
      // Track successful configuration with higher weight
      analytics.trackPlatform(platformId, 'configure', 3);
      await loadApiKeys();
    } else {
      showToast(result.error || 'Invalid API key', 'error');
    }
  } catch (error) {
    showToast('Failed to save API key', 'error');
  }
}

// Expose functions globally
window.scrollToPlatform = scrollToPlatform;
window.trackPlatformView = trackPlatformView;

// ============================
// Batch Modal
// ============================
function openBatchModal() {
  elements.batchModal.style.display = 'flex';
  elements.batchUrls.focus();
}

function closeBatchModal() {
  elements.batchModal.style.display = 'none';
}

// ============================
// API & Status
// ============================
async function loadStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    state.platforms = data.platforms;
    
    // Update status badge
    const badge = document.getElementById('status-badge');
    if (data.status === 'online') {
      badge.querySelector('span:last-child').textContent = 'Online';
      badge.style.color = 'var(--success)';
    }
  } catch (error) {
    console.error('Failed to load status:', error);
  }
}

// ============================
// Toast Notifications
// ============================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================
// Utility Functions
// ============================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================
// Transcription Modal
// ============================

async function openTranscribeModal() {
  // Track transcribe feature usage
  analytics.trackFeature('transcribe');
  
  document.getElementById('transcribe-modal').style.display = 'flex';
  await checkWhisperStatus();
}

function closeTranscribeModal() {
  document.getElementById('transcribe-modal').style.display = 'none';
}

async function checkWhisperStatus() {
  const statusEl = document.getElementById('transcribe-status');
  
  try {
    const response = await fetch('/api/transcribe/status');
    const status = await response.json();
    
    if (status.installed) {
      statusEl.innerHTML = `
        <span class="status-icon">✅</span>
        <span class="status-text">Whisper installed (${status.type})</span>
      `;
      statusEl.classList.add('success');
    } else {
      statusEl.innerHTML = `
        <span class="status-icon">⚠️</span>
        <span class="status-text">Whisper not found - placeholder SRT files will be created</span>
      `;
    }
  } catch (e) {
    statusEl.innerHTML = `
      <span class="status-icon">❌</span>
      <span class="status-text">Could not check Whisper status</span>
    `;
  }
}

async function scanVideosForTranscription() {
  const videosEl = document.getElementById('transcribe-videos');
  videosEl.innerHTML = '<div class="empty-state small">Scanning...</div>';
  
  try {
    const response = await fetch('/api/scan/needs-transcription');
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      videosEl.innerHTML = data.results.map(video => `
        <div class="video-item">
          <span>🎬 ${video.name}</span>
          <span class="video-size">${video.sizeFormatted}</span>
        </div>
      `).join('');
    } else {
      videosEl.innerHTML = '<div class="empty-state small">No videos found needing transcription</div>';
    }
  } catch (e) {
    videosEl.innerHTML = `<div class="empty-state small">Error: ${e.message}</div>`;
  }
}

async function startTranscription() {
  const model = document.getElementById('transcribe-model').value;
  const language = document.getElementById('transcribe-language').value;
  
  showToast('Starting transcription...', 'info');
  
  try {
    const response = await fetch('/api/transcribe/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dirPath: null, // Uses default downloads folder
        model,
        language
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showToast(`Transcription complete: ${result.completed} files processed`, 'success');
      closeTranscribeModal();
    } else {
      showToast(result.error || 'Transcription failed', 'error');
    }
  } catch (e) {
    showToast('Transcription error: ' + e.message, 'error');
  }
}

// ============================
// Developer Tools Modal
// ============================

function openDevToolsModal() {
  // Track devtools feature usage
  analytics.trackFeature('devtools');
  
  document.getElementById('devtools-modal').style.display = 'flex';
  setupDevToolsTabs();
}

function closeDevToolsModal() {
  document.getElementById('devtools-modal').style.display = 'none';
}

function setupDevToolsTabs() {
  const tabs = document.querySelectorAll('.devtools-tabs .tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
    });
  });
}

async function scanAllFiles() {
  const resultsEl = document.getElementById('scan-results');
  resultsEl.innerHTML = '<div class="empty-state small">Scanning...</div>';
  
  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ includeHashes: false })
    });
    
    const data = await response.json();
    
    resultsEl.innerHTML = `
      <div class="scan-stat">
        <span class="label">Total Files</span>
        <span class="value">${data.stats.totalFiles}</span>
      </div>
      <div class="scan-stat">
        <span class="label">Total Directories</span>
        <span class="value">${data.stats.totalDirectories}</span>
      </div>
      <div class="scan-stat">
        <span class="label">Total Size</span>
        <span class="value">${data.stats.totalSizeFormatted}</span>
      </div>
      ${Object.entries(data.stats.byCategory || {}).map(([cat, info]) => `
        <div class="scan-stat">
          <span class="label">${cat}</span>
          <span class="value">${info.count} files</span>
        </div>
      `).join('')}
    `;
  } catch (e) {
    resultsEl.innerHTML = `<div class="empty-state small">Error: ${e.message}</div>`;
  }
}

async function scanMediaFiles() {
  const resultsEl = document.getElementById('scan-results');
  resultsEl.innerHTML = '<div class="empty-state small">Scanning for media...</div>';
  
  try {
    const response = await fetch('/api/scan/media');
    const data = await response.json();
    
    resultsEl.innerHTML = `
      <div class="scan-stat">
        <span class="label">Videos</span>
        <span class="value">${data.videos}</span>
      </div>
      <div class="scan-stat">
        <span class="label">Audio Files</span>
        <span class="value">${data.audio}</span>
      </div>
      <div class="scan-stat">
        <span class="label">Total Media</span>
        <span class="value">${data.total}</span>
      </div>
    `;
  } catch (e) {
    resultsEl.innerHTML = `<div class="empty-state small">Error: ${e.message}</div>`;
  }
}

async function scanModelFiles() {
  const resultsEl = document.getElementById('scan-results');
  resultsEl.innerHTML = '<div class="empty-state small">Scanning for AI models...</div>';
  
  try {
    const response = await fetch('/api/scan/models');
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      resultsEl.innerHTML = `
        <div class="scan-stat">
          <span class="label">AI Models Found</span>
          <span class="value">${data.total}</span>
        </div>
        ${data.results.slice(0, 10).map(model => `
          <div class="file-item">🧠 ${model.name} (${model.sizeFormatted})</div>
        `).join('')}
        ${data.total > 10 ? `<div class="file-item more">...and ${data.total - 10} more</div>` : ''}
      `;
    } else {
      resultsEl.innerHTML = '<div class="empty-state small">No AI models found</div>';
    }
  } catch (e) {
    resultsEl.innerHTML = `<div class="empty-state small">Error: ${e.message}</div>`;
  }
}

async function generateDirectoryTree() {
  const reportEl = document.getElementById('report-content');
  reportEl.innerHTML = '<div class="empty-state small">Generating tree...</div>';
  
  try {
    const response = await fetch('/api/scan/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxDepth: 4, showFiles: true })
    });
    
    const data = await response.json();
    reportEl.innerHTML = `<pre>${data.tree}</pre>`;
  } catch (e) {
    reportEl.innerHTML = `<div class="empty-state small">Error: ${e.message}</div>`;
  }
}

async function generateFullReport() {
  const reportEl = document.getElementById('report-content');
  reportEl.innerHTML = '<div class="empty-state small">Generating report...</div>';
  
  try {
    const response = await fetch('/api/scan/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ export: true })
    });
    
    const data = await response.json();
    
    reportEl.innerHTML = `
      <div class="scan-stat">
        <span class="label">Generated At</span>
        <span class="value">${new Date(data.generatedAt).toLocaleString()}</span>
      </div>
      <div class="scan-stat">
        <span class="label">Total Files</span>
        <span class="value">${data.summary.totalFiles}</span>
      </div>
      <div class="scan-stat">
        <span class="label">Total Size</span>
        <span class="value">${data.summary.totalSize}</span>
      </div>
      ${data.largestFiles.length > 0 ? `
        <h4 style="margin: 16px 0 8px;">Largest Files</h4>
        ${data.largestFiles.slice(0, 5).map(f => `
          <div class="file-item">${f.name} (${f.size})</div>
        `).join('')}
      ` : ''}
      ${data.videosNeedingTranscription.length > 0 ? `
        <h4 style="margin: 16px 0 8px;">Videos Needing Transcription</h4>
        ${data.videosNeedingTranscription.slice(0, 5).map(v => `
          <div class="file-item">🎬 ${v.name}</div>
        `).join('')}
      ` : ''}
      ${data.exportedFiles ? `
        <div style="margin-top: 16px; color: var(--success);">
          ✅ Report exported to downloads folder
        </div>
      ` : ''}
    `;
  } catch (e) {
    reportEl.innerHTML = `<div class="empty-state small">Error: ${e.message}</div>`;
  }
}

// Make functions globally available
window.openHistoryFolder = openHistoryFolder;
window.deleteHistoryItem = deleteHistoryItem;
window.configureApiKey = configureApiKey;

// ============================
// Additional Event Listeners
// ============================
function setupAdditionalListeners() {
  // Transcribe Modal
  document.getElementById('transcribe-btn').addEventListener('click', openTranscribeModal);
  document.querySelectorAll('.close-transcribe').forEach(btn => {
    btn.addEventListener('click', closeTranscribeModal);
  });
  document.getElementById('transcribe-backdrop').addEventListener('click', closeTranscribeModal);
  document.getElementById('scan-videos-btn').addEventListener('click', scanVideosForTranscription);
  document.getElementById('start-transcribe').addEventListener('click', startTranscription);
  
  // Dev Tools Modal
  document.getElementById('devtools-btn').addEventListener('click', openDevToolsModal);
  document.querySelectorAll('.close-devtools').forEach(btn => {
    btn.addEventListener('click', closeDevToolsModal);
  });
  document.getElementById('devtools-backdrop').addEventListener('click', closeDevToolsModal);
  document.getElementById('scan-all-btn').addEventListener('click', scanAllFiles);
  document.getElementById('scan-media-btn').addEventListener('click', scanMediaFiles);
  document.getElementById('scan-models-btn').addEventListener('click', scanModelFiles);
  document.getElementById('tree-btn').addEventListener('click', generateDirectoryTree);
  document.getElementById('report-btn').addEventListener('click', generateFullReport);
}

// ============================
// Start Application
// ============================
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupAdditionalListeners();
});
