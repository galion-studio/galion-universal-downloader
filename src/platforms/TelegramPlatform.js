/**
 * Telegram Platform Module
 * Download messages, files, media from channels and groups
 * Requires bot token for API access
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

const TELEGRAM_API = 'https://api.telegram.org';

export class TelegramPlatform {
  constructor(options = {}) {
    this.name = 'Telegram';
    this.id = 'telegram';
    this.icon = '📨';
    this.description = 'Channels, Groups, Messages, Files, Media';
    this.supportedTypes = ['channel', 'message', 'file', 'media', 'profile'];
    this.requiresAuth = true;
    
    this.botToken = options.botToken || null;
    this.timeout = options.timeout || 60000;
  }

  /**
   * Set API key (Bot Token)
   */
  setApiKey(apiKey) {
    this.botToken = apiKey;
  }

  /**
   * Get API URL
   */
  getApiUrl(method) {
    return `${TELEGRAM_API}/bot${this.botToken}/${method}`;
  }

  /**
   * Validate bot token
   */
  async validateApiKey(apiKey) {
    try {
      const response = await axios.get(`${TELEGRAM_API}/bot${apiKey}/getMe`);
      if (response.data.ok) {
        return { 
          valid: true, 
          bot: response.data.result 
        };
      }
      return { valid: false, error: 'Invalid token' };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Parse URL and determine content type
   */
  async parseUrl(url) {
    const patterns = {
      // t.me/username or t.me/c/channelId
      channel: /t\.me\/([a-zA-Z0-9_]+)$/,
      // t.me/username/messageId
      message: /t\.me\/([a-zA-Z0-9_]+)\/(\d+)/,
      // t.me/c/channelId/messageId (private channels)
      privateMessage: /t\.me\/c\/(\d+)\/(\d+)/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = url.match(pattern);
      if (match) {
        return {
          contentType: type,
          username: match[1],
          messageId: match[2],
          url: url
        };
      }
    }

    return { contentType: 'unknown', url };
  }

  /**
   * Main download handler
   */
  async download(url, options = {}) {
    if (!this.botToken) {
      return { 
        success: false, 
        error: 'Telegram Bot Token required. Get one from @BotFather on Telegram.' 
      };
    }

    const parsed = await this.parseUrl(url);
    
    switch (parsed.contentType) {
      case 'channel':
        return this.downloadChannelInfo(parsed.username, options);
      case 'message':
      case 'privateMessage':
        return this.downloadMessage(parsed, options);
      default:
        return { success: false, error: 'Unknown Telegram URL format' };
    }
  }

  /**
   * Get channel/chat info
   */
  async downloadChannelInfo(username, options = {}) {
    const { downloadDir } = options;

    try {
      // Get chat info
      const chatResponse = await axios.get(this.getApiUrl('getChat'), {
        params: { chat_id: `@${username}` }
      });

      if (!chatResponse.data.ok) {
        throw new Error(chatResponse.data.description);
      }

      const chat = chatResponse.data.result;

      const channelDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `telegram_${username}`
      );
      await fs.ensureDir(channelDir);

      const channelInfo = {
        id: chat.id,
        type: chat.type,
        title: chat.title,
        username: chat.username,
        description: chat.description,
        memberCount: chat.member_count,
        inviteLink: chat.invite_link
      };

      // Download profile photo if available
      if (chat.photo) {
        try {
          const photoFile = await axios.get(this.getApiUrl('getFile'), {
            params: { file_id: chat.photo.big_file_id }
          });

          if (photoFile.data.ok) {
            const photoUrl = `${TELEGRAM_API}/file/bot${this.botToken}/${photoFile.data.result.file_path}`;
            const photoPath = path.join(channelDir, 'profile_photo.jpg');
            
            const photoResponse = await axios({
              method: 'GET',
              url: photoUrl,
              responseType: 'stream'
            });

            const writer = createWriteStream(photoPath);
            await pipeline(photoResponse.data, writer);
            
            channelInfo.profilePhoto = photoPath;
          }
        } catch (e) {
          // Photo download failed, continue
        }
      }

      await fs.writeJson(path.join(channelDir, 'channel_info.json'), channelInfo, { spaces: 2 });

      return {
        success: true,
        type: 'channel',
        ...channelInfo,
        outputDir: channelDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Forward/get message and download attachments
   * Note: Bot needs to be in the chat to access messages
   */
  async downloadMessage(parsed, options = {}) {
    const { downloadDir, onProgress } = options;
    const { username, messageId } = parsed;

    try {
      const messageDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `telegram_message_${username}_${messageId}`
      );
      await fs.ensureDir(messageDir);

      // Note: Getting specific messages requires the bot to be in the chat
      // and have access to message history. This is a limitation of bot API.
      
      const result = {
        success: true,
        type: 'message',
        username,
        messageId,
        note: 'To download message content, the bot must be a member of the chat with message access.',
        url: `https://t.me/${username}/${messageId}`,
        outputDir: messageDir
      };

      // Save what we know
      await fs.writeJson(path.join(messageDir, 'message_info.json'), result, { spaces: 2 });

      return result;

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download file by file_id (for bot interactions)
   */
  async downloadFile(fileId, options = {}) {
    const { downloadDir, filename } = options;

    if (!this.botToken) {
      return { success: false, error: 'Bot token required' };
    }

    try {
      // Get file path
      const fileResponse = await axios.get(this.getApiUrl('getFile'), {
        params: { file_id: fileId }
      });

      if (!fileResponse.data.ok) {
        throw new Error(fileResponse.data.description);
      }

      const file = fileResponse.data.result;
      const fileUrl = `${TELEGRAM_API}/file/bot${this.botToken}/${file.file_path}`;
      
      const fileDir = path.join(downloadDir || process.cwd(), 'downloads', 'telegram_files');
      await fs.ensureDir(fileDir);

      const downloadFilename = filename || path.basename(file.file_path);
      const filePath = path.join(fileDir, downloadFilename);

      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream'
      });

      const writer = createWriteStream(filePath);
      await pipeline(response.data, writer);

      return {
        success: true,
        type: 'file',
        fileId,
        filename: downloadFilename,
        path: filePath,
        size: file.file_size,
        outputDir: fileDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download updates from bot (recent messages/files sent to bot)
   */
  async downloadBotUpdates(options = {}) {
    const { downloadDir, onProgress, limit = 100 } = options;

    if (!this.botToken) {
      return { success: false, error: 'Bot token required' };
    }

    try {
      const response = await axios.get(this.getApiUrl('getUpdates'), {
        params: { limit, timeout: 0 }
      });

      if (!response.data.ok) {
        throw new Error(response.data.description);
      }

      const updates = response.data.result;
      const updatesDir = path.join(downloadDir || process.cwd(), 'downloads', 'telegram_updates');
      await fs.ensureDir(updatesDir);

      const downloadedFiles = [];
      const messages = [];

      for (const update of updates) {
        const message = update.message || update.channel_post;
        if (!message) continue;

        messages.push({
          id: message.message_id,
          date: new Date(message.date * 1000).toISOString(),
          from: message.from?.username || message.from?.first_name,
          text: message.text,
          hasPhoto: !!message.photo,
          hasDocument: !!message.document,
          hasVideo: !!message.video,
          hasAudio: !!message.audio
        });

        // Download attachments
        let fileId = null;
        let fileType = null;

        if (message.document) {
          fileId = message.document.file_id;
          fileType = 'document';
        } else if (message.photo) {
          // Get highest resolution photo
          fileId = message.photo[message.photo.length - 1].file_id;
          fileType = 'photo';
        } else if (message.video) {
          fileId = message.video.file_id;
          fileType = 'video';
        } else if (message.audio) {
          fileId = message.audio.file_id;
          fileType = 'audio';
        } else if (message.voice) {
          fileId = message.voice.file_id;
          fileType = 'voice';
        }

        if (fileId) {
          if (onProgress) {
            onProgress({ status: `Downloading ${fileType}...` });
          }

          const result = await this.downloadFile(fileId, { downloadDir: updatesDir });
          if (result.success) {
            downloadedFiles.push({
              ...result,
              messageId: message.message_id,
              type: fileType
            });
          }
        }
      }

      // Save summary
      await fs.writeJson(path.join(updatesDir, 'updates.json'), {
        totalUpdates: updates.length,
        messages,
        downloadedFiles: downloadedFiles.length
      }, { spaces: 2 });

      return {
        success: true,
        type: 'updates',
        totalMessages: messages.length,
        downloadedFiles: downloadedFiles.length,
        files: downloadedFiles,
        outputDir: updatesDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download profile
   */
  async downloadProfile(url, options = {}) {
    const parsed = await this.parseUrl(url);
    if (parsed.contentType === 'channel') {
      return this.downloadChannelInfo(parsed.username, options);
    }
    return { success: false, error: 'Not a Telegram channel/user URL' };
  }

  /**
   * Download gallery (not directly supported, use updates)
   */
  async downloadGallery(url, options = {}) {
    return this.downloadBotUpdates(options);
  }

  /**
   * Send message (useful for bot interactions)
   */
  async sendMessage(chatId, text) {
    if (!this.botToken) {
      return { success: false, error: 'Bot token required' };
    }

    try {
      const response = await axios.post(this.getApiUrl('sendMessage'), {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      });

      return {
        success: response.data.ok,
        messageId: response.data.result?.message_id
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default TelegramPlatform;
