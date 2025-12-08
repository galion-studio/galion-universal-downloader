/**
 * Galion Ecosystem Configuration
 * 
 * "Your Only Limit Is Your Imagination"
 * 
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

// Platform-specific API configs
export const PLATFORM_APIS = {
  civitai: {
    name: 'CivitAI',
    baseUrl: 'https://civitai.com/api/v1',
    rateLimit: 10, // requests per minute without API key
  },
  github: {
    name: 'GitHub',
    baseUrl: 'https://api.github.com',
    rateLimit: 60, // requests per hour without token
  },
  youtube: {
    name: 'YouTube',
    baseUrl: 'https://www.youtube.com',
    useCobalt: true, // Use cobalt.tools for download
  },
  telegram: {
    name: 'Telegram',
    requiresAuth: true,
  },
  huggingface: {
    name: 'HuggingFace',
    baseUrl: 'https://huggingface.co',
    apiUrl: 'https://huggingface.co/api',
  },
}

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

// Taglines for the app
export const TAGLINES = {
  main: 'Your Only Limit Is Your Imagination',
  download: 'Download Everything. From Everywhere. Effortlessly.',
  cognitive: 'AI-Powered Insights for Your Content',
  ecosystem: 'Part of the Galion Ecosystem',
}

// Social Links
export const SOCIAL_LINKS = {
  github: 'https://github.com/galion-studio/galion-universal-downloader',
  galionApp: 'https://galion.app',
  huggingFace: 'https://huggingface.co/galion-studio',
  twitter: 'https://twitter.com/galion_app',
}

export default GALION_ECOSYSTEM
