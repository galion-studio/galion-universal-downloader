/**
 * API Key Manager
 * Secure storage and management of API keys for all platforms
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ApiKeyManager {
  constructor(options = {}) {
    this.configDir = options.configDir || path.join(process.cwd(), '.runpod');
    this.keysFile = path.join(this.configDir, 'api-keys.json');
    this.encryptionKey = options.encryptionKey || this.getOrCreateEncryptionKey();
    this.keys = new Map();
    this.platformInfo = this.getPlatformInfo();
  }

  /**
   * Platform configuration and API info
   */
  getPlatformInfo() {
    return {
      civitai: {
        name: 'CivitAI',
        icon: '🎨',
        description: 'AI Art Models, LoRAs, Images, Articles',
        apiUrl: 'https://civitai.com/user/account',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: false
      },
      github: {
        name: 'GitHub',
        icon: '🐙',
        description: 'Repositories, Gists, Releases, Files',
        apiUrl: 'https://github.com/settings/tokens',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: false
      },
      instagram: {
        name: 'Instagram',
        icon: '📸',
        description: 'Posts, Stories, Reels, Profiles',
        apiUrl: 'https://developers.facebook.com/apps',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: true
      },
      facebook: {
        name: 'Facebook',
        icon: '📘',
        description: 'Posts, Videos, Photos, Profiles',
        apiUrl: 'https://developers.facebook.com/apps',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: true
      },
      telegram: {
        name: 'Telegram',
        icon: '📨',
        description: 'Messages, Files, Channels, Groups',
        apiUrl: 'https://my.telegram.org/apps',
        authHeader: null,
        authFormat: null,
        required: true,
        note: 'Requires Bot Token or API ID/Hash'
      },
      whatsapp: {
        name: 'WhatsApp',
        icon: '💬',
        description: 'Messages, Media, Status',
        apiUrl: 'https://developers.facebook.com/apps',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: true
      },
      youtube: {
        name: 'YouTube',
        icon: '🎬',
        description: 'Videos, Playlists, Channels',
        apiUrl: 'https://console.cloud.google.com/apis/credentials',
        authHeader: null,
        authFormat: 'key={key}',
        required: false
      },
      twitter: {
        name: 'Twitter/X',
        icon: '🐦',
        description: 'Tweets, Media, Profiles',
        apiUrl: 'https://developer.twitter.com/en/portal/dashboard',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: true
      },
      tiktok: {
        name: 'TikTok',
        icon: '🎵',
        description: 'Videos, Profiles, Sounds',
        apiUrl: 'https://developers.tiktok.com/',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: false
      },
      huggingface: {
        name: 'HuggingFace',
        icon: '🤗',
        description: 'Models, Datasets, Spaces',
        apiUrl: 'https://huggingface.co/settings/tokens',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: false
      },
      reddit: {
        name: 'Reddit',
        icon: '🤖',
        description: 'Posts, Comments, Media, Subreddits',
        apiUrl: 'https://www.reddit.com/prefs/apps',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: false
      },
      pinterest: {
        name: 'Pinterest',
        icon: '📌',
        description: 'Pins, Boards, Profiles',
        apiUrl: 'https://developers.pinterest.com/',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: true
      },
      discord: {
        name: 'Discord',
        icon: '💜',
        description: 'Messages, Files, Channels',
        apiUrl: 'https://discord.com/developers/applications',
        authHeader: 'Authorization',
        authFormat: 'Bot {key}',
        required: true
      },
      dropbox: {
        name: 'Dropbox',
        icon: '📦',
        description: 'Files, Folders, Shared Links',
        apiUrl: 'https://www.dropbox.com/developers/apps',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: true
      },
      gdrive: {
        name: 'Google Drive',
        icon: '📁',
        description: 'Files, Folders, Documents',
        apiUrl: 'https://console.cloud.google.com/apis/credentials',
        authHeader: 'Authorization',
        authFormat: 'Bearer {key}',
        required: true
      },
      email: {
        name: 'Email (IMAP)',
        icon: '📧',
        description: 'Email attachments, content',
        apiUrl: null,
        authHeader: null,
        authFormat: null,
        required: true,
        note: 'Requires IMAP server, username, password'
      },
      sms: {
        name: 'SMS (Twilio)',
        icon: '📱',
        description: 'SMS Messages, MMS Media',
        apiUrl: 'https://console.twilio.com/',
        authHeader: 'Authorization',
        authFormat: 'Basic {key}',
        required: true
      }
    };
  }

  /**
   * Get or create encryption key for secure storage
   */
  getOrCreateEncryptionKey() {
    const keyFile = path.join(this.configDir, '.key');
    
    try {
      if (fs.existsSync(keyFile)) {
        return fs.readFileSync(keyFile, 'utf8');
      }
    } catch (e) {
      // Key doesn't exist, create new one
    }

    // Generate new key
    const key = crypto.randomBytes(32).toString('hex');
    fs.ensureDirSync(this.configDir);
    fs.writeFileSync(keyFile, key, { mode: 0o600 });
    return key;
  }

  /**
   * Encrypt a value
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const key = Buffer.from(this.encryptionKey.slice(0, 32), 'utf8');
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (e) {
      // Fallback to base64 encoding if crypto fails
      return 'b64:' + Buffer.from(text).toString('base64');
    }
  }

  /**
   * Decrypt a value
   */
  decrypt(encrypted) {
    try {
      if (encrypted.startsWith('b64:')) {
        return Buffer.from(encrypted.slice(4), 'base64').toString('utf8');
      }
      
      const [ivHex, encryptedHex] = encrypted.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = Buffer.from(this.encryptionKey.slice(0, 32), 'utf8');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      return encrypted; // Return as-is if decryption fails
    }
  }

  /**
   * Initialize - load keys from storage
   */
  async init() {
    await fs.ensureDir(this.configDir);
    
    if (await fs.pathExists(this.keysFile)) {
      try {
        const data = await fs.readJson(this.keysFile);
        for (const [platform, encryptedKey] of Object.entries(data)) {
          if (encryptedKey) {
            this.keys.set(platform, this.decrypt(encryptedKey));
          }
        }
        console.log(`✓ Loaded ${this.keys.size} API keys`);
      } catch (e) {
        console.error('Error loading API keys:', e.message);
      }
    }
    
    return this;
  }

  /**
   * Save keys to storage
   */
  async save() {
    const data = {};
    for (const [platform, key] of this.keys.entries()) {
      data[platform] = this.encrypt(key);
    }
    
    await fs.writeJson(this.keysFile, data, { spaces: 2, mode: 0o600 });
  }

  /**
   * Set API key for platform
   */
  async setKey(platform, key) {
    if (key) {
      this.keys.set(platform, key);
    } else {
      this.keys.delete(platform);
    }
    await this.save();
  }

  /**
   * Get API key for platform
   */
  getKey(platform) {
    return this.keys.get(platform);
  }

  /**
   * Check if platform has API key
   */
  hasKey(platform) {
    return this.keys.has(platform) && this.keys.get(platform);
  }

  /**
   * Get all configured platforms
   */
  getConfiguredPlatforms() {
    const configured = [];
    for (const [platformId, info] of Object.entries(this.platformInfo)) {
      configured.push({
        id: platformId,
        ...info,
        hasKey: this.hasKey(platformId),
        keyPreview: this.hasKey(platformId) 
          ? this.getKey(platformId).substring(0, 8) + '...' 
          : null
      });
    }
    return configured;
  }

  /**
   * Delete API key for platform
   */
  async deleteKey(platform) {
    this.keys.delete(platform);
    await this.save();
  }

  /**
   * Get auth header for platform
   */
  getAuthHeader(platform) {
    const key = this.getKey(platform);
    const info = this.platformInfo[platform];
    
    if (!key || !info || !info.authHeader) {
      return null;
    }

    const value = info.authFormat.replace('{key}', key);
    return { [info.authHeader]: value };
  }

  /**
   * Export keys (encrypted)
   */
  async exportKeys() {
    const data = {};
    for (const [platform, key] of this.keys.entries()) {
      data[platform] = this.encrypt(key);
    }
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import keys (encrypted)
   */
  async importKeys(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      for (const [platform, encryptedKey] of Object.entries(data)) {
        const key = this.decrypt(encryptedKey);
        this.keys.set(platform, key);
      }
      await this.save();
      return { success: true, imported: Object.keys(data).length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export default ApiKeyManager;
