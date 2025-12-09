/**
 * 🏴‍☠️ Galion Ecosystem Configuration
 * 
 * "Information Wants To Be Free"
 * 
 * The People's Universal Downloader
 * Connect to galion.app, HuggingFace, and other Galion ecosystem services
 */

// Galion Ecosystem API Endpoints
export const GALION_ECOSYSTEM = {
  // Main Galion API Backend
  api: {
    base: 'https://api.galion.app',
    download: '/v1/download',
    cognitive: '/v1/cognitive',
    chat: '/v1/chat',
    health: '/health',
  },
  
  // Galion.app - Talk to Galion AI
  galionApp: {
    url: 'https://galion.app',
    chat: 'https://galion.app/chat',
    websocket: 'wss://api.galion.app/ws',
  },
  
  // Galion Studio - Developer Portal
  galionStudio: {
    url: 'https://galion.studio',
    api: 'https://developer.galion.app',
  },
  
  // HuggingFace Integration
  huggingFace: {
    api: 'https://api-inference.huggingface.co',
    models: 'https://huggingface.co/models',
    spaces: 'https://huggingface.co/spaces',
  },
  
  // Demo/Serverless Mode Config
  demo: {
    enabled: true,
    localStorage: true, // Store in browser only
    mockDownloads: true, // Simulate downloads in demo mode
  },
}

// Ecosystem Feature Flags
export const FEATURES = {
  galionChat: true,        // Enable chat with Galion AI
  huggingFace: true,       // Enable HuggingFace model downloads
  cognitiveEngine: true,   // Enable AI-powered insights
  offlineMode: true,       // Works offline with local storage
  cloudSync: false,        // Sync to Galion cloud (future)
}

// Platform-specific API configs - 30+ Platforms Supported
export const PLATFORM_APIS = {
  // AI & Models
  civitai: {
    name: 'CivitAI',
    baseUrl: 'https://civitai.com/api/v1',
    rateLimit: 10,
    icon: '🎨',
    category: 'ai',
  },
  huggingface: {
    name: 'HuggingFace',
    baseUrl: 'https://huggingface.co',
    apiUrl: 'https://huggingface.co/api',
    icon: '🤗',
    category: 'ai',
  },
  
  // Code & Development
  github: {
    name: 'GitHub',
    baseUrl: 'https://api.github.com',
    rateLimit: 60,
    icon: '🐙',
    category: 'code',
  },
  
  // Video Platforms
  youtube: {
    name: 'YouTube',
    baseUrl: 'https://www.youtube.com',
    useCobalt: true,
    icon: '▶️',
    category: 'video',
  },
  tiktok: {
    name: 'TikTok',
    baseUrl: 'https://www.tikwm.com/api',
    icon: '🎵',
    category: 'video',
  },
  vimeo: {
    name: 'Vimeo',
    baseUrl: 'https://vimeo.com',
    icon: '🎥',
    category: 'video',
  },
  twitch: {
    name: 'Twitch',
    baseUrl: 'https://www.twitch.tv',
    icon: '🎮',
    category: 'streaming',
  },
  
  // Social Media
  instagram: {
    name: 'Instagram',
    baseUrl: 'https://instagram.com',
    requiresSession: true,
    icon: '📸',
    category: 'social',
  },
  twitter: {
    name: 'Twitter/X',
    baseUrl: 'https://twitter.com',
    icon: '🐦',
    category: 'social',
  },
  reddit: {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    jsonApi: true,
    icon: '🔴',
    category: 'social',
  },
  facebook: {
    name: 'Facebook',
    baseUrl: 'https://facebook.com',
    requiresAuth: true,
    icon: '📘',
    category: 'social',
  },
  pinterest: {
    name: 'Pinterest',
    baseUrl: 'https://pinterest.com',
    icon: '📌',
    category: 'social',
  },
  
  // Messaging
  telegram: {
    name: 'Telegram',
    requiresAuth: true,
    icon: '✈️',
    category: 'messaging',
  },
  discord: {
    name: 'Discord',
    requiresAuth: true,
    icon: '💬',
    category: 'messaging',
  },
  
  // Audio
  soundcloud: {
    name: 'SoundCloud',
    baseUrl: 'https://soundcloud.com',
    icon: '🔊',
    category: 'audio',
  },
  spotify: {
    name: 'Spotify',
    baseUrl: 'https://spotify.com',
    infoOnly: true,
    icon: '🎧',
    category: 'audio',
  },
  bandcamp: {
    name: 'Bandcamp',
    baseUrl: 'https://bandcamp.com',
    icon: '🎸',
    category: 'audio',
  },
  
  // Image Hosting
  imgur: {
    name: 'Imgur',
    baseUrl: 'https://imgur.com',
    icon: '🖼️',
    category: 'images',
  },
  flickr: {
    name: 'Flickr',
    baseUrl: 'https://flickr.com',
    icon: '📷',
    category: 'images',
  },
  
  // Cloud Storage
  googledrive: {
    name: 'Google Drive',
    baseUrl: 'https://drive.google.com',
    requiresAuth: true,
    icon: '📁',
    category: 'cloud',
  },
  dropbox: {
    name: 'Dropbox',
    baseUrl: 'https://dropbox.com',
    requiresAuth: true,
    icon: '📦',
    category: 'cloud',
  },
  mega: {
    name: 'MEGA',
    baseUrl: 'https://mega.nz',
    icon: '☁️',
    category: 'cloud',
  },
}

