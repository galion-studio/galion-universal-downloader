/**
 * Civitai API Integration
 * Handles authenticated requests to Civitai API
 * 
 * Documentation: https://developer.civitai.com/docs/api/public-rest
 * 
 * Authorization Methods:
 * 1. Header: Authorization: Bearer {api_key}
 * 2. Query: ?token={api_key}
 */

import axios from 'axios';
import { sleep } from './utils.js';

const CIVITAI_API_BASE = 'https://civitai.com/api/v1';

export class CivitaiAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: CIVITAI_API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RUPOD-Article-Downloader/1.0.0'
      }
    });
    
    // Add API key to requests via Authorization header (Bearer token)
    if (apiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  /**
   * Set or update API key
   * Uses Bearer token authentication as per Civitai API docs
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    if (apiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      delete this.client.defaults.headers['Authorization'];
    }
  }

  /**
   * Add token to URL for download requests
   * Some endpoints require token as query parameter
   */
  addTokenToUrl(url) {
    if (!this.apiKey) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${this.apiKey}`;
  }

  /**
   * Verify API key is valid
   */
  async verifyApiKey() {
    try {
      // Try to fetch user info to verify key
      const response = await this.client.get('/me');
      return {
        valid: true,
        user: response.data
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get article by ID
   */
  async getArticle(articleId) {
    try {
      const response = await this.client.get(`/articles/${articleId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch article: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get image details by ID
   */
  async getImage(imageId) {
    try {
      const response = await this.client.get(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch image: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get images for an article/post
   */
  async getImages(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.postId) params.append('postId', options.postId);
      if (options.modelId) params.append('modelId', options.modelId);
      if (options.modelVersionId) params.append('modelVersionId', options.modelVersionId);
      if (options.username) params.append('username', options.username);
      if (options.nsfw !== undefined) params.append('nsfw', options.nsfw);
      if (options.sort) params.append('sort', options.sort);
      if (options.limit) params.append('limit', options.limit);
      
      const response = await this.client.get(`/images?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch images: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get model by ID
   */
  async getModel(modelId) {
    try {
      const response = await this.client.get(`/models/${modelId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch model: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get model version by ID
   */
  async getModelVersion(versionId) {
    try {
      const response = await this.client.get(`/model-versions/${versionId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch model version: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Search models
   */
  async searchModels(query, options = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (options.limit) params.append('limit', options.limit);
      if (options.page) params.append('page', options.page);
      if (options.tag) params.append('tag', options.tag);
      if (options.types) params.append('types', options.types);
      if (options.sort) params.append('sort', options.sort);
      if (options.nsfw !== undefined) params.append('nsfw', options.nsfw);
      
      const response = await this.client.get(`/models?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search models: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get download URL for a model file
   */
  getModelDownloadUrl(modelVersionId, type = 'Model') {
    let url = `${CIVITAI_API_BASE}/models/${modelVersionId}/download`;
    if (type) {
      url += `?type=${type}`;
    }
    if (this.apiKey) {
      url += `${type ? '&' : '?'}token=${this.apiKey}`;
    }
    return url;
  }

  /**
   * Extract article ID from URL
   */
  static extractArticleId(url) {
    const match = url.match(/articles\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract model IDs from article content
   */
  static extractModelIds(content) {
    const modelIds = new Set();
    
    // Match model URLs: /models/12345
    const modelUrlMatches = content.matchAll(/\/models\/(\d+)/g);
    for (const match of modelUrlMatches) {
      modelIds.add(match[1]);
    }
    
    // Match model version URLs: /models/12345?modelVersionId=67890
    const versionMatches = content.matchAll(/modelVersionId[=:](\d+)/g);
    for (const match of versionMatches) {
      // These are version IDs, not model IDs, but we can use them
      modelIds.add(`v${match[1]}`);
    }
    
    return Array.from(modelIds);
  }

  /**
   * Extract image IDs from content
   */
  static extractImageIds(content) {
    const imageIds = new Set();
    
    // Match image URLs from Civitai CDN
    const cdnMatches = content.matchAll(/image\.civitai\.com\/[^"'\s]+?\/(\d+)/g);
    for (const match of cdnMatches) {
      imageIds.add(match[1]);
    }
    
    // Match direct image references
    const imgMatches = content.matchAll(/\/images\/(\d+)/g);
    for (const match of imgMatches) {
      imageIds.add(match[1]);
    }
    
    return Array.from(imageIds);
  }

  /**
   * Get high-resolution image URL
   */
  static getHighResImageUrl(imageUrl) {
    // Remove width parameter to get original
    let highRes = imageUrl.replace(/\/width=\d+/, '');
    
    // Add original=true if it's a Civitai CDN URL
    if (highRes.includes('image.civitai.com') && !highRes.includes('original=true')) {
      highRes += highRes.includes('?') ? '&original=true' : '?original=true';
    }
    
    return highRes;
  }

  /**
   * Download image with authentication
   */
  async downloadImage(imageUrl) {
    const headers = {
      'User-Agent': 'RUPOD-Article-Downloader/1.0.0',
      'Referer': 'https://civitai.com/'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 60000,
      headers
    });
    
    return {
      data: response.data,
      contentType: response.headers['content-type'],
      size: response.data.length
    };
  }
}

export default CivitaiAPI;
