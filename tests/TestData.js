/**
 * Test Data for Galion Universal Downloader
 * Contains sample URLs and expected results for all platforms
 */

/**
 * Sample URLs for each platform
 * These URLs are used to test URL parsing and pattern matching
 */
export const TEST_URLS = {
  // YouTube Platform
  youtube: {
    video: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=jNQXAC9IVRw&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
    ],
    shorts: [
      'https://www.youtube.com/shorts/abc123xyz45',
      'https://youtube.com/shorts/xyz789abc12'
    ],
    playlist: [
      'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
      'https://youtube.com/playlist?list=PL123456789abcdef'
    ],
    channel: [
      'https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw',
      'https://www.youtube.com/@MrBeast',
      'https://youtube.com/c/PewDiePie'
    ]
  },

  // Instagram Platform
  instagram: {
    post: [
      'https://www.instagram.com/p/ABC123xyz/',
      'https://instagram.com/p/XYZ789abc/'
    ],
    reel: [
      'https://www.instagram.com/reel/ABC123xyz/',
      'https://instagram.com/reels/XYZ789abc/'
    ],
    story: [
      'https://www.instagram.com/stories/username/1234567890/',
      'https://instagram.com/stories/testuser/9876543210/'
    ],
    profile: [
      'https://www.instagram.com/instagram/',
      'https://instagram.com/natgeo/'
    ],
    igtv: [
      'https://www.instagram.com/tv/ABC123xyz/'
    ]
  },

  // TikTok Platform
  tiktok: {
    video: [
      'https://www.tiktok.com/@username/video/1234567890123456789',
      'https://tiktok.com/@test/video/9876543210987654321',
      'https://vm.tiktok.com/ZMxxxxxx/'
    ],
    profile: [
      'https://www.tiktok.com/@username',
      'https://tiktok.com/@testuser'
    ],
    music: [
      'https://www.tiktok.com/music/song-name-1234567890'
    ]
  },

  // Twitter/X Platform
  twitter: {
    tweet: [
      'https://twitter.com/elonmusk/status/1234567890123456789',
      'https://x.com/elonmusk/status/9876543210987654321',
      'https://twitter.com/NASA/status/1234567890123456789'
    ],
    profile: [
      'https://twitter.com/elonmusk',
      'https://x.com/NASA'
    ],
    space: [
      'https://twitter.com/i/spaces/1rmGPgNWyZNJN'
    ]
  },

  // Reddit Platform
  reddit: {
    post: [
      'https://www.reddit.com/r/programming/comments/abc123/test_post/',
      'https://reddit.com/r/pics/comments/xyz789/amazing_photo/',
      'https://old.reddit.com/r/videos/comments/123abc/funny_video/'
    ],
    gallery: [
      'https://www.reddit.com/gallery/abc123'
    ],
    video: [
      'https://v.redd.it/abc123xyz',
      'https://www.reddit.com/r/videos/comments/abc123/'
    ],
    subreddit: [
      'https://www.reddit.com/r/javascript/',
      'https://reddit.com/r/programming/'
    ],
    user: [
      'https://www.reddit.com/user/spez/'
    ]
  },

  // GitHub Platform
  github: {
    repo: [
      'https://github.com/microsoft/vscode',
      'https://github.com/facebook/react',
      'https://github.com/nodejs/node'
    ],
    release: [
      'https://github.com/microsoft/vscode/releases/tag/1.85.0',
      'https://github.com/nodejs/node/releases/latest'
    ],
    file: [
      'https://github.com/microsoft/vscode/blob/main/README.md',
      'https://raw.githubusercontent.com/microsoft/vscode/main/package.json'
    ],
    gist: [
      'https://gist.github.com/user/abc123xyz789'
    ]
  },

  // CivitAI Platform
  civitai: {
    model: [
      'https://civitai.com/models/12345',
      'https://civitai.com/models/12345/model-name'
    ],
    image: [
      'https://civitai.com/images/123456'
    ],
    user: [
      'https://civitai.com/user/username'
    ],
    article: [
      'https://civitai.com/articles/12345'
    ]
  },

  // Telegram Platform  
  telegram: {
    channel: [
      'https://t.me/telegram',
      'https://t.me/s/durov'
    ],
    post: [
      'https://t.me/telegram/123',
      'https://t.me/durov/456'
    ]
  },

  // Archive Platform
  archive: {
    wayback: [
      'https://web.archive.org/web/20210101000000/https://example.com/',
      'https://archive.org/details/example-item'
    ],
    archiveIs: [
      'https://archive.is/abc123',
      'https://archive.ph/xyz789'
    ],
    pastebin: [
      'https://pastebin.com/abc123XY'
    ],
    arxiv: [
      'https://arxiv.org/abs/2301.00000',
      'https://arxiv.org/pdf/2301.00000.pdf'
    ]
  },

  // News Platform
  news: {
    bbc: [
      'https://www.bbc.com/news/world-12345678',
      'https://www.bbc.co.uk/news/technology-12345678'
    ],
    cnn: [
      'https://www.cnn.com/2024/01/01/tech/article-headline/index.html'
    ],
    nytimes: [
      'https://www.nytimes.com/2024/01/01/technology/article.html'
    ],
    guardian: [
      'https://www.theguardian.com/technology/2024/jan/01/article-headline'
    ],
    reuters: [
      'https://www.reuters.com/technology/article-headline-2024-01-01/'
    ]
  },

  // Generic/Direct URLs
  generic: {
    directFile: [
      'https://example.com/file.mp4',
      'https://example.com/image.jpg',
      'https://example.com/document.pdf'
    ],
    webpage: [
      'https://example.com/page',
      'https://example.org/article'
    ]
  },

  // Onion/Dark Web (mock URLs)
  onion: {
    site: [
      'http://example.onion/page',
      'http://test123abc.onion/'
    ]
  }
};

