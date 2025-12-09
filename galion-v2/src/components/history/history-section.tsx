import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Calendar,
  HardDrive,
  Clock,
  Github,
  Youtube,
  Send,
  Sparkles,
  Globe,
  FolderOpen,
  RefreshCw,
  Loader2,
  Camera,
  Music,
  Twitter
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes } from '@/lib/utils'
import { apiClient, HistoryItem as ApiHistoryItem } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface HistoryItem {
  id: string
  folder: string
  path: string
  filename: string
  url?: string
  platform: string
  size: number
  date: Date
  status: 'completed' | 'failed'
  metadata?: {
    title?: string
    platform?: string
    type?: string
  }
}

const platformIcons: Record<string, typeof Github> = {
  github: Github,
  youtube: Youtube,
  telegram: Send,
  civitai: Sparkles,
  instagram: Camera,
  tiktok: Music,
  twitter: Twitter,
  generic: Globe,
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function detectPlatformFromFolder(folder: string): string {
  const folderLower = folder.toLowerCase()
  if (folderLower.includes('civitai')) return 'civitai'
  if (folderLower.includes('github')) return 'github'
  if (folderLower.includes('youtube') || folderLower.includes('youtu')) return 'youtube'
  if (folderLower.includes('telegram')) return 'telegram'
  if (folderLower.includes('instagram') || folderLower.includes('insta')) return 'instagram'
  if (folderLower.includes('tiktok')) return 'tiktok'
  if (folderLower.includes('twitter') || folderLower.includes('x.com')) return 'twitter'
  return 'generic'
}

export function HistorySection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load history from API
  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.getHistory()
      const items: HistoryItem[] = data.map((item: ApiHistoryItem) => ({
        id: item.folder,
        folder: item.folder,
        path: item.path,
        filename: item.metadata?.title || item.folder,
        platform: item.metadata?.platform || detectPlatformFromFolder(item.folder),
        size: item.size,
        date: new Date(item.createdAt),
        status: 'completed' as const,
        metadata: item.metadata
      }))
      setHistory(items)
    } catch (error) {
      console.log('Failed to load history:', error)
      // Keep empty state
      setHistory([])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleDelete = async (folder: string) => {
    const success = await apiClient.deleteDownload(folder)
    if (success) {
      setHistory(prev => prev.filter(item => item.folder !== folder))
      toast({
        title: 'Deleted',
        description: 'Download removed from history',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete download',
        variant: 'destructive',
      })
    }
  }

  const handleOpenFolder = async (path: string) => {
    const success = await apiClient.openFolder(path)
    if (!success) {
      toast({
        title: 'Error',
        description: 'Failed to open folder',
        variant: 'destructive',
      })
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all downloads?')) return
    
    for (const item of history) {
      await apiClient.deleteDownload(item.folder)
    }
    setHistory([])
    toast({
      title: 'Cleared',
      description: 'All downloads have been removed',
    })
  }

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.folder || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || item.platform === filter
    return matchesSearch && matchesFilter
  })

  const totalSize = history.reduce((acc, item) => acc + item.size, 0)
  const totalDownloads = history.length
  const lastDownload = history.length > 0 ? formatDate(history[0].date) : 'Never'
  const successRate = history.length > 0 
    ? Math.round((history.filter(h => h.status === 'completed').length / history.length) * 100)
    : 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <History className="h-8 w-8 text-galion-500" />
            Download History
          </h1>
          <p className="text-muted-foreground">
            View and manage all your past downloads
          </p>
        </div>
        <Button variant="outline" onClick={loadHistory} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-galion-500/10 rounded-lg">
              <Download className="h-5 w-5 text-galion-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalDownloads}</div>
              <div className="text-xs text-muted-foreground">Total Downloads</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-galion-500/10 rounded-lg">
              <HardDrive className="h-5 w-5 text-galion-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
              <div className="text-xs text-muted-foreground">Total Size</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-galion-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-galion-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{lastDownload}</div>
              <div className="text-xs text-muted-foreground">Last Download</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Clock className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search downloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="text-destructive border-destructive/50"
                onClick={handleClearAll}
                disabled={history.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="civitai">CivitAI</TabsTrigger>
              <TabsTrigger value="github">GitHub</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-0">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                  <p>Loading history...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No downloads found</p>
                  <p className="text-sm mt-2">Downloads will appear here after you download something</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((item, index) => {
                    const Icon = platformIcons[item.platform] || Globe
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.filename}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {item.path}
                          </div>
                        </div>

                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <Badge variant="outline">{formatBytes(item.size)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.date)}
                          </span>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenFolder(item.path)}
                            title="Open folder"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => handleDelete(item.folder)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
