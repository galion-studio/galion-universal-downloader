import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Link2, 
  Globe, 
  Github, 
  Youtube, 
  Send, 
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Zap,
  MessageCircle,
  Search,
  Key,
  Music,
  Camera,
  Twitter,
  Film,
  MessageSquare,
  Image,
  Headphones,
  Tv,
  ListPlus
} from 'lucide-react'
import { TAGLINES, SOCIAL_LINKS } from '@/lib/galion-ecosystem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { QueuePanel } from './queue-panel'
import { apiClient } from '@/lib/api-client'

type Platform = 'civitai' | 'github' | 'youtube' | 'telegram' | 'huggingface' | 'instagram' | 'tiktok' | 'twitter' | 'reddit' | 'vimeo' | 'soundcloud' | 'pinterest' | 'facebook' | 'twitch' | 'generic' | null

interface DownloadItem {
  id: string
  url: string
  platform: Platform
  filename: string
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'error'
  error?: string
}

// Extended platform configuration with all supported platforms + open-source APIs
const platformConfig = {
  civitai: { icon: Sparkles, label: 'CivitAI', color: 'text-purple-400', emoji: '🎨', api: 'civitai-api', github: 'civitai/civitai' },
  github: { icon: Github, label: 'GitHub', color: 'text-white', emoji: '🐙', api: '@octokit/rest', github: 'octokit/octokit.js' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-400', emoji: '▶️', api: 'yt-dlp', github: 'yt-dlp/yt-dlp' },
  telegram: { icon: Send, label: 'Telegram', color: 'text-blue-400', emoji: '✈️', api: 'telegraf', github: 'telegraf/telegraf' },
  huggingface: { icon: Zap, label: 'HuggingFace', color: 'text-yellow-400', emoji: '🤗', api: '@huggingface/hub', github: 'huggingface/huggingface.js' },
  instagram: { icon: Camera, label: 'Instagram', color: 'text-pink-400', emoji: '📸', api: 'instaloader', github: 'instaloader/instaloader' },
  tiktok: { icon: Music, label: 'TikTok', color: 'text-cyan-400', emoji: '🎵', api: 'tiktok-api', github: 'davidteather/TikTok-Api' },
  twitter: { icon: Twitter, label: 'Twitter/X', color: 'text-sky-400', emoji: '🐦', api: 'twitter-api-v2', github: 'PLhery/node-twitter-api-v2' },
  reddit: { icon: MessageSquare, label: 'Reddit', color: 'text-orange-400', emoji: '🔴', api: 'snoowrap', github: 'not-an-aardvark/snoowrap' },
  vimeo: { icon: Film, label: 'Vimeo', color: 'text-blue-300', emoji: '🎥', api: 'vimeo', github: 'vimeo/vimeo.js' },
  soundcloud: { icon: Headphones, label: 'SoundCloud', color: 'text-orange-500', emoji: '🔊', api: 'soundcloud-dl', github: 'soundcloud-dl/soundcloud-dl' },
  pinterest: { icon: Image, label: 'Pinterest', color: 'text-red-500', emoji: '📌', api: 'pinterest-api', github: 'pinterest/api-quickstart' },
  facebook: { icon: MessageCircle, label: 'Facebook', color: 'text-blue-500', emoji: '📘', api: 'fb-graph-api', github: 'node-facebook' },
  twitch: { icon: Tv, label: 'Twitch', color: 'text-purple-500', emoji: '🎮', api: 'tmi.js', github: 'tmijs/tmi.js' },
  spotify: { icon: Music, label: 'Spotify', color: 'text-green-500', emoji: '🎧', api: 'spotify-web-api-node', github: 'thelinmichael/spotify-web-api-node' },
  dailymotion: { icon: Film, label: 'Dailymotion', color: 'text-blue-400', emoji: '📹', api: 'dailymotion-sdk', github: 'dailymotion/dailymotion-sdk-js' },
  bandcamp: { icon: Headphones, label: 'Bandcamp', color: 'text-cyan-300', emoji: '🎸', api: 'bandcamp-scraper', github: 'masterT/bandcamp-scraper' },
  mixcloud: { icon: Headphones, label: 'Mixcloud', color: 'text-indigo-400', emoji: '🎛️', api: 'yt-dlp', github: 'yt-dlp/yt-dlp' },
  bilibili: { icon: Film, label: 'Bilibili', color: 'text-pink-300', emoji: '📺', api: 'bilibili-api', github: 'Nemo2011/bilibili-api' },
  niconico: { icon: Film, label: 'NicoNico', color: 'text-gray-400', emoji: '🎬', api: 'yt-dlp', github: 'yt-dlp/yt-dlp' },
  generic: { icon: Globe, label: 'Generic', color: 'text-gray-400', emoji: '🌐', api: 'yt-dlp', github: 'yt-dlp/yt-dlp' },
}

// Platform categories for organized display
const platformCategories = {
  popular: ['youtube', 'instagram', 'tiktok', 'twitter', 'github'],
  social: ['facebook', 'reddit', 'pinterest', 'telegram'],
  video: ['vimeo', 'twitch'],
  audio: ['soundcloud'],
  ai: ['civitai', 'huggingface'],
}

function detectPlatform(url: string): Platform {
  if (!url) return null
  const urlLower = url.toLowerCase()
  
  // AI & Models
  if (urlLower.includes('civitai.com')) return 'civitai'
  if (urlLower.includes('huggingface.co') || urlLower.includes('hf.co')) return 'huggingface'
  
  // Code
  if (urlLower.includes('github.com')) return 'github'
  
  // Video
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube'
  if (urlLower.includes('vimeo.com')) return 'vimeo'
  if (urlLower.includes('twitch.tv')) return 'twitch'
  
  // Social
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) return 'instagram'
  if (urlLower.includes('tiktok.com') || urlLower.includes('vm.tiktok.com')) return 'tiktok'
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com') || urlLower.includes('t.co')) return 'twitter'
  if (urlLower.includes('reddit.com') || urlLower.includes('redd.it')) return 'reddit'
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.com') || urlLower.includes('fb.watch')) return 'facebook'
  if (urlLower.includes('pinterest.')) return 'pinterest'
  
  // Messaging
  if (urlLower.includes('t.me') || urlLower.includes('telegram')) return 'telegram'
  
  // Audio
  if (urlLower.includes('soundcloud.com')) return 'soundcloud'
  
  // Generic fallback
  if (url.startsWith('http')) return 'generic'
  return null
}

