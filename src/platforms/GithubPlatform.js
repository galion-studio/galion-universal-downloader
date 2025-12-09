/**
 * GitHub Platform Module
 * Download repositories, files, releases, gists, and user content
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

const GITHUB_API = 'https://api.github.com';

export class GithubPlatform {
  constructor(options = {}) {
    this.name = 'GitHub';
    this.id = 'github';
    this.icon = '🐙';
    this.description = 'Repositories, Releases, Gists, Files, Raw Content';
    this.supportedTypes = ['repository', 'release', 'gist', 'file', 'profile', 'raw'];
    this.requiresAuth = false;
    
    this.apiKey = options.apiKey || null;
    this.timeout = options.timeout || 60000;
  }

  /**
   * Set API key (Personal Access Token)
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Get auth headers
   */
  getHeaders() {
    const headers = {
      'User-Agent': 'RunPod-Universal-Downloader/2.0',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey) {
    try {
      const response = await axios.get(`${GITHUB_API}/user`, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return { valid: true, user: response.data };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Parse URL and determine content type
   */
  async parseUrl(url) {
    // Clean the URL
    const cleanUrl = url.replace(/\/$/, '');
    
    const patterns = {
      // Raw file
      raw: /raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/,
      // Gist
      gist: /gist\.github\.com\/([^\/]+)\/([a-f0-9]+)/,
      // Release
      release: /github\.com\/([^\/]+)\/([^\/]+)\/releases\/tag\/([^\/]+)/,
      // Release download
      releaseDownload: /github\.com\/([^\/]+)\/([^\/]+)\/releases\/download\/([^\/]+)\/(.+)/,
      // Blob (file in repo)
      blob: /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/,
      // Tree (directory)
      tree: /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)(?:\/(.+))?/,
      // Repository (must have exactly 2 path segments - BEFORE user check)
      repo: /github\.com\/([^\/]+)\/([^\/]+)$/,
      // User profile (exactly 1 path segment)
      user: /github\.com\/([^\/]+)$/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = url.match(pattern);
      if (match) {
        return {
          contentType: type,
          owner: match[1],
          repo: match[2],
          ref: match[3],
          path: match[4],
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
    const parsed = await this.parseUrl(url);
    
    switch (parsed.contentType) {
      case 'repo':
        return this.downloadRepository(parsed.owner, parsed.repo, options);
      case 'release':
        return this.downloadRelease(parsed.owner, parsed.repo, parsed.ref, options);
      case 'releaseDownload':
        return this.downloadReleaseAsset(url, options);
      case 'blob':
        return this.downloadFile(parsed.owner, parsed.repo, parsed.ref, parsed.path, options);
      case 'tree':
        return this.downloadDirectory(parsed.owner, parsed.repo, parsed.ref, parsed.path, options);
      case 'raw':
        return this.downloadRaw(url, options);
      case 'gist':
        return this.downloadGist(parsed.repo, options);
      case 'user':
        return this.downloadProfile(parsed.owner, options);
      default:
        throw new Error(`Unknown GitHub content type: ${parsed.contentType}`);
    }
  }

  /**
   * Download entire repository as ZIP
   */
  async downloadRepository(owner, repo, options = {}) {
    const { downloadDir, onProgress, branch = 'main' } = options;

    try {
      // Get repo info
      const repoResponse = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}`, {
        headers: this.getHeaders()
      });
      
      const repoInfo = repoResponse.data;
      const defaultBranch = repoInfo.default_branch || branch;

      // Download as ZIP
      const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${defaultBranch}.zip`;
      
      const repoDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `github_${owner}_${repo}`
      );
      await fs.ensureDir(repoDir);

      const zipPath = path.join(repoDir, `${repo}-${defaultBranch}.zip`);

      if (onProgress) {
        onProgress({ status: `Downloading repository: ${owner}/${repo}` });
      }

      // Download the ZIP
      const response = await axios({
        method: 'GET',
        url: zipUrl,
        responseType: 'stream',
        headers: this.getHeaders()
      });

      const writer = createWriteStream(zipPath);
      await pipeline(response.data, writer);

      // Save metadata
      await fs.writeJson(path.join(repoDir, 'repo_info.json'), {
        owner,
        repo,
        name: repoInfo.name,
        description: repoInfo.description,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        language: repoInfo.language,
        defaultBranch,
        url: repoInfo.html_url,
        cloneUrl: repoInfo.clone_url,
        downloadedAt: new Date().toISOString()
      }, { spaces: 2 });

      return {
        success: true,
        type: 'repository',
        owner,
        repo,
        branch: defaultBranch,
        zipPath,
        outputDir: repoDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download all assets from a release
   */
  async downloadRelease(owner, repo, tag, options = {}) {
    const { downloadDir, onProgress } = options;

    try {
      // Get release info
      const releaseUrl = tag 
        ? `${GITHUB_API}/repos/${owner}/${repo}/releases/tags/${tag}`
        : `${GITHUB_API}/repos/${owner}/${repo}/releases/latest`;
      
      const releaseResponse = await axios.get(releaseUrl, {
        headers: this.getHeaders()
      });
      
      const release = releaseResponse.data;
      
      const releaseDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `github_release_${owner}_${repo}_${release.tag_name}`
      );
      await fs.ensureDir(releaseDir);

      const results = {
        release: {
          name: release.name,
          tag: release.tag_name,
          body: release.body,
          publishedAt: release.published_at,
          author: release.author?.login
        },
        assets: [],
        sourceCode: {
          zipUrl: release.zipball_url,
          tarUrl: release.tarball_url
        }
      };

      // Download each asset
      for (const asset of release.assets) {
        if (onProgress) {
          onProgress({ status: `Downloading: ${asset.name}` });
        }

        const assetPath = path.join(releaseDir, asset.name);
        
        try {
          const assetResponse = await axios({
            method: 'GET',
            url: asset.browser_download_url,
            responseType: 'stream',
            headers: {
              ...this.getHeaders(),
              'Accept': 'application/octet-stream'
            }
          });

          const writer = createWriteStream(assetPath);
          await pipeline(assetResponse.data, writer);

          results.assets.push({
            name: asset.name,
            size: asset.size,
            downloadCount: asset.download_count,
            localPath: assetPath
          });
        } catch (err) {
          results.assets.push({
            name: asset.name,
            error: err.message
          });
        }
      }

      // Save release metadata
      await fs.writeJson(path.join(releaseDir, 'release_info.json'), results, { spaces: 2 });

      // Save release notes as markdown
      await fs.writeFile(
        path.join(releaseDir, 'RELEASE_NOTES.md'),
        `# ${release.name || release.tag_name}\n\n${release.body || 'No release notes.'}`
      );

      return {
        success: true,
        type: 'release',
        ...results,
        outputDir: releaseDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a specific release asset
   */
  async downloadReleaseAsset(url, options = {}) {
    const { downloadDir, onProgress } = options;

    try {
      const filename = path.basename(new URL(url).pathname);
      const assetDir = path.join(downloadDir || process.cwd(), 'downloads', 'github_assets');
      await fs.ensureDir(assetDir);

      const assetPath = path.join(assetDir, filename);

      if (onProgress) {
        onProgress({ status: `Downloading: ${filename}` });
      }

      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        headers: this.getHeaders()
      });

      const writer = createWriteStream(assetPath);
      await pipeline(response.data, writer);

      return {
        success: true,
        type: 'asset',
        filename,
        path: assetPath,
        outputDir: assetDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a single file from repository
   */
  async downloadFile(owner, repo, ref, filePath, options = {}) {
    const { downloadDir } = options;

    try {
      // Get raw file URL
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
      
      const fileDir = path.join(downloadDir || process.cwd(), 'downloads', `github_${owner}_${repo}`);
      await fs.ensureDir(fileDir);

      const filename = path.basename(filePath);
      const localPath = path.join(fileDir, filename);

      const response = await axios({
        method: 'GET',
        url: rawUrl,
        responseType: 'arraybuffer',
        headers: this.getHeaders()
      });

      await fs.writeFile(localPath, response.data);

      return {
        success: true,
        type: 'file',
        filename,
        path: localPath,
        size: response.data.length,
        outputDir: fileDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download directory contents recursively
   */
  async downloadDirectory(owner, repo, ref, dirPath, options = {}) {
    const { downloadDir, onProgress } = options;

    try {
      const response = await axios.get(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/${dirPath || ''}?ref=${ref}`,
        { headers: this.getHeaders() }
      );

      const contents = response.data;
      const results = { files: [], directories: [] };

      const baseDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `github_${owner}_${repo}`,
        dirPath || ''
      );
      await fs.ensureDir(baseDir);

      for (const item of contents) {
        if (item.type === 'file') {
          if (onProgress) {
            onProgress({ status: `Downloading: ${item.name}` });
          }

          const fileResult = await this.downloadFile(owner, repo, ref, item.path, { downloadDir: path.dirname(baseDir) });
          results.files.push({
            name: item.name,
            path: item.path,
            size: item.size,
            success: fileResult.success
          });
        } else if (item.type === 'dir') {
          results.directories.push(item.name);
          // Recursively download subdirectory
          await this.downloadDirectory(owner, repo, ref, item.path, options);
        }
      }

      return {
        success: true,
        type: 'directory',
        path: dirPath,
        ...results,
        outputDir: baseDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download raw file directly
   */
  async downloadRaw(url, options = {}) {
    const { downloadDir } = options;

    try {
      const filename = path.basename(new URL(url).pathname);
      const rawDir = path.join(downloadDir || process.cwd(), 'downloads', 'github_raw');
      await fs.ensureDir(rawDir);

      const response = await axios({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
        headers: this.getHeaders()
      });

      const localPath = path.join(rawDir, filename);
      await fs.writeFile(localPath, response.data);

      return {
        success: true,
        type: 'raw',
        filename,
        path: localPath,
        size: response.data.length,
        outputDir: rawDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a gist with all files
   */
  async downloadGist(gistId, options = {}) {
    const { downloadDir, onProgress } = options;

    try {
      const response = await axios.get(`${GITHUB_API}/gists/${gistId}`, {
        headers: this.getHeaders()
      });

      const gist = response.data;
      
      const gistDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `github_gist_${gistId}`
      );
      await fs.ensureDir(gistDir);

      const files = [];

      for (const [filename, fileData] of Object.entries(gist.files)) {
        if (onProgress) {
          onProgress({ status: `Saving: ${filename}` });
        }

        const localPath = path.join(gistDir, filename);
        
        if (fileData.truncated && fileData.raw_url) {
          // File is truncated, download from raw_url
          const rawResponse = await axios.get(fileData.raw_url);
          await fs.writeFile(localPath, rawResponse.data);
        } else {
          await fs.writeFile(localPath, fileData.content);
        }

        files.push({
          filename,
          language: fileData.language,
          size: fileData.size,
          localPath
        });
      }

      // Save gist metadata
      await fs.writeJson(path.join(gistDir, 'gist_info.json'), {
        id: gist.id,
        description: gist.description,
        public: gist.public,
        owner: gist.owner?.login,
        createdAt: gist.created_at,
        updatedAt: gist.updated_at,
        files: files.map(f => f.filename)
      }, { spaces: 2 });

      return {
        success: true,
        type: 'gist',
        id: gistId,
        description: gist.description,
        files,
        outputDir: gistDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download user's public repositories
   */
  async downloadProfile(username, options = {}) {
    const { downloadDir, onProgress, limit = 30 } = options;

    try {
      // Get user info
      const userResponse = await axios.get(`${GITHUB_API}/users/${username}`, {
        headers: this.getHeaders()
      });
      
      // Get user's repos
      const reposResponse = await axios.get(
        `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=${limit}`,
        { headers: this.getHeaders() }
      );

      // Get user's gists
      const gistsResponse = await axios.get(
        `${GITHUB_API}/users/${username}/gists?per_page=${Math.min(limit, 30)}`,
        { headers: this.getHeaders() }
      );

      const profileDir = path.join(
        downloadDir || process.cwd(),
        'downloads',
        `github_profile_${username}`
      );
      await fs.ensureDir(profileDir);

      const profile = {
        user: {
          login: userResponse.data.login,
          name: userResponse.data.name,
          bio: userResponse.data.bio,
          company: userResponse.data.company,
          location: userResponse.data.location,
          blog: userResponse.data.blog,
          publicRepos: userResponse.data.public_repos,
          followers: userResponse.data.followers,
          following: userResponse.data.following
        },
        repositories: reposResponse.data.map(repo => ({
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language
        })),
        gists: gistsResponse.data.map(gist => ({
          id: gist.id,
          description: gist.description,
          public: gist.public,
          files: Object.keys(gist.files)
        }))
      };

      await fs.writeJson(path.join(profileDir, 'profile.json'), profile, { spaces: 2 });

      return {
        success: true,
        type: 'profile',
        ...profile,
        outputDir: profileDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Search repositories
   */
  async search(query, options = {}) {
    const { sort = 'stars', order = 'desc', limit = 20 } = options;

    const response = await axios.get(
      `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${limit}`,
      { headers: this.getHeaders() }
    );

    return response.data.items.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      url: repo.html_url
    }));
  }
}

export default GithubPlatform;
