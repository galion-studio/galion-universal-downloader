/**
 * Platform Index
 * Exports all available platform modules
 * Galion Universal Downloader - Download from ANY platform
 */

export { CivitaiPlatform } from './CivitaiPlatform.js';
export { GithubPlatform } from './GithubPlatform.js';
export { YoutubePlatform } from './YoutubePlatform.js';
export { TelegramPlatform } from './TelegramPlatform.js';
export { GenericPlatform } from './GenericPlatform.js';
export { InstagramPlatform } from './InstagramPlatform.js';
export { TikTokPlatform } from './TikTokPlatform.js';
export { TwitterPlatform } from './TwitterPlatform.js';
export { RedditPlatform } from './RedditPlatform.js';

/**
 * Get all available platforms
 */
export function getAllPlatforms() {
  return {
    // AI & Models
    civitai: {
      module: () => import('./CivitaiPlatform.js'),
      name: 'CivitAI',
      icon: '🎨',
      emoji: '🎨',
      description: 'AI Models, LoRAs, Images, Articles, Profiles',
      requiresAuth: false,
      category: 'ai'
    },
    huggingface: {
      module: () => import('./GenericPlatform.js'),
      name: 'HuggingFace',
      icon: '🤗',
      emoji: '🤗',
      description: 'ML Models, Datasets, Spaces',
      requiresAuth: false,
      category: 'ai'
    },
    
    // Code & Development
    github: {
      module: () => import('./GithubPlatform.js'),
      name: 'GitHub',
      icon: '🐙',
      emoji: '🐙',
      description: 'Repositories, Releases, Gists, Files',
      requiresAuth: false,
      category: 'code'
    },
    
    // Video Platforms
    youtube: {
      module: () => import('./YoutubePlatform.js'),
      name: 'YouTube',
      icon: '🎬',
      emoji: '▶️',
      description: 'Videos, Playlists, Channels, Shorts',
      requiresAuth: false,
      category: 'video'
    },
    tiktok: {
      module: () => import('./TikTokPlatform.js'),
      name: 'TikTok',
      icon: '🎵',
      emoji: '🎵',
      description: 'Videos, Sounds, Profiles, Slideshows',
      requiresAuth: false,
      category: 'video'
    },
    vimeo: {
      module: () => import('./GenericPlatform.js'),
      name: 'Vimeo',
      icon: '🎬',
      emoji: '🎥',
      description: 'Videos, Channels, Showcases',
      requiresAuth: false,
      category: 'video'
    },
    dailymotion: {
      module: () => import('./GenericPlatform.js'),
      name: 'Dailymotion',
      icon: '📺',
      emoji: '📺',
      description: 'Videos, Playlists, Channels',
      requiresAuth: false,
      category: 'video'
    },
    
    // Social Media
    instagram: {
      module: () => import('./InstagramPlatform.js'),
      name: 'Instagram',
      icon: '📸',
      emoji: '📸',
      description: 'Posts, Reels, Stories, IGTV, Profiles',
      requiresAuth: false,
      category: 'social'
    },
    twitter: {
      module: () => import('./TwitterPlatform.js'),
      name: 'Twitter/X',
      icon: '🐦',
      emoji: '🐦',
      description: 'Tweets, Videos, GIFs, Spaces, Threads',
      requiresAuth: false,
      category: 'social'
    },
    facebook: {
      module: () => import('./GenericPlatform.js'),
      name: 'Facebook',
      icon: '📘',
      emoji: '📘',
      description: 'Videos, Photos, Stories, Reels',
      requiresAuth: true,
      category: 'social'
    },
    reddit: {
      module: () => import('./RedditPlatform.js'),
      name: 'Reddit',
      icon: '🔴',
      emoji: '🔴',
      description: 'Posts, Videos, Galleries, GIFs',
      requiresAuth: false,
      category: 'social'
    },
    pinterest: {
      module: () => import('./GenericPlatform.js'),
      name: 'Pinterest',
      icon: '📌',
      emoji: '📌',
      description: 'Pins, Boards, Videos',
      requiresAuth: false,
      category: 'social'
    },
    tumblr: {
      module: () => import('./GenericPlatform.js'),
      name: 'Tumblr',
      icon: '📝',
      emoji: '📝',
      description: 'Posts, Images, Videos, Blogs',
      requiresAuth: false,
      category: 'social'
    },
    
    // Messaging
    telegram: {
      module: () => import('./TelegramPlatform.js'),
      name: 'Telegram',
      icon: '📨',
      emoji: '✈️',
      description: 'Channels, Files, Media, Stickers',
      requiresAuth: true,
      category: 'messaging'
    },
    discord: {
      module: () => import('./GenericPlatform.js'),
      name: 'Discord',
      icon: '💬',
      emoji: '💬',
      description: 'Attachments, Emojis, Stickers',
      requiresAuth: true,
      category: 'messaging'
    },
    
    // Music & Audio
    soundcloud: {
      module: () => import('./GenericPlatform.js'),
      name: 'SoundCloud',
      icon: '🔊',
      emoji: '🔊',
      description: 'Tracks, Playlists, Artists',
      requiresAuth: false,
      category: 'audio'
    },
    spotify: {
      module: () => import('./GenericPlatform.js'),
      name: 'Spotify',
      icon: '🎧',
      emoji: '🎧',
      description: 'Track info, Playlists, Podcasts',
      requiresAuth: true,
      category: 'audio'
    },
    bandcamp: {
      module: () => import('./GenericPlatform.js'),
      name: 'Bandcamp',
      icon: '🎸',
      emoji: '🎸',
      description: 'Albums, Tracks, Artists',
      requiresAuth: false,
      category: 'audio'
    },
    
    // Image Hosting
    imgur: {
      module: () => import('./GenericPlatform.js'),
      name: 'Imgur',
      icon: '🖼️',
      emoji: '🖼️',
      description: 'Images, Albums, GIFs',
      requiresAuth: false,
      category: 'images'
    },
    flickr: {
      module: () => import('./GenericPlatform.js'),
      name: 'Flickr',
      icon: '📷',
      emoji: '📷',
      description: 'Photos, Albums, Photostreams',
      requiresAuth: false,
      category: 'images'
    },
    artstation: {
      module: () => import('./GenericPlatform.js'),
      name: 'ArtStation',
      icon: '🎨',
      emoji: '🎨',
      description: 'Artwork, Projects, Artists',
      requiresAuth: false,
      category: 'images'
    },
    deviantart: {
      module: () => import('./GenericPlatform.js'),
      name: 'DeviantArt',
      icon: '🖌️',
      emoji: '🖌️',
      description: 'Artwork, Galleries, Artists',
      requiresAuth: false,
      category: 'images'
    },
    
    // Cloud Storage
    googledrive: {
      module: () => import('./GenericPlatform.js'),
      name: 'Google Drive',
      icon: '📁',
      emoji: '📁',
      description: 'Files, Folders, Documents',
      requiresAuth: true,
      category: 'cloud'
    },
    dropbox: {
      module: () => import('./GenericPlatform.js'),
      name: 'Dropbox',
      icon: '📦',
      emoji: '📦',
      description: 'Files, Folders, Shared Links',
      requiresAuth: true,
      category: 'cloud'
    },
    mega: {
      module: () => import('./GenericPlatform.js'),
      name: 'MEGA',
      icon: '☁️',
      emoji: '☁️',
      description: 'Files, Folders, Encrypted Storage',
      requiresAuth: false,
      category: 'cloud'
    },
    
    // Adult Platforms (18+)
    pornhub: {
      module: () => import('./GenericPlatform.js'),
      name: 'PornHub',
      icon: '🔞',
      emoji: '🔞',
      description: 'Videos (Age Restricted)',
      requiresAuth: false,
      category: 'adult',
      ageRestricted: true
    },
    xvideos: {
      module: () => import('./GenericPlatform.js'),
      name: 'XVideos',
      icon: '🔞',
      emoji: '🔞',
      description: 'Videos (Age Restricted)',
      requiresAuth: false,
      category: 'adult',
      ageRestricted: true
    },
    
    // Streaming Platforms
    twitch: {
      module: () => import('./GenericPlatform.js'),
      name: 'Twitch',
      icon: '🎮',
      emoji: '🎮',
      description: 'VODs, Clips, Streams',
      requiresAuth: false,
      category: 'streaming'
    },
    kick: {
      module: () => import('./GenericPlatform.js'),
      name: 'Kick',
      icon: '🦶',
      emoji: '🦶',
      description: 'VODs, Clips, Streams',
      requiresAuth: false,
      category: 'streaming'
    },
    
    // News & Articles
    medium: {
      module: () => import('./GenericPlatform.js'),
      name: 'Medium',
      icon: '📰',
      emoji: '📰',
      description: 'Articles, Publications',
      requiresAuth: false,
      category: 'articles'
    },
    substack: {
      module: () => import('./GenericPlatform.js'),
      name: 'Substack',
      icon: '✉️',
      emoji: '✉️',
      description: 'Newsletters, Articles',
      requiresAuth: false,
      category: 'articles'
    },
    
    // Generic fallback for any URL
    generic: {
      module: () => import('./GenericPlatform.js'),
      name: 'Generic',
      icon: '🌐',
      emoji: '🌐',
      description: 'Universal downloader for any URL',
      requiresAuth: false,
      category: 'generic'
    }
  };
}

