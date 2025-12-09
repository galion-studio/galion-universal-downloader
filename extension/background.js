/**
 * Galion Universal Downloader - Extension Background Service Worker
 * Handles media detection, context menus, and API communication
 */

const API_BASE = 'http://localhost:3000/api'

// Platform detection patterns
const PLATFORM_PATTERNS = {
  youtube: /(?:youtube\.com|youtu\.be)/i,
  instagram: /instagram\.com/i,
  tiktok: /tiktok\.com/i,
  twitter: /(?:twitter\.com|x\.com)/i,
  reddit: /reddit\.com/i,
  github: /github\.com/i,
  civitai: /civitai\.com/i,
  vimeo: /vimeo\.com/i,
  soundcloud: /soundcloud\.com/i,
  facebook: /facebook\.com/i,
  twitch: /twitch\.tv/i,
  pinterest: /pinterest\./i
}

// Detect platform from URL
function detectPlatform(url) {
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) return platform
  }
  return 'generic'
}

// Get platform emoji
function getPlatformEmoji(platform) {
  const emojis = {
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
  return emojis[platform] || '🌐'
}

// Create context menus on install
chrome.runtime.onInstalled.addListener(() => {
  // Download link context menu
  chrome.contextMenus.create({
    id: 'galion-download-link',
    title: '⬇️ Download with Galion',
    contexts: ['link']
  })

  // Download page context menu  
  chrome.contextMenus.create({
    id: 'galion-download-page',
    title: '⬇️ Download this page media',
    contexts: ['page']
  })

  // Download selection context menu
  chrome.contextMenus.create({
    id: 'galion-download-selection',
    title: '⬇️ Download selected URL',
    contexts: ['selection']
  })

  // Download image context menu
  chrome.contextMenus.create({
    id: 'galion-download-image',
    title: '⬇️ Download image with Galion',
    contexts: ['image']
  })

  // Download video context menu
  chrome.contextMenus.create({
    id: 'galion-download-video',
    title: '⬇️ Download video with Galion',
    contexts: ['video']
  })

  console.log('Galion Extension: Context menus created')
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let url = null

  switch (info.menuItemId) {
    case 'galion-download-link':
      url = info.linkUrl
      break
    case 'galion-download-page':
      url = tab?.url
      break
    case 'galion-download-selection':
      url = extractUrl(info.selectionText)
      break
    case 'galion-download-image':
      url = info.srcUrl
      break
    case 'galion-download-video':
      url = info.srcUrl || info.pageUrl
      break
  }

  if (url) {
    await downloadUrl(url, tab)
  }
})

// Extract URL from text
function extractUrl(text) {
  if (!text) return null
  const urlMatch = text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i)
  return urlMatch ? urlMatch[0] : null
}

// Send download request to Galion backend
async function downloadUrl(url, tab) {
  const platform = detectPlatform(url)
  const emoji = getPlatformEmoji(platform)

  try {
    // First, try to check if backend is running
    const healthCheck = await fetch(`${API_BASE}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    }).catch(() => null)

    if (!healthCheck || !healthCheck.ok) {
      // Backend not running - open UI in new tab
      chrome.tabs.create({
        url: `http://localhost:5173/?url=${encodeURIComponent(url)}`
      })
      return
    }

    // Backend is running - send download request
    const response = await fetch(`${API_BASE}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    const result = await response.json()

    if (result.success) {
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `${emoji} Download Started`,
        message: `Downloading from ${platform}...`,
        priority: 2
      })

      // Store in history
      await saveToHistory({ url, platform, startedAt: Date.now() })
    } else {
      throw new Error(result.error || 'Download failed')
    }
  } catch (error) {
    console.error('Download error:', error)
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '❌ Download Error',
      message: error.message || 'Failed to start download',
      priority: 2
    })
  }
}

// Save download to extension storage
async function saveToHistory(item) {
  const { history = [] } = await chrome.storage.local.get('history')
  history.unshift({
    ...item,
    id: Date.now().toString()
  })
  // Keep last 100 items
  await chrome.storage.local.set({ 
    history: history.slice(0, 100) 
  })
}

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'DOWNLOAD_URL':
      downloadUrl(message.url, sender.tab)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }))
      return true // Keep channel open for async response

    case 'GET_HISTORY':
      chrome.storage.local.get('history')
        .then(data => sendResponse(data.history || []))
      return true

    case 'GET_CURRENT_TAB':
      chrome.tabs.query({ active: true, currentWindow: true })
        .then(tabs => sendResponse(tabs[0]))
      return true

    case 'DETECT_PLATFORM':
      sendResponse({ platform: detectPlatform(message.url) })
      return false

    case 'CHECK_BACKEND':
      fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) })
        .then(res => sendResponse({ online: res.ok }))
        .catch(() => sendResponse({ online: false }))
      return true
  }
})

// Handle clipboard monitoring (optional feature)
let clipboardMonitorEnabled = false

async function checkClipboard() {
  if (!clipboardMonitorEnabled) return

  try {
    const text = await navigator.clipboard.readText()
    const url = extractUrl(text)
    
    if (url) {
      const platform = detectPlatform(url)
      if (platform !== 'generic') {
        const { lastClipboardUrl } = await chrome.storage.local.get('lastClipboardUrl')
        
        if (url !== lastClipboardUrl) {
          await chrome.storage.local.set({ lastClipboardUrl: url })
          
          // Show notification offering to download
          chrome.notifications.create('clipboard-detected', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: `${getPlatformEmoji(platform)} URL Detected!`,
            message: `Click to download from ${platform}`,
            priority: 2,
            buttons: [{ title: 'Download' }]
          })
        }
      }
    }
  } catch (error) {
    // Clipboard access denied or empty - ignore
  }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === 'clipboard-detected' && buttonIndex === 0) {
    const { lastClipboardUrl } = await chrome.storage.local.get('lastClipboardUrl')
    if (lastClipboardUrl) {
      await downloadUrl(lastClipboardUrl)
    }
  }
})

// Toggle clipboard monitoring
chrome.storage.onChanged.addListener((changes) => {
  if (changes.clipboardMonitor) {
    clipboardMonitorEnabled = changes.clipboardMonitor.newValue
    if (clipboardMonitorEnabled) {
      setInterval(checkClipboard, 2000)
    }
  }
})

// Initialize clipboard monitor setting
chrome.storage.local.get('clipboardMonitor').then(({ clipboardMonitor }) => {
  clipboardMonitorEnabled = clipboardMonitor || false
})

console.log('Galion Extension: Background service worker started')
