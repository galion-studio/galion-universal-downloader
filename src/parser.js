import fs from 'fs-extra';
import path from 'path';
import { htmlToMarkdown, sanitizeFilename } from './utils.js';

export class ArticleParser {
  constructor(articleData) {
    this.data = articleData;
  }

  /**
   * Generate Markdown content
   */
  toMarkdown(imageResults = []) {
    let md = '';

    // Header
    md += `# ${this.data.title || 'Untitled Article'}\n\n`;

    // Metadata
    if (this.data.author) {
      md += `**Author:** ${this.data.author}\n`;
    }
    if (this.data.publishDate) {
      md += `**Published:** ${this.data.publishDate}\n`;
    }
    md += `**Source:** [${this.data.url}](${this.data.url})\n`;
    
    if (this.data.tags && this.data.tags.length > 0) {
      md += `**Tags:** ${this.data.tags.join(', ')}\n`;
    }
    
    md += '\n---\n\n';

    // Content
    if (this.data.contentHtml) {
      md += htmlToMarkdown(this.data.contentHtml);
    } else if (this.data.content) {
      md += this.data.content;
    }

    md += '\n\n---\n\n';

    // Images section
    if (imageResults.length > 0) {
      md += '## Downloaded Images\n\n';
      
      imageResults.forEach((img, index) => {
        const filename = path.basename(img.path);
        md += `### Image ${index + 1}\n`;
        md += `![${img.alt || `Image ${index + 1}`}](./images/${filename})\n\n`;
      });
    }

    return md;
  }

  /**
   * Generate HTML content
   */
  toHtml(imageResults = []) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.data.title || 'Downloaded Article'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
      background: #f9f9f9;
    }
    h1 { color: #1a1a2e; border-bottom: 2px solid #16213e; padding-bottom: 10px; }
    .metadata { 
      background: #e8e8e8; 
      padding: 15px; 
      border-radius: 8px; 
      margin-bottom: 20px;
      font-size: 0.9em;
    }
    .metadata p { margin: 5px 0; }
    .content { 
      background: white; 
      padding: 20px; 
      border-radius: 8px; 
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .images { margin-top: 30px; }
    .images img { 
      max-width: 100%; 
      height: auto; 
      border-radius: 8px; 
      margin: 10px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .image-container {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    a { color: #0066cc; }
    .tags { margin-top: 10px; }
    .tag {
      display: inline-block;
      background: #16213e;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      margin-right: 5px;
    }
  </style>
</head>
<body>
  <h1>${this.data.title || 'Untitled Article'}</h1>
  
  <div class="metadata">
    ${this.data.author ? `<p><strong>Author:</strong> ${this.data.author}</p>` : ''}
    ${this.data.publishDate ? `<p><strong>Published:</strong> ${this.data.publishDate}</p>` : ''}
    <p><strong>Source:</strong> <a href="${this.data.url}" target="_blank">${this.data.url}</a></p>
    ${this.data.tags && this.data.tags.length > 0 ? `
    <div class="tags">
      <strong>Tags:</strong>
      ${this.data.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
    </div>
    ` : ''}
  </div>
  
  <div class="content">
    ${this.data.contentHtml || `<p>${this.data.content || 'No content available.'}</p>`}
  </div>
`;

    if (imageResults.length > 0) {
      html += `
  <div class="images">
    <h2>Downloaded Images</h2>
`;
      imageResults.forEach((img, index) => {
        const filename = path.basename(img.path);
        html += `
    <div class="image-container">
      <h3>Image ${index + 1}</h3>
      <img src="./images/${filename}" alt="${img.alt || `Image ${index + 1}`}" loading="lazy">
    </div>
`;
      });
      html += `  </div>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * Generate JSON metadata
   */
  toJson(imageResults = []) {
    return {
      title: this.data.title,
      author: this.data.author,
      publishDate: this.data.publishDate,
      url: this.data.url,
      tags: this.data.tags,
      imageCount: imageResults.length,
      images: imageResults.map(img => ({
        filename: path.basename(img.path),
        originalUrl: img.originalUrl,
        alt: img.alt,
        size: img.size
      })),
      downloadedAt: new Date().toISOString()
    };
  }

  /**
   * Save all formats
   */
  async saveAll(baseDir, imageResults = []) {
    const saved = [];

    // Save Markdown
    const mdPath = path.join(baseDir, 'article.md');
    await fs.writeFile(mdPath, this.toMarkdown(imageResults), 'utf8');
    saved.push(mdPath);

    // Save HTML
    const htmlPath = path.join(baseDir, 'article.html');
    await fs.writeFile(htmlPath, this.toHtml(imageResults), 'utf8');
    saved.push(htmlPath);

    // Save JSON metadata
    const jsonPath = path.join(baseDir, 'metadata.json');
    await fs.writeJson(jsonPath, this.toJson(imageResults), { spaces: 2 });
    saved.push(jsonPath);

    return saved;
  }
}

export default ArticleParser;