/**
 * Expected parse results for URL pattern tests
 */
export const EXPECTED_PARSE_RESULTS = {
  youtube: {
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ': {
      contentType: 'video',
      id: 'dQw4w9WgXcQ'
    },
    'https://youtu.be/dQw4w9WgXcQ': {
      contentType: 'video',
      id: 'dQw4w9WgXcQ'
    },
    'https://www.youtube.com/shorts/abc123xyz45': {
      contentType: 'shorts',
      id: 'abc123xyz45'
    },
    'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf': {
      contentType: 'playlist',
      id: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
    }
  },

  instagram: {
    'https://www.instagram.com/p/ABC123xyz/': {
      contentType: 'post',
      shortcode: 'ABC123xyz'
    },
    'https://www.instagram.com/reel/ABC123xyz/': {
      contentType: 'reel',
      shortcode: 'ABC123xyz'
    },
    'https://www.instagram.com/stories/username/1234567890/': {
      contentType: 'story',
      shortcode: 'username'
    }
  },

  tiktok: {
    'https://www.tiktok.com/@username/video/1234567890123456789': {
      contentType: 'video',
      username: 'username',
      id: '1234567890123456789'
    }
  },

  twitter: {
    'https://twitter.com/elonmusk/status/1234567890123456789': {
      contentType: 'tweet',
      username: 'elonmusk',
      id: '1234567890123456789'
    },
    'https://x.com/elonmusk/status/9876543210987654321': {
      contentType: 'tweet',
      username: 'elonmusk',
      id: '9876543210987654321'
    }
  },

  reddit: {
    'https://www.reddit.com/r/programming/comments/abc123/test_post/': {
      contentType: 'post',
      subreddit: 'programming',
      id: 'abc123'
    }
  },

  github: {
    'https://github.com/microsoft/vscode': {
      contentType: 'repo',
      owner: 'microsoft',
      repo: 'vscode'
    }
  }
};

/**
 * API endpoints to test for each platform
 */
export const API_ENDPOINTS = {
  youtube: {
    info: 'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json'
  },
  instagram: {
    igram: 'https://api.igram.io/api/convert',
    snapinsta: 'https://snapinsta.app/api/convert'
  },
  reddit: {
    jsonApi: 'https://www.reddit.com/r/programming/.json'
  },
  github: {
    api: 'https://api.github.com/repos/microsoft/vscode'
  }
};

/**
 * Invalid URLs that should fail gracefully
 */
