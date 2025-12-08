import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { getImageExtension, formatBytes, sleep } from './utils.js';

export class ImageDownloader {
  constructor(options = {}) {
    this.concurrent = options.concurrent || 3;
    this.retries = options.retries || 3;
    this.delay = options.delay || 500;
  }

  /**
   * Download a single image
   */
  async downloadImage(url, destPath, retryCount = 0) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://civitai.com/'
        }
      });

      const contentType = response.headers['content-type'] || '';
      const extension = getImageExtension(url, contentType);
      
      // Ensure proper extension
      let finalPath = destPath;
      if (!finalPath.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
        finalPath = `${destPath}.${extension}`;
      }

      await fs.writeFile(finalPath, response.data);
      
      return {
        success: true,
        path: finalPath,
        size: response.data.length
      };
    } catch (error) {
      if (retryCount < this.retries) {
        await sleep(1000 * (retryCount + 1));
        return this.downloadImage(url, destPath, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.message,
        url
      };
    }
  }

  /**
   * Download multiple images with progress
   */
  async downloadImages(images, imagesDir, onProgress) {
    const results = {
      successful: [],
      failed: []
    };

    let completed = 0;
    const total = images.length;

    // Process images in batches
    for (let i = 0; i < images.length; i += this.concurrent) {
      const batch = images.slice(i, i + this.concurrent);
      
      const batchPromises = batch.map(async (img, batchIndex) => {
        const globalIndex = i + batchIndex;
        const filename = `image_${String(globalIndex + 1).padStart(3, '0')}`;
        const destPath = path.join(imagesDir, filename);

        const result = await this.downloadImage(img.src, destPath);
        
        completed++;
        
        if (onProgress) {
          onProgress({
            current: completed,
            total,
            success: result.success,
            filename: result.success ? path.basename(result.path) : filename,
            size: result.size
          });
        }

        if (result.success) {
          results.successful.push({
            ...result,
            originalUrl: img.src,
            alt: img.alt
          });
        } else {
          results.failed.push({
            url: img.src,
            error: result.error
          });
        }

        return result;
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + this.concurrent < images.length) {
        await sleep(this.delay);
      }
    }

    return results;
  }

  /**
   * Calculate total downloaded size
   */
  getTotalSize(results) {
    return results.successful.reduce((sum, r) => sum + (r.size || 0), 0);
  }
}

export default ImageDownloader;
