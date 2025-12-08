#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';

import { CivitaiScraper } from './src/scraper.js';
import { ImageDownloader } from './src/downloader.js';
import { ArticleParser } from './src/parser.js';
import { createDownloadDir, formatBytes, extractArticleSlug } from './src/utils.js';

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██╗   ██╗██████╗  ██████╗ ██████╗                  ║
║   ██╔══██╗██║   ██║██╔══██╗██╔═══██╗██╔══██╗                 ║
║   ██████╔╝██║   ██║██████╔╝██║   ██║██║  ██║                 ║
║   ██╔══██╗██║   ██║██╔═══╝ ██║   ██║██║  ██║                 ║
║   ██║  ██║╚██████╔╝██║     ╚██████╔╝██████╔╝                 ║
║   ╚═╝  ╚═╝ ╚═════╝ ╚═╝      ╚═════╝ ╚═════╝                  ║
║                                                               ║
║           📰 Civitai Article Downloader v1.0.0               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

program
  .name('rupod')
  .description('Download articles from Civitai including text and images')
  .version('1.0.0');

program
  .argument('[url]', 'Article URL to download')
  .option('-l, --login', 'Open browser for interactive login')
  .option('-o, --output <dir>', 'Output directory', 'downloads')
  .option('--no-images', 'Skip downloading images')
  .option('--headless', 'Run browser in headless mode', true)
  .option('-c, --concurrent <number>', 'Concurrent image downloads', '3')
  .action(async (url, options) => {
    console.log(chalk.cyan(banner));

    const scraper = new CivitaiScraper({
      headless: options.headless
    });

    try {
      // Initialize scraper
      const initSpinner = ora('Initializing browser...').start();
      await scraper.init();
      initSpinner.succeed('Browser initialized');

      // Handle login mode
      if (options.login) {
        await scraper.interactiveLogin();
        console.log(chalk.green('\n✓ Login successful! Cookies saved for future use.\n'));
        
        if (!url) {
          await scraper.close();
          return;
        }
      }

      // If no URL provided, show help
      if (!url) {
        console.log(chalk.yellow('\nNo URL provided. Use --help for usage information.\n'));
        console.log(chalk.white('Examples:'));
        console.log(chalk.gray('  node index.js https://civitai.com/articles/12345/article-name'));
        console.log(chalk.gray('  node index.js --login'));
        console.log(chalk.gray('  node index.js https://civitai.com/articles/12345 --no-images'));
        await scraper.close();
        return;
      }

      // Validate URL
      if (!url.includes('civitai.com/articles/')) {
        console.log(chalk.red('\n✗ Invalid URL. Please provide a valid Civitai article URL.'));
        console.log(chalk.gray('  Example: https://civitai.com/articles/12345/article-name\n'));
        await scraper.close();
        return;
      }

      // Scrape article
      const scrapeSpinner = ora('Scraping article content...').start();
      let articleData;
      
      try {
        articleData = await scraper.scrapeArticle(url);
        scrapeSpinner.succeed(`Article scraped: "${articleData.title || 'Untitled'}"`);
      } catch (error) {
        scrapeSpinner.fail('Failed to scrape article');
        
        if (error.message.includes('Authentication required')) {
          console.log(chalk.yellow('\n⚠️  This article requires authentication.'));
          console.log(chalk.white('   Run with --login flag first to log in:'));
          console.log(chalk.cyan('   node index.js --login\n'));
        } else {
          console.log(chalk.red(`\nError: ${error.message}\n`));
        }
        
        await scraper.close();
        return;
      }

      // Create download directory
      const articleName = articleData.title || extractArticleSlug(url) || 'untitled-article';
      const { baseDir, imagesDir } = await createDownloadDir(articleName);
      
      console.log(chalk.gray(`\nOutput directory: ${baseDir}`));

      // Download images
      let imageResults = { successful: [], failed: [] };
      
      if (options.images !== false && articleData.images.length > 0) {
        console.log(chalk.white(`\n📷 Downloading ${articleData.images.length} images...\n`));
        
        const downloader = new ImageDownloader({
          concurrent: parseInt(options.concurrent)
        });

        const progressBar = ora().start();
        
        imageResults = await downloader.downloadImages(
          articleData.images,
          imagesDir,
          (progress) => {
            const percent = Math.round((progress.current / progress.total) * 100);
            const status = progress.success ? chalk.green('✓') : chalk.red('✗');
            progressBar.text = `${status} [${progress.current}/${progress.total}] ${progress.filename} ${progress.size ? chalk.gray(`(${formatBytes(progress.size)})`) : ''}`;
          }
        );

        progressBar.stop();
        
        const totalSize = downloader.getTotalSize(imageResults);
        console.log(chalk.green(`\n✓ Downloaded ${imageResults.successful.length}/${articleData.images.length} images (${formatBytes(totalSize)})`));
        
        if (imageResults.failed.length > 0) {
          console.log(chalk.yellow(`⚠ Failed to download ${imageResults.failed.length} images`));
        }
      } else if (articleData.images.length === 0) {
        console.log(chalk.gray('\nNo images found in article.'));
      } else {
        console.log(chalk.gray('\nSkipping image download (--no-images flag).'));
      }

      // Save article content
      const saveSpinner = ora('Saving article content...').start();
      const parser = new ArticleParser(articleData);
      const savedFiles = await parser.saveAll(baseDir, imageResults.successful);
      saveSpinner.succeed('Article content saved');

      // Summary
      console.log(chalk.cyan('\n═══════════════════════════════════════════════════════'));
      console.log(chalk.white.bold('📋 Download Summary'));
      console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
      console.log(chalk.white(`Title:    ${articleData.title || 'Untitled'}`));
      console.log(chalk.white(`Author:   ${articleData.author || 'Unknown'}`));
      console.log(chalk.white(`Images:   ${imageResults.successful.length} downloaded`));
      console.log(chalk.white(`Location: ${baseDir}`));
      console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
      
      console.log(chalk.gray('\nSaved files:'));
      savedFiles.forEach(file => {
        console.log(chalk.gray(`  • ${path.basename(file)}`));
      });

      console.log(chalk.green('\n✓ Article download complete!\n'));

    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
      if (process.env.DEBUG) {
        console.error(error);
      }
    } finally {
      await scraper.close();
    }
  });

// Login command
program
  .command('login')
  .description('Open browser for interactive Civitai login')
  .action(async () => {
    console.log(chalk.cyan(banner));
    
    const scraper = new CivitaiScraper({ headless: false });
    
    try {
      await scraper.init();
      await scraper.interactiveLogin();
      console.log(chalk.green('\n✓ Login successful! You can now download articles.\n'));
    } catch (error) {
      console.error(chalk.red(`\n✗ Login failed: ${error.message}\n`));
    } finally {
      await scraper.close();
    }
  });

// Parse arguments
program.parse();