export function DownloadSection() {
  const [url, setUrl] = useState('')
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showApiSearch, setShowApiSearch] = useState(false)
  const [apiSearchQuery, setApiSearchQuery] = useState('')
  const { toast } = useToast()
  
  const detectedPlatform = detectPlatform(url)
  const PlatformIcon = detectedPlatform ? platformConfig[detectedPlatform].icon : Link2

  const handleDownload = async () => {
    if (!url.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    const downloadUrl = url
    setUrl('')
    
    const newDownload: DownloadItem = {
      id: Date.now().toString(),
      url: downloadUrl,
      platform: detectedPlatform,
      filename: downloadUrl.split('/').pop() || 'file',
      progress: 0,
      status: 'downloading',
    }
    
    setDownloads(prev => [newDownload, ...prev])
    
    try {
      // Call the real backend API
      const result = await apiClient.download(
        downloadUrl,
        { downloadFiles: true },
        (progress) => {
          // Update progress in real-time
          setDownloads(prev => 
            prev.map(d => 
              d.id === newDownload.id 
                ? { 
                    ...d, 
                    progress: progress.progress || d.progress,
                    filename: progress.result?.title || d.filename,
                    status: progress.type === 'complete' ? 'completed' : 
                            progress.type === 'error' ? 'error' : 'downloading',
                    error: progress.message
                  }
                : d
            )
          )
        }
      )

      if (result.success) {
        setDownloads(prev => 
          prev.map(d => 
            d.id === newDownload.id 
              ? { ...d, progress: 100, status: 'completed', filename: result.title || d.filename }
              : d
          )
        )
        toast({
          title: '✅ Download Complete',
          description: `Downloaded to: ${result.outputDir || 'downloads folder'}`,
          variant: 'default',
        })
      } else {
        setDownloads(prev => 
          prev.map(d => 
            d.id === newDownload.id 
              ? { ...d, status: 'error', error: result.error }
              : d
          )
        )
        toast({
          title: '❌ Download Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setDownloads(prev => 
        prev.map(d => 
          d.id === newDownload.id 
            ? { ...d, status: 'error', error: error instanceof Error ? error.message : 'Download failed' }
            : d
        )
      )
      toast({
        title: '❌ Download Failed',
        description: error instanceof Error ? error.message : 'Could not connect to server. Make sure backend is running on port 3000.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter platforms based on search
  const filteredPlatforms = Object.entries(platformConfig).filter(([key, config]) =>
    apiSearchQuery === '' || 
    key.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
    config.label.toLowerCase().includes(apiSearchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 relative">
      {/* Aurora Background */}
      <div className="aurora-bg" />
      
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 relative"
      >
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
        
        <motion.p 
          className="text-sm text-galion-400 mb-4 tracking-widest uppercase"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {TAGLINES.main}
        </motion.p>
        <h1 className="text-5xl font-bold mb-6">
          <span className="gradient-text-animated">Universal Downloader</span>
        </h1>
        <motion.p 
          className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {TAGLINES.download}
          <br />
          <span className="text-sm mt-2 block opacity-75">
            YouTube • Instagram • TikTok • Twitter/X • Reddit • GitHub • CivitAI • 30+ Platforms
          </span>
        </motion.p>
        
        {/* Ecosystem Links */}
        <motion.div 
          className="flex justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <a 
            href={SOCIAL_LINKS.galionApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-galion-500/30 hover:border-galion-500 hover:bg-galion-500/10 transition-all duration-300 text-sm hover:scale-105 icon-bounce"
          >
            <MessageCircle className="h-4 w-4 text-galion-400" />
            Talk to Galion AI
          </a>
          <a 
            href={SOCIAL_LINKS.huggingFace}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all duration-300 text-sm hover:scale-105 icon-bounce"
          >
            <Zap className="h-4 w-4 text-yellow-400" />
            HuggingFace
          </a>
        </motion.div>
      </motion.div>

      {/* URL Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-galion-500/20 bg-gradient-to-br from-background to-galion-500/5 card-3d shimmer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-galion-500 icon-bounce" />
                  Start Download
                </CardTitle>
                <CardDescription>
                  Paste any URL to automatically detect the platform and download
                </CardDescription>
              </div>
              {/* API Search Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowApiSearch(!showApiSearch)}
              >
                <Search className="h-4 w-4" />
                <Key className="h-4 w-4" />
                API Search
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* API Search Panel */}
            <AnimatePresence>
              {showApiSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search platforms and APIs..."
                      value={apiSearchQuery}
                      onChange={(e) => setApiSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filteredPlatforms.slice(0, 15).map(([key, config]) => (
                      <Badge
                        key={key}
                        variant="outline"
                        className={cn(
                          "cursor-pointer hover:scale-105 transition-transform",
                          config.color
                        )}
                        onClick={() => {
                          const cfg = config as typeof config & { api?: string; github?: string }
                          if (cfg.github) {
                            window.open(`https://github.com/${cfg.github}`, '_blank')
                          }
                          toast({
                            title: `${config.label} API`,
                            description: cfg.api ? `Using: ${cfg.api} (${cfg.github})` : `Paste a ${config.label} URL to download`,
                          })
                        }}
                      >
                        <config.icon className={cn("h-3 w-3 mr-1", config.color)} />
                        {config.label}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Open-Source APIs Section */}
                  <div className="mt-3 p-3 rounded-lg bg-background/50 border border-dashed border-galion-500/30">
                    <div className="flex items-center gap-2 text-xs font-medium mb-2">
                      <Github className="h-3.5 w-3.5" />
                      Open-Source APIs Used
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-galion-500/20" onClick={() => window.open('https://github.com/yt-dlp/yt-dlp', '_blank')}>
                        yt-dlp ⭐ 91k
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-galion-500/20" onClick={() => window.open('https://github.com/instaloader/instaloader', '_blank')}>
                        instaloader ⭐ 8k
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-galion-500/20" onClick={() => window.open('https://github.com/davidteather/TikTok-Api', '_blank')}>
                        TikTok-Api ⭐ 5k
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-galion-500/20" onClick={() => window.open('https://github.com/SYSTRAN/faster-whisper', '_blank')}>
                        faster-whisper ⭐ 12k
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-galion-500/20" onClick={() => window.open('https://github.com/octokit/octokit.js', '_blank')}>
                        octokit ⭐ 7k
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    💡 Click any platform to open its GitHub API. Most work without API keys!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <motion.div 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  animate={detectedPlatform ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <PlatformIcon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    detectedPlatform ? platformConfig[detectedPlatform].color : "text-muted-foreground"
                  )} />
                </motion.div>
                <Input
                  placeholder="Paste URL here... (e.g., https://instagram.com/p/..., https://tiktok.com/@...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                  className="pl-10 h-12 text-base input-glow transition-all duration-300"
                />
                <AnimatePresence>
                  {detectedPlatform && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.5, x: 20 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <Badge variant="galion" className="bounce-in">
                        {platformConfig[detectedPlatform].emoji} {platformConfig[detectedPlatform].label}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleDownload}
                  disabled={isLoading || !detectedPlatform}
                  variant="galion"
                  size="xl"
                  className={cn(
                    "px-8 btn-ripple transition-all duration-300",
                    detectedPlatform && !isLoading && "pulse-glow"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Platform Pills - Popular */}
            <motion.div 
              className="flex flex-wrap gap-2 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-xs text-muted-foreground">Popular:</span>
              {platformCategories.popular.map((key, index) => {
                const config = platformConfig[key as keyof typeof platformConfig]
                if (!config) return null
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <Badge variant="outline" className="text-xs hover:scale-105 transition-transform cursor-default">
                      <config.icon className={cn("h-3 w-3 mr-1", config.color)} />
                      {config.label}
                    </Badge>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Platform Pills - Social */}
            <motion.div 
              className="flex flex-wrap gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <span className="text-xs text-muted-foreground">Social:</span>
              {platformCategories.social.map((key, index) => {
                const config = platformConfig[key as keyof typeof platformConfig]
                if (!config) return null
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                  >
                    <Badge variant="outline" className="text-xs hover:scale-105 transition-transform cursor-default">
                      <config.icon className={cn("h-3 w-3 mr-1", config.color)} />
                      {config.label}
                    </Badge>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Platform Pills - AI & More */}
            <motion.div 
              className="flex flex-wrap gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <span className="text-xs text-muted-foreground">AI & More:</span>
              {[...platformCategories.ai, ...platformCategories.video, ...platformCategories.audio].map((key, index) => {
                const config = platformConfig[key as keyof typeof platformConfig]
                if (!config) return null
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + index * 0.05 }}
                  >
                    <Badge variant="outline" className="text-xs hover:scale-105 transition-transform cursor-default">
                      <config.icon className={cn("h-3 w-3 mr-1", config.color)} />
                      {config.label}
                    </Badge>
                  </motion.div>
                )
              })}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Downloads */}
      <AnimatePresence>
        {downloads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 icon-bounce" />
                  Active Downloads
                  <Badge variant="galion" className="ml-2">{downloads.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {downloads.map((download, index) => (
                  <motion.div
                    key={download.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border bg-card card-3d",
                      download.status === 'completed' && "border-green-500/30 bg-green-500/5 success-pulse"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {download.platform && (
                          <motion.div
                            animate={download.status === 'downloading' ? { rotate: 360 } : {}}
                            transition={{ duration: 2, repeat: download.status === 'downloading' ? Infinity : 0, ease: "linear" }}
                          >
                            {(() => {
                              const Icon = platformConfig[download.platform].icon
                              return <Icon className={cn("h-5 w-5", platformConfig[download.platform].color)} />
                            })()}
                          </motion.div>
                        )}
                        <span className="font-medium truncate max-w-[300px]">
                          {download.filename}
                        </span>
                        {download.platform && (
                          <Badge variant="outline" className="text-xs">
                            {platformConfig[download.platform].label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {download.status === 'completed' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </motion.div>
                        )}
                        {download.status === 'error' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </motion.div>
                        )}
                        {download.status === 'downloading' && (
                          <span className="text-sm font-mono text-galion-500">
                            {Math.round(download.progress)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "h-2 rounded-full overflow-hidden bg-muted",
                      download.status === 'downloading' && "progress-liquid"
                    )}>
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          download.status === 'completed' 
                            ? "bg-green-500" 
                            : "bg-gradient-to-r from-galion-500 to-galion-400"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${download.progress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Download Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs defaultValue="batch" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="batch" className="gap-2">
              <ListPlus className="h-4 w-4" />
              Batch Download
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Download className="h-4 w-4" />
              Stats
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="batch">
            <QueuePanel 
              onAddUrls={(urls, options) => {
                toast({
                  title: 'Added to Queue',
                  description: `${urls.length} URL(s) added with quality: ${options.quality}`,
                })
              }}
            />
          </TabsContent>
          
          <TabsContent value="stats">
            {/* Quick Stats */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {[
                { value: downloads.filter(d => d.status === 'completed').length, label: 'Downloads Today', delay: 0 },
                { value: '0 MB', label: 'Total Downloaded', delay: 0.1 },
                { value: '30+', label: 'Supported Platforms', delay: 0.2 }
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + stat.delay }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card className="text-center p-6 card-3d hover:border-galion-500/30 transition-colors">
                    <motion.div 
                      className="text-3xl font-bold gradient-text-animated"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + stat.delay, type: "spring", stiffness: 200 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