/**
 * Get platforms by category
 */
export function getPlatformsByCategory(category) {
  const all = getAllPlatforms();
  return Object.entries(all)
    .filter(([_, p]) => p.category === category)
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
}

/**
 * Get platform categories
 */
export function getCategories() {
  return {
    ai: { name: 'AI & Models', icon: '🤖' },
    code: { name: 'Code & Dev', icon: '💻' },
    video: { name: 'Video', icon: '🎬' },
    social: { name: 'Social Media', icon: '📱' },
    messaging: { name: 'Messaging', icon: '💬' },
    audio: { name: 'Music & Audio', icon: '🎵' },
    images: { name: 'Images', icon: '🖼️' },
    cloud: { name: 'Cloud Storage', icon: '☁️' },
    streaming: { name: 'Streaming', icon: '📺' },
    articles: { name: 'News & Articles', icon: '📰' },
    adult: { name: 'Adult (18+)', icon: '🔞' },
    generic: { name: 'Other', icon: '🌐' }
  };
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url) {
  if (!url) return null;
  
  const patterns = {
    civitai: /civitai\.com/,
    huggingface: /huggingface\.co|hf\.co/,
    github: /github\.com/,
    youtube: /youtube\.com|youtu\.be/,
    tiktok: /tiktok\.com|vm\.tiktok\.com/,
    vimeo: /vimeo\.com/,
    dailymotion: /dailymotion\.com/,
    instagram: /instagram\.com|instagr\.am/,
    twitter: /twitter\.com|x\.com|t\.co/,
    facebook: /facebook\.com|fb\.com|fb\.watch/,
    reddit: /reddit\.com|redd\.it/,
    pinterest: /pinterest\./,
    tumblr: /tumblr\.com/,
    telegram: /t\.me|telegram/,
    discord: /discord\.com|discord\.gg/,
    soundcloud: /soundcloud\.com/,
    spotify: /spotify\.com/,
    bandcamp: /bandcamp\.com/,
    imgur: /imgur\.com/,
    flickr: /flickr\.com/,
    artstation: /artstation\.com/,
    deviantart: /deviantart\.com/,
    googledrive: /drive\.google\.com/,
    dropbox: /dropbox\.com/,
    mega: /mega\.nz|mega\.co\.nz/,
    twitch: /twitch\.tv/,
    kick: /kick\.com/,
    medium: /medium\.com/,
    substack: /substack\.com/,
    pornhub: /pornhub\.com/,
    xvideos: /xvideos\.com/
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }

  return 'generic';
}

