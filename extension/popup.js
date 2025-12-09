/**
 * Galion Universal Downloader - Extension Popup Script
 */

// Platform emojis
const PLATFORM_EMOJIS = {
  youtube: '▶️',
  instagram: '📸',
  tiktok: '🎵',
  twitter: '🐦',
  reddit: '🔴',
  github: '🐙',
  civitai: '🎨',
  vimeo: '🎥',
  soundcloud: '🔊',
  facebook: '📘',
  twitch: '🎮',
  pinterest: '📌',
  generic: '🌐'
}

// DOM elements
const statusDot = document.getElementById('status-dot')
const statusText = document.getElementById('status-text')
const platformBadge = document.getElementById('platform-badge')
const pageUrl = document.getElementById('page-url')
const downloadCurrentBtn = document.getElementById('download-current')
const urlInput = document.getElementById('url-input')
const downloadBtn = document.getElementById('download-btn')
const qualitySelect = document.getElementById('quality-select')
const historyList = document.getElementById('history-list')
const openAppLink = document.getElementById('open-app')
const openSettingsLink = document.getElementById('open-settings')

let currentTab = null
let currentPlatform = 'generic'

// Initialize popup
async function init() {
  // Check backend status
  checkBackendStatus()

  // Get current tab info
  const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' })
  if (response) {
    currentTab = response
    updateCurrentPageInfo(response.url)
  }

  // Load history
  loadHistory()

  // Load saved quality preference
  const { quality } = await chrome.storage.local.get('quality')
  if (quality) {
    qualitySelect.value = quality
  }
}

// Check if backend is running
async function checkBackendStatus() {
  const response = await chrome.runtime.sendMessage({ type: 'CHECK_BACKEND' })
  
  if (response.online) {
    statusDot.classList.remove('offline')
    statusText.textContent = 'Backend connected'
  } else {
    statusDot.classList.add('offline')
    statusText.textContent = 'Backend offline - downloads will open in browser'
  }
}

// Update current page info
function updateCurrentPageInfo(url) {
  if (!url) return

  pageUrl.textContent = url.length > 40 ? url.substring(0, 40) + '...' : url

  // Detect platform
  chrome.runtime.sendMessage({ type: 'DETECT_PLATFORM', url }, (response) => {
    currentPlatform = response.platform
    const emoji = PLATFORM_EMOJIS[currentPlatform] || '🌐'
    platformBadge.textContent = `${emoji} ${currentPlatform}`
    
    // Enable/disable download button based on platform
    if (currentPlatform === 'generic' && !url.startsWith('http')) {
      downloadCurrentBtn.disabled = true
      downloadCurrentBtn.textContent = '❌ Not a downloadable page'
    } else {
      downloadCurrentBtn.disabled = false
      downloadCurrentBtn.textContent = `${emoji} Download from ${currentPlatform}`
    }
  })
}

// Load download history
async function loadHistory() {
  const history = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' })
  
  if (!history || history.length === 0) {
    historyList.innerHTML = '<div class="empty-state">No downloads yet</div>'
    return
  }

  historyList.innerHTML = history.slice(0, 10).map(item => {
    const emoji = PLATFORM_EMOJIS[item.platform] || '🌐'
    const timeAgo = getTimeAgo(item.startedAt)
    const shortUrl = item.url.length > 35 ? item.url.substring(0, 35) + '...' : item.url

    return `
      <div class="history-item" data-url="${encodeURIComponent(item.url)}">
        <span class="history-emoji">${emoji}</span>
        <div class="history-details">
          <div class="history-url">${shortUrl}</div>
          <div class="history-time">${timeAgo}</div>
        </div>
      </div>
    `
  }).join('')

  // Add click handlers
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const url = decodeURIComponent(item.dataset.url)
      urlInput.value = url
    })
  })
}

// Get relative time
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Download URL
async function downloadUrl(url) {
  if (!url) return

  const quality = qualitySelect.value

  // Save quality preference
  await chrome.storage.local.set({ quality })

  // Send download request
  downloadBtn.disabled = true
  downloadCurrentBtn.disabled = true
  downloadBtn.innerHTML = '<div class="spinner"></div>'

  try {
    await chrome.runtime.sendMessage({ type: 'DOWNLOAD_URL', url, quality })
    
    // Show success feedback
    downloadBtn.textContent = '✓'
    setTimeout(() => {
      downloadBtn.textContent = '⬇️'
      downloadBtn.disabled = false
      downloadCurrentBtn.disabled = false
    }, 2000)
    
    // Refresh history
    setTimeout(loadHistory, 500)
  } catch (error) {
    downloadBtn.textContent = '❌'
    setTimeout(() => {
      downloadBtn.textContent = '⬇️'
      downloadBtn.disabled = false
      downloadCurrentBtn.disabled = false
    }, 2000)
  }
}

// Event listeners
downloadCurrentBtn.addEventListener('click', () => {
  if (currentTab?.url) {
    downloadUrl(currentTab.url)
  }
})

downloadBtn.addEventListener('click', () => {
  downloadUrl(urlInput.value.trim())
})

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    downloadUrl(urlInput.value.trim())
  }
})

// Paste from clipboard on focus
urlInput.addEventListener('focus', async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text && text.startsWith('http') && !urlInput.value) {
      urlInput.value = text
    }
  } catch (e) {
    // Clipboard not available
  }
})

openAppLink.addEventListener('click', (e) => {
  e.preventDefault()
  chrome.tabs.create({ url: 'http://localhost:5173' })
})

openSettingsLink.addEventListener('click', (e) => {
  e.preventDefault()
  chrome.runtime.openOptionsPage()
})

// Initialize
init()
