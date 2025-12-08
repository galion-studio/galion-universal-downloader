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
  MessageCircle
} from 'lucide-react'
import { TAGLINES, SOCIAL_LINKS } from '@/lib/galion-ecosystem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type Platform = 'civitai' | 'github' | 'youtube' | 'telegram' | 'huggingface' | 'generic' | null

interface DownloadItem {
  id: string
  url: string
  platform: Platform
  filename: string
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'error'
  error?: string
}

const platformConfig = {
  civitai: { icon: Sparkles, label: 'CivitAI', color: 'text-purple-400' },
  github: { icon: Github, label: 'GitHub', color: 'text-white' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-400' },
  telegram: { icon: Send, label: 'Telegram', color: 'text-blue-400' },
  huggingface: { icon: Zap, label: 'HuggingFace', color: 'text-yellow-400' },
  generic: { icon: Globe, label: 'Generic', color: 'text-gray-400' },
}

function detectPlatform(url: string): Platform {
  if (!url) return null
  if (url.includes('civitai.com')) return 'civitai'
  if (url.includes('github.com')) return 'github'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('t.me') || url.includes('telegram')) return 'telegram'
  if (url.includes('huggingface.co') || url.includes('hf.co')) return 'huggingface'
  if (url.startsWith('http')) return 'generic'
  return null
}

export function DownloadSection() {
  const [url, setUrl] = useState('')
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
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
    
    const newDownload: DownloadItem = {
      id: Date.now().toString(),
      url,
      platform: detectedPlatform,
      filename: url.split('/').pop() || 'file',
      progress: 0,
      status: 'downloading',
    }
    
    setDownloads(prev => [newDownload, ...prev])
    
    // Simulate download progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setDownloads(prev => 
          prev.map(d => 
            d.id === newDownload.id 
              ? { ...d, progress: 100, status: 'completed' }
              : d
          )
        )
        toast({
          title: 'Download Complete',
          description: `Successfully downloaded ${newDownload.filename}`,
          variant: 'default',
        })
        setIsLoading(false)
      } else {
        setDownloads(prev => 
          prev.map(d => 
            d.id === newDownload.id 
              ? { ...d, progress }
              : d
          )
        )
      }
    }, 500)

    setUrl('')
  }

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
            CivitAI • GitHub • YouTube • Telegram • HuggingFace • Any URL
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
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-galion-500 icon-bounce" />
              Start Download
            </CardTitle>
            <CardDescription>
              Paste any URL to automatically detect the platform and download
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  placeholder="Paste URL here... (e.g., https://civitai.com/models/...)"
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
                        {platformConfig[detectedPlatform].label}
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

            {/* Platform Pills */}
            <motion.div 
              className="flex flex-wrap gap-2 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-xs text-muted-foreground">Supported:</span>
              {Object.entries(platformConfig).map(([key, config], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Badge variant="outline" className="text-xs hover:scale-105 transition-transform cursor-default">
                    <config.icon className={cn("h-3 w-3 mr-1", config.color)} />
                    {config.label}
                  </Badge>
                </motion.div>
              ))}
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
          { value: '6', label: 'Platforms', delay: 0.2 }
        ].map((stat, index) => (
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
    </div>
  )
}
