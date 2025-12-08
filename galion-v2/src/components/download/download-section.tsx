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
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <motion.p 
          className="text-sm text-galion-400 mb-4 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {TAGLINES.main}
        </motion.p>
        <h1 className="text-5xl font-bold mb-6">
          <span className="gradient-text">Universal Downloader</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
          {TAGLINES.download}
          <br />
          <span className="text-sm mt-2 block opacity-75">
            CivitAI • GitHub • YouTube • Telegram • HuggingFace • Any URL
          </span>
        </p>
        
        {/* Ecosystem Links */}
        <div className="flex justify-center gap-4 mt-8">
          <a 
            href={SOCIAL_LINKS.galionApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-galion-500/30 hover:border-galion-500 hover:bg-galion-500/10 transition-colors text-sm"
          >
            <MessageCircle className="h-4 w-4 text-galion-400" />
            Talk to Galion AI
          </a>
          <a 
            href={SOCIAL_LINKS.huggingFace}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 transition-colors text-sm"
          >
            <Zap className="h-4 w-4 text-yellow-400" />
            HuggingFace
          </a>
        </div>
      </motion.div>

      {/* URL Input Card */}
      <Card className="border-galion-500/20 bg-gradient-to-br from-background to-galion-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-galion-500" />
            Start Download
          </CardTitle>
          <CardDescription>
            Paste any URL to automatically detect the platform and download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <PlatformIcon className={cn(
                  "h-5 w-5 transition-colors",
                  detectedPlatform ? platformConfig[detectedPlatform].color : "text-muted-foreground"
                )} />
              </div>
              <Input
                placeholder="Paste URL here... (e.g., https://civitai.com/models/...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                className="pl-10 h-12 text-base"
              />
              {detectedPlatform && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Badge variant="galion">
                    {platformConfig[detectedPlatform].label}
                  </Badge>
                </motion.div>
              )}
            </div>
            <Button 
              onClick={handleDownload}
              disabled={isLoading || !detectedPlatform}
              variant="galion"
              size="xl"
              className="px-8"
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
          </div>

          {/* Platform Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Supported:</span>
            {Object.entries(platformConfig).map(([key, config]) => (
              <Badge key={key} variant="outline" className="text-xs">
                <config.icon className={cn("h-3 w-3 mr-1", config.color)} />
                {config.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Downloads */}
      <AnimatePresence>
        {downloads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Active Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {downloads.map((download) => (
                  <motion.div
                    key={download.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {download.platform && (
                          <>
                            {(() => {
                              const Icon = platformConfig[download.platform].icon
                              return <Icon className={cn("h-4 w-4", platformConfig[download.platform].color)} />
                            })()}
                          </>
                        )}
                        <span className="font-medium truncate max-w-[300px]">
                          {download.filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {download.status === 'completed' && (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                        {download.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-error" />
                        )}
                        {download.status === 'downloading' && (
                          <span className="text-sm text-muted-foreground">
                            {Math.round(download.progress)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={download.progress} className="h-2" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center p-6">
          <div className="text-3xl font-bold text-galion-500">0</div>
          <div className="text-sm text-muted-foreground">Downloads Today</div>
        </Card>
        <Card className="text-center p-6">
          <div className="text-3xl font-bold text-galion-500">0 MB</div>
          <div className="text-sm text-muted-foreground">Total Downloaded</div>
        </Card>
        <Card className="text-center p-6">
          <div className="text-3xl font-bold text-galion-500">6</div>
          <div className="text-sm text-muted-foreground">Platforms</div>
        </Card>
      </div>
    </div>
  )
}
