/**
 * Cognitive Engine - Galion Universal Downloader
 * 
 * Neural-net style knowledge management system inspired by Project Synapse
 * Implements local, serverless cognitive search and learning
 * 
 * @see developer.galion.app
 * @license MIT
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class CognitiveEngine {
  constructor(options = {}) {
    this.dataDir = options.dataDir || './data/cognitive';
    this.knowledgeGraph = new Map();
    this.semanticIndex = new Map();
    this.userSessions = new Map();
    this.insights = [];
    this.decayRate = 0.95;
    
    // Pattern detection thresholds
    this.clusterThreshold = 0.7;
    this.bridgeThreshold = 0.3;
    
    this.initialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadKnowledgeGraph();
      await this.loadSessions();
      this.initialized = true;
      console.log('✓ Cognitive Engine initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Cognitive Engine:', error);
      return false;
    }
  }

  // ============================
  // Knowledge Graph Management
  // ============================

  async loadKnowledgeGraph() {
    const graphPath = path.join(this.dataDir, 'knowledge-graph.json');
    try {
      const data = await fs.readFile(graphPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.knowledgeGraph = new Map(Object.entries(parsed.nodes || {}));
      this.semanticIndex = new Map(Object.entries(parsed.index || {}));
      this.insights = parsed.insights || [];
      console.log(`  Loaded ${this.knowledgeGraph.size} knowledge nodes`);
    } catch (error) {
      // Fresh start
      this.knowledgeGraph = new Map();
      this.semanticIndex = new Map();
      this.insights = [];
    }
  }

  async saveKnowledgeGraph() {
    const graphPath = path.join(this.dataDir, 'knowledge-graph.json');
    const data = {
      nodes: Object.fromEntries(this.knowledgeGraph),
      index: Object.fromEntries(this.semanticIndex),
      insights: this.insights,
      savedAt: new Date().toISOString()
    };
    await fs.writeFile(graphPath, JSON.stringify(data, null, 2));
  }

  // ============================
  // Semantic Processing (Zettelkasten-style)
  // ============================

  /**
   * Ingest and analyze content, extracting semantic meaning
   */
  async ingestContent(content, metadata = {}) {
    const nodeId = this.generateId(content);
    const timestamp = Date.now();
    
    // Extract semantic features
    const features = this.extractSemanticFeatures(content);
    const keywords = this.extractKeywords(content);
    const entities = this.extractEntities(content);
    
    // Create knowledge node
    const node = {
      id: nodeId,
      content: content.substring(0, 1000), // Store snippet
      contentHash: this.hashContent(content),
      features,
      keywords,
      entities,
      metadata: {
        ...metadata,
        ingestedAt: timestamp,
        contentLength: content.length
      },
      connections: [],
      score: 1.0
    };
    
    // Find and create connections to related nodes
    const connections = await this.findRelatedNodes(node);
    node.connections = connections.map(c => ({
      targetId: c.id,
      similarity: c.similarity,
      relationshipType: c.type
    }));
    
    // Add bidirectional connections
    for (const conn of node.connections) {
      const targetNode = this.knowledgeGraph.get(conn.targetId);
      if (targetNode) {
        targetNode.connections.push({
          targetId: nodeId,
          similarity: conn.similarity,
          relationshipType: conn.relationshipType
        });
      }
    }
    
    // Index for search
    for (const keyword of keywords) {
      if (!this.semanticIndex.has(keyword)) {
        this.semanticIndex.set(keyword, []);
      }
      this.semanticIndex.get(keyword).push(nodeId);
    }
    
    this.knowledgeGraph.set(nodeId, node);
    await this.saveKnowledgeGraph();
    
    return {
      nodeId,
      connections: node.connections.length,
      keywords,
      entities
    };
  }

  /**
   * Extract semantic features from content using TF-IDF-like approach
   */
  extractSemanticFeatures(content) {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    const wordFreq = new Map();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
    
    // Get top features
    const features = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, freq]) => ({ word, weight: freq / words.length }));
    
    return features;
  }

  /**
   * Extract keywords using statistical and heuristic methods
   */
  extractKeywords(content) {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
      'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'he',
      'she', 'we', 'you', 'i', 'me', 'my', 'your', 'his', 'her', 'our'
    ]);
    
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    
    const freq = new Map();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
    
    return Array.from(freq.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
  }

  /**
   * Extract named entities (URLs, platforms, technologies)
   */
  extractEntities(content) {
    const entities = {
      urls: [],
      platforms: [],
      technologies: [],
      actions: []
    };
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    entities.urls = (content.match(urlRegex) || []).slice(0, 10);
    
    // Platform recognition
    const platformPatterns = [
      /civitai/gi, /github/gi, /youtube/gi, /telegram/gi,
      /instagram/gi, /twitter/gi, /tiktok/gi, /huggingface/gi
    ];
    for (const pattern of platformPatterns) {
      if (pattern.test(content)) {
        entities.platforms.push(pattern.source.replace(/\\gi?$/, ''));
      }
    }
    
    // Technology recognition
    const techPatterns = [
      /\bAI\b/g, /machine learning/gi, /neural net/gi, /deep learning/gi,
      /stable diffusion/gi, /lora/gi, /checkpoint/gi, /safetensor/gi,
      /\bAPI\b/g, /websocket/gi, /node\.?js/gi, /python/gi
    ];
    for (const pattern of techPatterns) {
      if (pattern.test(content)) {
        const match = content.match(pattern);
        if (match) entities.technologies.push(match[0]);
      }
    }
    
    // Action recognition
    const actionPatterns = [
      /download/gi, /upload/gi, /transcribe/gi, /analyze/gi,
      /search/gi, /scan/gi, /convert/gi, /extract/gi
    ];
    for (const pattern of actionPatterns) {
      if (pattern.test(content)) {
        entities.actions.push(pattern.source.replace(/\\gi?$/, ''));
      }
    }
    
    return entities;
  }

  /**
   * Find nodes related to the given node using cosine similarity
   */
  async findRelatedNodes(node) {
    const related = [];
    
    for (const [id, existingNode] of this.knowledgeGraph) {
      if (id === node.id) continue;
      
      const similarity = this.calculateSimilarity(node.features, existingNode.features);
      
      if (similarity > this.bridgeThreshold) {
        let type = 'related';
        if (similarity > this.clusterThreshold) type = 'cluster';
        else if (similarity > 0.5) type = 'bridge';
        
        related.push({
          id,
          similarity,
          type
        });
      }
    }
    
    return related.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  }

  /**
   * Calculate cosine similarity between feature vectors
   */
  calculateSimilarity(features1, features2) {
    const map1 = new Map(features1.map(f => [f.word, f.weight]));
    const map2 = new Map(features2.map(f => [f.word, f.weight]));
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const [word, weight] of map1) {
      norm1 += weight * weight;
      if (map2.has(word)) {
        dotProduct += weight * map2.get(word);
      }
    }
    
    for (const [_, weight] of map2) {
      norm2 += weight * weight;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // ============================
  // Cognitive Search
  // ============================

  /**
   * Perform cognitive search with semantic understanding
   */
  async cognitiveSearch(query, options = {}) {
    const {
      limit = 10,
      minScore = 0.1,
      includeConnections = true
    } = options;
    
    const queryFeatures = this.extractSemanticFeatures(query);
    const queryKeywords = this.extractKeywords(query);
    
    const results = [];
    
    // Direct keyword matches
    const directMatches = new Set();
    for (const keyword of queryKeywords) {
      const nodeIds = this.semanticIndex.get(keyword) || [];
      for (const nodeId of nodeIds) {
        directMatches.add(nodeId);
      }
    }
    
    // Score all potential matches
    for (const nodeId of directMatches) {
      const node = this.knowledgeGraph.get(nodeId);
      if (!node) continue;
      
      // Calculate relevance score
      const semanticScore = this.calculateSimilarity(queryFeatures, node.features);
      const keywordOverlap = this.calculateKeywordOverlap(queryKeywords, node.keywords);
      
      // Combined score with weights
      const score = (semanticScore * 0.6) + (keywordOverlap * 0.4);
      
      if (score >= minScore) {
        results.push({
          nodeId,
          score,
          node: {
            content: node.content,
            keywords: node.keywords,
            entities: node.entities,
            metadata: node.metadata
          },
          connections: includeConnections ? node.connections.slice(0, 5) : []
        });
      }
    }
    
    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    
    return {
      query,
      results: results.slice(0, limit),
      totalMatches: results.length,
      queryFeatures: queryFeatures.slice(0, 10),
      queryKeywords
    };
  }

  calculateKeywordOverlap(keywords1, keywords2) {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = [...set1].filter(k => set2.has(k));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.length / union.size : 0;
  }

  // ============================
  // Autonomous Insights (Zettelkasten)
  // ============================

  /**
   * Generate insights by analyzing the knowledge graph
   */
  async generateInsights() {
    const insights = [];
    const now = Date.now();
    
    // Find clusters (highly connected groups)
    const clusters = this.detectClusters();
    for (const cluster of clusters) {
      insights.push({
        type: 'cluster',
        description: `Discovered knowledge cluster: ${cluster.keywords.slice(0, 3).join(', ')}`,
        nodes: cluster.nodeIds,
        strength: cluster.cohesion,
        generatedAt: now
      });
    }
    
    // Find bridge nodes (connecting disparate clusters)
    const bridges = this.detectBridgeNodes();
    for (const bridge of bridges) {
      insights.push({
        type: 'bridge',
        description: `Bridge concept connecting multiple domains: ${bridge.keywords[0]}`,
        node: bridge.nodeId,
        connectedClusters: bridge.clusters,
        generatedAt: now
      });
    }
    
    // Find trending topics (high recent activity)
    const trending = this.detectTrending();
    for (const topic of trending) {
      insights.push({
        type: 'trending',
        description: `Trending topic: ${topic.keyword}`,
        frequency: topic.frequency,
        recentNodes: topic.recentNodes,
        generatedAt: now
      });
    }
    
    // Store insights
    this.insights = [...insights, ...this.insights].slice(0, 100);
    await this.saveKnowledgeGraph();
    
    return insights;
  }

  detectClusters() {
    const clusters = [];
    const visited = new Set();
    
    for (const [nodeId, node] of this.knowledgeGraph) {
      if (visited.has(nodeId)) continue;
      
      // Find strongly connected nodes
      const cluster = {
        nodeIds: [nodeId],
        keywords: [...node.keywords],
        cohesion: 0
      };
      
      for (const conn of node.connections) {
        if (conn.similarity > this.clusterThreshold) {
          cluster.nodeIds.push(conn.targetId);
          visited.add(conn.targetId);
          
          const connNode = this.knowledgeGraph.get(conn.targetId);
          if (connNode) {
            cluster.keywords.push(...connNode.keywords);
          }
        }
      }
      
      if (cluster.nodeIds.length >= 3) {
        // Calculate cohesion
        cluster.cohesion = this.calculateClusterCohesion(cluster.nodeIds);
        cluster.keywords = [...new Set(cluster.keywords)].slice(0, 10);
        clusters.push(cluster);
      }
      
      visited.add(nodeId);
    }
    
    return clusters.sort((a, b) => b.cohesion - a.cohesion).slice(0, 5);
  }

  calculateClusterCohesion(nodeIds) {
    if (nodeIds.length < 2) return 0;
    
    let totalSimilarity = 0;
    let pairs = 0;
    
    for (let i = 0; i < nodeIds.length; i++) {
      const node = this.knowledgeGraph.get(nodeIds[i]);
      if (!node) continue;
      
      for (const conn of node.connections) {
        if (nodeIds.includes(conn.targetId)) {
          totalSimilarity += conn.similarity;
          pairs++;
        }
      }
    }
    
    return pairs > 0 ? totalSimilarity / pairs : 0;
  }

  detectBridgeNodes() {
    const bridges = [];
    
    for (const [nodeId, node] of this.knowledgeGraph) {
      // Count connections to different clusters
      const clusterConnections = new Map();
      
      for (const conn of node.connections) {
        const connNode = this.knowledgeGraph.get(conn.targetId);
        if (!connNode) continue;
        
        const clusterKey = connNode.keywords[0] || 'unknown';
        clusterConnections.set(clusterKey, (clusterConnections.get(clusterKey) || 0) + 1);
      }
      
      if (clusterConnections.size >= 3) {
        bridges.push({
          nodeId,
          keywords: node.keywords,
          clusters: Array.from(clusterConnections.keys())
        });
      }
    }
    
    return bridges.slice(0, 5);
  }

  detectTrending() {
    const recentThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    const keywordFreq = new Map();
    
    for (const [_, node] of this.knowledgeGraph) {
      if (node.metadata.ingestedAt > recentThreshold) {
        for (const keyword of node.keywords) {
          if (!keywordFreq.has(keyword)) {
            keywordFreq.set(keyword, { frequency: 0, recentNodes: [] });
          }
          const entry = keywordFreq.get(keyword);
          entry.frequency++;
          entry.recentNodes.push(node.id);
        }
      }
    }
    
    return Array.from(keywordFreq.entries())
      .filter(([_, data]) => data.frequency >= 3)
      .map(([keyword, data]) => ({ keyword, ...data }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  // ============================
  // User Sessions (Local/Serverless)
  // ============================

  async loadSessions() {
    const sessionsPath = path.join(this.dataDir, 'sessions.json');
    try {
      const data = await fs.readFile(sessionsPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.userSessions = new Map(Object.entries(parsed));
      console.log(`  Loaded ${this.userSessions.size} user sessions`);
    } catch (error) {
      this.userSessions = new Map();
    }
  }

  async saveSessions() {
    const sessionsPath = path.join(this.dataDir, 'sessions.json');
    await fs.writeFile(sessionsPath, JSON.stringify(
      Object.fromEntries(this.userSessions), null, 2
    ));
  }

  /**
   * Create or get a user session (local, no server required)
   */
  async getOrCreateSession(sessionId = null) {
    if (sessionId && this.userSessions.has(sessionId)) {
      const session = this.userSessions.get(sessionId);
      session.lastAccess = Date.now();
      await this.saveSessions();
      return session;
    }
    
    // Create new session
    const newSessionId = sessionId || this.generateSessionId();
    const session = {
      id: newSessionId,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      preferences: {
        theme: 'auto',
        defaultPlatform: null,
        downloadPath: null
      },
      analytics: {
        platforms: {},
        features: {},
        actions: {},
        totalInteractions: 0
      },
      history: [],
      favorites: [],
      searchHistory: []
    };
    
    this.userSessions.set(newSessionId, session);
    await this.saveSessions();
    return session;
  }

  async updateSession(sessionId, updates) {
    const session = this.userSessions.get(sessionId);
    if (!session) return null;
    
    Object.assign(session, updates);
    session.lastAccess = Date.now();
    await this.saveSessions();
    return session;
  }

  async trackSessionActivity(sessionId, activityType, data = {}) {
    const session = this.userSessions.get(sessionId);
    if (!session) return;
    
    session.analytics.totalInteractions++;
    
    switch (activityType) {
      case 'platform':
        session.analytics.platforms[data.platformId] = 
          (session.analytics.platforms[data.platformId] || 0) + 1;
        break;
      case 'feature':
        session.analytics.features[data.featureId] = 
          (session.analytics.features[data.featureId] || 0) + 1;
        break;
      case 'search':
        session.searchHistory.unshift({
          query: data.query,
          timestamp: Date.now()
        });
        session.searchHistory = session.searchHistory.slice(0, 50);
        break;
      case 'download':
        session.history.unshift({
          url: data.url,
          platform: data.platform,
          timestamp: Date.now()
        });
        session.history = session.history.slice(0, 100);
        break;
    }
    
    await this.saveSessions();
  }

  // ============================
  // Utilities
  // ============================

  generateId(content) {
    return crypto.createHash('md5')
      .update(content + Date.now())
      .digest('hex')
      .substring(0, 16);
  }

  generateSessionId() {
    return 'session_' + crypto.randomBytes(16).toString('hex');
  }

  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // ============================
  // Statistics
  // ============================

  getStats() {
    const nodes = this.knowledgeGraph.size;
    const connections = Array.from(this.knowledgeGraph.values())
      .reduce((sum, node) => sum + node.connections.length, 0);
    const sessions = this.userSessions.size;
    
    return {
      knowledgeGraph: {
        nodes,
        connections,
        avgConnectionsPerNode: nodes > 0 ? (connections / nodes).toFixed(2) : 0
      },
      sessions,
      insights: this.insights.length,
      semanticIndex: this.semanticIndex.size
    };
  }
}

export default CognitiveEngine;
