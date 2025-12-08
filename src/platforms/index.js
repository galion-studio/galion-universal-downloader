/**
 * Platform Index
 * Exports all available platform modules
 */

export { CivitaiPlatform } from './CivitaiPlatform.js';
export { GithubPlatform } from './GithubPlatform.js';
export { YoutubePlatform } from './YoutubePlatform.js';
export { TelegramPlatform } from './TelegramPlatform.js';
export { GenericPlatform } from './GenericPlatform.js';

/**
 * Get all available platforms
 */
export function getAllPlatforms() {
  return {
    civitai: {
      module: () => import('./CivitaiPlatform.js'),
      name: 'CivitAI',
      icon: '🎨',
      description: 'AI Models, LoRAs, Images, Articles, Profiles',
      requiresAuth: false
    },
    github: {
      module: () => import('./GithubPlatform.js'),
      name: 'GitHub',
      icon: '🐙',
      description: 'Repositories, Releases, Gists, Files',
      requiresAuth: false
    },
    youtube: {
      module: () => import('./YoutubePlatform.js'),
      name: 'YouTube',
      icon: '🎬',
      description: 'Videos, Playlists, Channels',
      requiresAuth: false
    },
    telegram: {
      module: () => import('./TelegramPlatform.js'),
      name: 'Telegram',
      icon: '📨',
      description: 'Channels, Files, Media',
      requiresAuth: true
    },
    generic: {
      module: () => import('./GenericPlatform.js'),
      name: 'Generic',
      icon: '🌐',
      description: 'Universal downloader for any URL',
      requiresAuth: false
    }
  };
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

  platformManager.registerPlatform('civitai', new CivitaiPlatform());
  platformManager.registerPlatform('github', new GithubPlatform());
  platformManager.registerPlatform('youtube', new YoutubePlatform());
  platformManager.registerPlatform('telegram', new TelegramPlatform());
  platformManager.registerPlatform('generic', new GenericPlatform());

  return platformManager;
}

export default {
  getAllPlatforms,
  registerAllPlatforms
};
