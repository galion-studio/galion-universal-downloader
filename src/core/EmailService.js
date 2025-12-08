/**
 * Email Service - Universal Email Scanner
 * Part of Galion.studio Ecosystem - Galion Initiative (40% Open Source)
 * 
 * Supports: Gmail API, IMAP (Apple Mail, Outlook, Yahoo, etc.), POP3
 * Self-hosted, private, no reliance on third parties
 * Serverless-ready
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.connections = new Map();
    this.scannedEmails = [];
    this.outputDir = path.join(process.cwd(), 'downloads', 'emails');
    
    // Supported providers with their IMAP/SMTP settings
    this.providers = {
      gmail: {
        name: 'Gmail',
        imap: { host: 'imap.gmail.com', port: 993, tls: true },
        smtp: { host: 'smtp.gmail.com', port: 587, secure: false },
        oauth: true,
        requiresAppPassword: true,
        docs: 'https://support.google.com/accounts/answer/185833'
      },
      outlook: {
        name: 'Outlook/Microsoft',
        imap: { host: 'outlook.office365.com', port: 993, tls: true },
        smtp: { host: 'smtp.office365.com', port: 587, secure: false },
        oauth: true,
        docs: 'https://support.microsoft.com/account'
      },
      apple: {
        name: 'Apple iCloud',
        imap: { host: 'imap.mail.me.com', port: 993, tls: true },
        smtp: { host: 'smtp.mail.me.com', port: 587, secure: false },
        requiresAppPassword: true,
        docs: 'https://support.apple.com/en-us/HT204397'
      },
      yahoo: {
        name: 'Yahoo Mail',
        imap: { host: 'imap.mail.yahoo.com', port: 993, tls: true },
        smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
        requiresAppPassword: true,
        docs: 'https://help.yahoo.com/kb/generate-app-password-sln15241.html'
      },
      protonmail: {
        name: 'ProtonMail (via Bridge)',
        imap: { host: '127.0.0.1', port: 1143, tls: false },
        smtp: { host: '127.0.0.1', port: 1025, secure: false },
        requiresBridge: true,
        docs: 'https://protonmail.com/bridge'
      },
      custom: {
        name: 'Custom IMAP Server',
        imap: { host: '', port: 993, tls: true },
        smtp: { host: '', port: 587, secure: false }
      }
    };
  }

  async initialize() {
    await fs.ensureDir(this.outputDir);
    console.log('✓ Email Service initialized');
  }

  /**
   * Get supported providers info
   */
  getProviders() {
    return Object.entries(this.providers).map(([id, provider]) => ({
      id,
      name: provider.name,
      requiresAppPassword: provider.requiresAppPassword || false,
      requiresBridge: provider.requiresBridge || false,
      supportsOAuth: provider.oauth || false,
      docsUrl: provider.docs
    }));
  }

  /**
   * Create IMAP connection config
   * Note: Actual IMAP implementation would require 'imap' or 'imapflow' package
   * This is the configuration structure
   */
  createImapConfig(provider, email, password, customSettings = {}) {
    const providerConfig = this.providers[provider] || this.providers.custom;
    
    return {
      user: email,
      password: password,
      host: customSettings.host || providerConfig.imap.host,
      port: customSettings.port || providerConfig.imap.port,
      tls: customSettings.tls !== undefined ? customSettings.tls : providerConfig.imap.tls,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 30000
    };
  }

  /**
   * Gmail API OAuth2 configuration
   * User needs to create credentials at https://console.cloud.google.com/
   */
  createGmailOAuthConfig(credentials) {
    return {
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      redirectUri: credentials.redirectUri || 'http://localhost:3000/oauth/callback',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/gmail.metadata'
      ]
    };
  }

  /**
   * Parse email address to detect provider
   */
  detectProvider(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    
    const domainMap = {
      'gmail.com': 'gmail',
      'googlemail.com': 'gmail',
      'outlook.com': 'outlook',
      'hotmail.com': 'outlook',
      'live.com': 'outlook',
      'msn.com': 'outlook',
      'icloud.com': 'apple',
      'me.com': 'apple',
      'mac.com': 'apple',
      'yahoo.com': 'yahoo',
      'yahoo.co.uk': 'yahoo',
      'protonmail.com': 'protonmail',
      'proton.me': 'protonmail'
    };

    return domainMap[domain] || 'custom';
  }

  /**
   * Scan email structure (folders/labels)
   * This is a simulation - real implementation needs IMAP library
   */
  async scanFolders(connectionId) {
    // Standard IMAP folders
    return {
      success: true,
      folders: [
        { name: 'INBOX', path: 'INBOX', type: 'inbox', unread: 0 },
        { name: 'Sent', path: 'Sent', type: 'sent', unread: 0 },
        { name: 'Drafts', path: 'Drafts', type: 'drafts', unread: 0 },
        { name: 'Spam', path: 'Junk', type: 'spam', unread: 0 },
        { name: 'Trash', path: 'Trash', type: 'trash', unread: 0 },
        { name: 'Archive', path: 'Archive', type: 'archive', unread: 0 }
      ],
      message: 'Folder scan simulated - connect IMAP library for real scanning'
    };
  }

  /**
   * Search emails with criteria
   */
  async searchEmails(options = {}) {
    const {
      folder = 'INBOX',
      from,
      to,
      subject,
      since,
      before,
      hasAttachment,
      unreadOnly,
      limit = 50
    } = options;

    // Build search criteria (IMAP format)
    const criteria = [];
    
    if (from) criteria.push(['FROM', from]);
    if (to) criteria.push(['TO', to]);
    if (subject) criteria.push(['SUBJECT', subject]);
    if (since) criteria.push(['SINCE', since]);
    if (before) criteria.push(['BEFORE', before]);
    if (hasAttachment) criteria.push(['HEADER', 'Content-Type', 'multipart/mixed']);
    if (unreadOnly) criteria.push(['UNSEEN']);

    return {
      success: true,
      criteria: criteria.length > 0 ? criteria : ['ALL'],
      folder,
      limit,
      message: 'Search query prepared - connect IMAP library for execution'
    };
  }

  /**
   * Extract attachments from emails
   */
  async extractAttachments(options = {}) {
    const {
      folder = 'INBOX',
      types = ['*'], // ['pdf', 'docx', 'xlsx', 'images', '*']
      since,
      limit = 100,
      downloadPath
    } = options;

    const outputPath = downloadPath || path.join(this.outputDir, 'attachments');
    await fs.ensureDir(outputPath);

    // MIME type mapping for filtering
    const mimeFilters = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
      video: ['video/mp4', 'video/mkv', 'video/webm']
    };

    return {
      success: true,
      config: {
        folder,
        types,
        since,
        limit,
        outputPath,
        mimeFilters
      },
      message: 'Attachment extraction configured - connect IMAP library for execution'
    };
  }

  /**
   * Export emails to files (EML, JSON, PDF)
   */
  async exportEmails(options = {}) {
    const {
      folder = 'INBOX',
      format = 'json', // 'eml', 'json', 'pdf', 'html'
      since,
      limit = 100,
      includeAttachments = true,
      outputPath
    } = options;

    const exportPath = outputPath || path.join(this.outputDir, 'exports', format);
    await fs.ensureDir(exportPath);

    return {
      success: true,
      config: {
        folder,
        format,
        since,
        limit,
        includeAttachments,
        outputPath: exportPath
      },
      message: `Export to ${format.toUpperCase()} configured - connect IMAP library for execution`
    };
  }

  /**
   * Backup entire mailbox
   */
  async backupMailbox(options = {}) {
    const {
      folders = ['INBOX', 'Sent', 'Drafts'],
      format = 'eml',
      compressOutput = true,
      outputPath
    } = options;

    const backupPath = outputPath || path.join(this.outputDir, 'backups', new Date().toISOString().split('T')[0]);
    await fs.ensureDir(backupPath);

    return {
      success: true,
      config: {
        folders,
        format,
        compressOutput,
        outputPath: backupPath
      },
      message: 'Mailbox backup configured - connect IMAP library for execution'
    };
  }

  /**
   * Analyze email patterns (for AI processing)
   */
  async analyzePatterns(options = {}) {
    const {
      folder = 'INBOX',
      since,
      analysisTypes = ['senders', 'domains', 'subjects', 'timePatterns', 'threadAnalysis']
    } = options;

    return {
      success: true,
      analysisConfig: {
        folder,
        since,
        types: analysisTypes
      },
      availableAnalysis: {
        senders: 'Top senders by frequency',
        domains: 'Email domains distribution',
        subjects: 'Common subject keywords',
        timePatterns: 'Email receive patterns by hour/day',
        threadAnalysis: 'Conversation thread mapping',
        attachmentTypes: 'Attachment type distribution',
        responseTime: 'Average response time analysis'
      },
      message: 'Pattern analysis configured - connect IMAP library for execution'
    };
  }

  /**
   * Monitor mailbox for new emails (webhook-style)
   */
  async watchMailbox(options = {}) {
    const {
      folders = ['INBOX'],
      onNewEmail,
      pollInterval = 60000 // 1 minute in ms
    } = options;

    return {
      success: true,
      config: {
        folders,
        pollInterval,
        hasCallback: !!onNewEmail
      },
      methods: {
        imap: 'IDLE command for push notifications (most efficient)',
        polling: 'Check for new UIDs at interval',
        webhook: 'Gmail Push to Cloud Pub/Sub'
      },
      message: 'Mailbox watch configured - connect IMAP library for execution'
    };
  }

  /**
   * Get connection instructions for each provider
   */
  getConnectionGuide(provider) {
    const guides = {
      gmail: {
        steps: [
          '1. Go to https://myaccount.google.com/security',
          '2. Enable 2-Factor Authentication if not already enabled',
          '3. Go to App Passwords section',
          '4. Generate a new app password for "Mail"',
          '5. Use your Gmail address and the 16-character app password',
          'Alternative: Use OAuth2 with Google Cloud Console credentials'
        ],
        security: 'App passwords are more secure than regular passwords',
        oauth: {
          setup: [
            '1. Go to https://console.cloud.google.com/',
            '2. Create a new project',
            '3. Enable Gmail API',
            '4. Create OAuth 2.0 credentials',
            '5. Download the credentials JSON'
          ]
        }
      },
      apple: {
        steps: [
          '1. Go to https://appleid.apple.com/',
          '2. Sign in and go to Security section',
          '3. Generate an app-specific password',
          '4. Use your iCloud email and the app-specific password'
        ],
        note: 'Apple requires app-specific passwords for third-party access'
      },
      outlook: {
        steps: [
          '1. Go to https://account.microsoft.com/security',
          '2. Enable 2FA if not enabled',
          '3. For personal accounts, use app passwords',
          '4. For work/school accounts, may need OAuth2',
          'OAuth: Use Microsoft Azure AD app registration'
        ]
      },
      protonmail: {
        steps: [
          '1. Download ProtonMail Bridge from https://protonmail.com/bridge',
          '2. Install and log in with your ProtonMail account',
          '3. Bridge provides local IMAP/SMTP on 127.0.0.1',
          '4. Use the credentials shown in Bridge settings'
        ],
        note: 'ProtonMail requires the Bridge app for IMAP access'
      },
      custom: {
        steps: [
          '1. Get IMAP server details from your email provider',
          '2. Common settings: port 993, TLS enabled',
          '3. Use your email address and password',
          '4. Some providers may require app-specific passwords'
        ]
      }
    };

    return guides[provider] || guides.custom;
  }

  /**
   * Get required npm packages for full implementation
   */
  getRequiredPackages() {
    return {
      imap: {
        packages: ['imapflow', 'mailparser'],
        description: 'Modern IMAP client with parsing support',
        install: 'npm install imapflow mailparser'
      },
      gmailApi: {
        packages: ['googleapis'],
        description: 'Official Google APIs client for Gmail',
        install: 'npm install googleapis'
      },
      smtp: {
        packages: ['nodemailer'],
        description: 'For sending emails (SMTP)',
        install: 'npm install nodemailer'
      },
      oauth: {
        packages: ['google-auth-library', '@azure/msal-node'],
        description: 'OAuth2 clients for Gmail and Microsoft',
        install: 'npm install google-auth-library @azure/msal-node'
      },
      complete: 'npm install imapflow mailparser googleapis nodemailer'
    };
  }

  /**
   * Sample IMAP connection code (documentation)
   */
  getSampleCode() {
    return `
// Install: npm install imapflow mailparser

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

// Create IMAP client
const client = new ImapFlow({
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'  // Use app password, NOT regular password!
  }
});

async function main() {
  // Connect
  await client.connect();
  
  // Select INBOX
  let lock = await client.getMailboxLock('INBOX');
  try {
    // Fetch last 10 messages
    for await (let message of client.fetch('1:10', { 
      source: true,
      envelope: true 
    })) {
      // Parse the email
      const parsed = await simpleParser(message.source);
      console.log('Subject:', parsed.subject);
      console.log('From:', parsed.from.text);
      console.log('Date:', parsed.date);
      
      // Attachments
      if (parsed.attachments.length > 0) {
        for (const attachment of parsed.attachments) {
          console.log('Attachment:', attachment.filename, attachment.size);
          // Save: fs.writeFileSync(attachment.filename, attachment.content);
        }
      }
    }
  } finally {
    lock.release();
  }
  
  // Disconnect
  await client.logout();
}

main().catch(console.error);
`;
  }
}

export { EmailService };