// Platform categories
export const PLATFORM_CATEGORIES = {
  ai: { name: 'AI & Models', icon: '🤖', platforms: ['civitai', 'huggingface'] },
  code: { name: 'Development', icon: '💻', platforms: ['github'] },
  video: { name: 'Video', icon: '🎬', platforms: ['youtube', 'tiktok', 'vimeo'] },
  streaming: { name: 'Streaming', icon: '📺', platforms: ['twitch'] },
  social: { name: 'Social Media', icon: '📱', platforms: ['instagram', 'twitter', 'reddit', 'facebook', 'pinterest'] },
  messaging: { name: 'Messaging', icon: '💬', platforms: ['telegram', 'discord'] },
  audio: { name: 'Audio', icon: '🎵', platforms: ['soundcloud', 'spotify', 'bandcamp'] },
  images: { name: 'Images', icon: '🖼️', platforms: ['imgur', 'flickr'] },
  cloud: { name: 'Cloud Storage', icon: '☁️', platforms: ['googledrive', 'dropbox', 'mega'] },
}

// Total supported platforms count
export const TOTAL_PLATFORMS = Object.keys(PLATFORM_APIS).length

// Galion AI Chat Configuration
export interface GalionChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

// Connect to Galion AI Chat
export async function connectToGalionChat(): Promise<WebSocket | null> {
  if (typeof window === 'undefined') return null
  
  try {
    const ws = new WebSocket(GALION_ECOSYSTEM.galionApp.websocket)
    return ws
  } catch (error) {
    console.warn('Galion chat connection unavailable - running in demo mode')
    return null
  }
}

// HuggingFace Model Detection
export function detectHuggingFaceUrl(url: string): boolean {
  return url.includes('huggingface.co') || url.includes('hf.co')
}

// Parse HuggingFace URL
export interface HuggingFaceModel {
  owner: string
  model: string
  file?: string
  type: 'model' | 'dataset' | 'space'
}

export function parseHuggingFaceUrl(url: string): HuggingFaceModel | null {
  const patterns = [
    /huggingface\.co\/([^/]+)\/([^/]+)(?:\/blob\/main\/(.+))?/,
    /hf\.co\/([^/]+)\/([^/]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return {
        owner: match[1],
        model: match[2],
        file: match[3],
        type: 'model',
      }
    }
  }
  
  return null
}

// Taglines for the app - Pirate/Freedom theme
export const TAGLINES = {
  main: '🏴‍☠️ Information Wants To Be Free',
  download: 'Navigate the Digital Seas • Archive Everything • Free Your Data',
  cognitive: 'Your AI Navigator - Charting the Information Ocean',
  ecosystem: 'Join the Fleet • Open Source Forever',
  manifesto: 'We are the archivists of the digital age. We download, we preserve, we share.',
  motto: 'In a world of walled gardens, be a pirate.',
}

// Social Links
export const SOCIAL_LINKS = {
  github: 'https://github.com/galion-studio/galion-universal-downloader',
  galionApp: 'https://galion.app',
  huggingFace: 'https://huggingface.co/galion-studio',
  twitter: 'https://twitter.com/galion_app',
}

export default GALION_ECOSYSTEM