/**
 * Create and register all platforms with a PlatformManager
 */
export async function registerAllPlatforms(platformManager) {
  const { CivitaiPlatform } = await import('./CivitaiPlatform.js');
  const { GithubPlatform } = await import('./GithubPlatform.js');
  const { YoutubePlatform } = await import('./YoutubePlatform.js');
  const { TelegramPlatform } = await import('./TelegramPlatform.js');
  const { GenericPlatform } = await import('./GenericPlatform.js');
  const { InstagramPlatform } = await import('./InstagramPlatform.js');
  const { TikTokPlatform } = await import('./TikTokPlatform.js');
  const { TwitterPlatform } = await import('./TwitterPlatform.js');
  const { RedditPlatform } = await import('./RedditPlatform.js');

  // Register all platform instances
  platformManager.registerPlatform('civitai', new CivitaiPlatform());
  platformManager.registerPlatform('github', new GithubPlatform());
  platformManager.registerPlatform('youtube', new YoutubePlatform());
  platformManager.registerPlatform('telegram', new TelegramPlatform());
  platformManager.registerPlatform('instagram', new InstagramPlatform());
  platformManager.registerPlatform('tiktok', new TikTokPlatform());
  platformManager.registerPlatform('twitter', new TwitterPlatform());
  platformManager.registerPlatform('reddit', new RedditPlatform());
  
  // Generic platform as fallback for all other URLs
  platformManager.registerPlatform('generic', new GenericPlatform());
  
  // Register generic platform for other services (they'll use yt-dlp or direct download)
  const genericPlatform = new GenericPlatform();
  const genericPlatforms = [
    'huggingface', 'vimeo', 'dailymotion', 'facebook', 'pinterest', 'tumblr',
    'discord', 'soundcloud', 'spotify', 'bandcamp', 'imgur', 'flickr',
    'artstation', 'deviantart', 'googledrive', 'dropbox', 'mega',
    'twitch', 'kick', 'medium', 'substack', 'pornhub', 'xvideos'
  ];
  
  for (const p of genericPlatforms) {
    platformManager.registerPlatform(p, genericPlatform);
  }

  return platformManager;
}

export default {
  getAllPlatforms,
  getPlatformsByCategory,
  getCategories,
  detectPlatform,
  registerAllPlatforms
};