export const INVALID_URLS = [
  '',
  null,
  undefined,
  'not-a-url',
  'http://',
  'https://',
  'ftp://example.com',
  'javascript:alert(1)',
  '<script>alert(1)</script>',
  'https://youtube.com/watch?v=',
  'https://instagram.com/p/',
  'https://twitter.com/status/',
  'https://github.com/',
  '://missing-protocol.com'
];

/**
 * Rate limit test data
 */
export const RATE_LIMIT_TEST = {
  burstSize: 50,
  delayBetweenRequests: 100,
  expectedThreshold: 30
};

/**
 * Platform detection test cases
 */
export const PLATFORM_DETECTION = [
  { url: 'https://www.youtube.com/watch?v=test', expected: 'youtube' },
  { url: 'https://youtu.be/test', expected: 'youtube' },
  { url: 'https://www.instagram.com/p/test/', expected: 'instagram' },
  { url: 'https://instagr.am/p/test/', expected: 'instagram' },
  { url: 'https://www.tiktok.com/@user/video/123', expected: 'tiktok' },
  { url: 'https://vm.tiktok.com/test/', expected: 'tiktok' },
  { url: 'https://twitter.com/user/status/123', expected: 'twitter' },
  { url: 'https://x.com/user/status/123', expected: 'twitter' },
  { url: 'https://www.reddit.com/r/test/', expected: 'reddit' },
  { url: 'https://redd.it/test', expected: 'reddit' },
  { url: 'https://github.com/user/repo', expected: 'github' },
  { url: 'https://civitai.com/models/123', expected: 'civitai' },
  { url: 'https://t.me/channel', expected: 'telegram' },
  { url: 'https://web.archive.org/web/test', expected: 'archive' },
  { url: 'https://www.bbc.com/news/test', expected: 'news' },
  { url: 'https://example.onion/', expected: 'onion' },
  { url: 'https://random-website.com/', expected: 'generic' }
];

/**
 * Regex patterns from platforms for validation
 */
export const PLATFORM_PATTERNS = {
  youtube: {
    video: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    shorts: /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    playlist: /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    channel: /youtube\.com\/(c\/|channel\/|@)([^\/\?]+)/
  },
  instagram: {
    post: /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    reel: /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    story: /instagram\.com\/stories\/([^\/]+)\/(\d+)/,
    profile: /instagram\.com\/([A-Za-z0-9._]+)\/?$/
  },
  tiktok: {
    video: /tiktok\.com\/@([^\/]+)\/video\/(\d+)/,
    shortlink: /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    profile: /tiktok\.com\/@([^\/]+)\/?$/
  },
  twitter: {
    tweet: /(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/,
    profile: /(?:twitter\.com|x\.com)\/([^\/]+)\/?$/
  },
  reddit: {
    post: /reddit\.com\/r\/([^\/]+)\/comments\/([a-z0-9]+)/,
    subreddit: /reddit\.com\/r\/([^\/]+)\/?$/
  },
  github: {
    repo: /github\.com\/([^\/]+)\/([^\/]+)\/?$/,
    release: /github\.com\/([^\/]+)\/([^\/]+)\/releases/,
    file: /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/
  }
};

/**
 * Mock responses for API testing
 */
export const MOCK_RESPONSES = {
  youtube: {
    success: {
      title: 'Test Video',
      author_name: 'Test Channel',
      author_url: 'https://www.youtube.com/channel/test',
      type: 'video',
      html: '<iframe></iframe>',
      width: 480,
      height: 270,
      thumbnail_url: 'https://i.ytimg.com/vi/test/hqdefault.jpg'
    },
    error: {
      error: 'Not Found'
    }
  },
  github: {
    success: {
      id: 12345,
      name: 'vscode',
      full_name: 'microsoft/vscode',
      description: 'Visual Studio Code',
      stargazers_count: 150000,
      forks_count: 25000
    }
  }
};

export default {
  TEST_URLS,
  EXPECTED_PARSE_RESULTS,
  API_ENDPOINTS,
  INVALID_URLS,
  RATE_LIMIT_TEST,
  PLATFORM_DETECTION,
  PLATFORM_PATTERNS,
  MOCK_RESPONSES
};
