/**
 * Galion Universal Downloader - Content Script
 * Injects download buttons into YouTube, Instagram, TikTok, and Twitter
 */

(function() {
  'use strict'

  // Check if already injected
  if (window.__galionInjected) return
  window.__galionInjected = true

  const BUTTON_ID = 'galion-download-btn'
  
  // Create download button element
  function createDownloadButton(options = {}) {
    const btn = document.createElement('button')
    btn.id = options.id || BUTTON_ID
    btn.className = 'galion-btn'
    btn.innerHTML = `
      <span class="galion-icon">⬇️</span>
      <span class="galion-text">${options.text || 'Download'}</span>
    `
    btn.title = 'Download with Galion'
    
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const url = options.getUrl ? options.getUrl() : window.location.href
      if (url) {
        downloadUrl(url)
      }
    })
    
    return btn
  }

  // Send download request to background script
  function downloadUrl(url) {
    chrome.runtime.sendMessage({ 
      type: 'DOWNLOAD_URL', 
      url 
    }, (response) => {
      if (response?.success) {
        showNotification('Download started!', 'success')
      } else {
        showNotification(response?.error || 'Download failed', 'error')
      }
    })
  }

  // Show inline notification
  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.galion-notification')
    if (existing) existing.remove()

    const notification = document.createElement('div')
    notification.className = `galion-notification galion-notification-${type}`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add('galion-notification-hide')
      setTimeout(() => notification.remove(), 300)
    }, 2500)
  }

  // ===============================
  // YOUTUBE INTEGRATION
  // ===============================
  function injectYouTube() {
    const observer = new MutationObserver(() => {
      // Video page - add button next to subscribe
      const actionsContainer = document.querySelector('#top-row #actions, ytd-watch-metadata #actions')
      if (actionsContainer && !actionsContainer.querySelector(`#${BUTTON_ID}`)) {
        const btn = createDownloadButton({
          text: 'Download',
          getUrl: () => window.location.href
        })
        btn.style.marginLeft = '8px'
        actionsContainer.insertBefore(btn, actionsContainer.firstChild)
      }

      // Playlist - add download all button
      const playlistHeader = document.querySelector('ytd-playlist-header-renderer #top-level-buttons-computed')
      if (playlistHeader && !playlistHeader.querySelector(`#${BUTTON_ID}-playlist`)) {
        const btn = createDownloadButton({
          id: `${BUTTON_ID}-playlist`,
          text: 'Download Playlist',
          getUrl: () => window.location.href
        })
        playlistHeader.appendChild(btn)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  // ===============================
  // INSTAGRAM INTEGRATION
  // ===============================
  function injectInstagram() {
    const observer = new MutationObserver(() => {
      // Post page
      const postActions = document.querySelectorAll('article section')
      postActions.forEach(section => {
        if (section.querySelector('.galion-btn')) return
        
        // Find the save button area
        const saveBtn = section.querySelector('[aria-label*="Save"], svg[aria-label*="Save"]')?.closest('button')?.parentElement
        if (saveBtn && !saveBtn.querySelector('.galion-btn')) {
          const btn = createDownloadButton({
            text: '',
            getUrl: () => {
              // Try to get the direct post URL
              const article = section.closest('article')
              const link = article?.querySelector('a[href*="/p/"], a[href*="/reel/"]')
              return link?.href || window.location.href
            }
          })
          btn.style.marginLeft = '8px'
          saveBtn.parentElement.appendChild(btn)
        }
      })

      // Story/Reel viewer
      const storyContainer = document.querySelector('[role="presentation"] video, [role="dialog"] video')
      if (storyContainer) {
        const parent = storyContainer.closest('[role="presentation"], [role="dialog"]')
        if (parent && !parent.querySelector('.galion-btn')) {
          const btn = createDownloadButton({
            text: 'Download',
            getUrl: () => window.location.href
          })
          btn.classList.add('galion-btn-floating')
          parent.appendChild(btn)
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  // ===============================
  // TIKTOK INTEGRATION
  // ===============================
  function injectTikTok() {
    const observer = new MutationObserver(() => {
      // Video page actions
      const videoContainers = document.querySelectorAll('[data-e2e="browse-video"]')
      videoContainers.forEach(container => {
        const actionBar = container.querySelector('[class*="ActionBar"]')
        if (actionBar && !actionBar.querySelector('.galion-btn')) {
          const btn = createDownloadButton({
            text: '',
            getUrl: () => {
              const link = container.querySelector('a[href*="/@"]')
              return link?.href || window.location.href
            }
          })
          btn.classList.add('galion-btn-tiktok')
          actionBar.appendChild(btn)
        }
      })

      // Single video page
      const mainContainer = document.querySelector('[class*="DivVideoContainer"]')
      if (mainContainer && !document.querySelector(`.galion-btn-main`)) {
        const btn = createDownloadButton({
          text: 'Download (No Watermark)',
          getUrl: () => window.location.href
        })
        btn.classList.add('galion-btn-main')
        btn.style.position = 'fixed'
        btn.style.bottom = '100px'
        btn.style.right = '20px'
        btn.style.zIndex = '9999'
        document.body.appendChild(btn)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  // ===============================
  // TWITTER/X INTEGRATION
  // ===============================
  function injectTwitter() {
    const observer = new MutationObserver(() => {
      // Tweet actions
      const tweets = document.querySelectorAll('article[data-testid="tweet"]')
      tweets.forEach(tweet => {
        const actions = tweet.querySelector('[role="group"]')
        if (actions && !actions.querySelector('.galion-btn')) {
          // Check if tweet has media
          const hasMedia = tweet.querySelector('video, [data-testid="tweetPhoto"]')
          if (hasMedia) {
            const btn = createDownloadButton({
              text: '',
              getUrl: () => {
                const link = tweet.querySelector('a[href*="/status/"]')
                return link?.href || window.location.href
              }
            })
            btn.classList.add('galion-btn-twitter')
            actions.appendChild(btn)
          }
        }
      })

      // Video player overlay
      const videoPlayer = document.querySelector('[data-testid="videoPlayer"]')
      if (videoPlayer && !videoPlayer.querySelector('.galion-btn')) {
        const btn = createDownloadButton({
          text: 'Download',
          getUrl: () => window.location.href
        })
        btn.classList.add('galion-btn-floating')
        videoPlayer.appendChild(btn)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  // ===============================
  // INITIALIZATION
  // ===============================
  function init() {
    const host = window.location.hostname

    if (host.includes('youtube.com')) {
      injectYouTube()
    } else if (host.includes('instagram.com')) {
      injectInstagram()
    } else if (host.includes('tiktok.com')) {
      injectTikTok()
    } else if (host.includes('twitter.com') || host.includes('x.com')) {
      injectTwitter()
    }

    console.log('Galion Downloader: Content script loaded for', host)
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
