import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  ExternalLink,
  Calendar,
  HardDrive,
  Clock,
  Github,
  Youtube,
  Send,
  Sparkles,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes } from '@/lib/utils'

interface HistoryItem {
  id: string
  filename: string
  url: string
  platform: string
  size: number
  date: Date
  status: 'completed' | 'failed'
}

const platformIcons: Record<string, typeof Github> = {
  github: Github,
  youtube: Youtube,
  telegram: Send,
  civitai: Sparkles,
  generic: Globe,
}

// Mock data for demonstration
const mockHistory: HistoryItem[] = [
  {
    id: '1',
    filename: 'stable-diffusion-xl-base.safetensors',
    url: 'https://civitai.com/models/12345',
    platform: 'civitai',
    size: 6892707840,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'completed',
  },
  {
    id: '2',
    filename: 'awesome-project-main.zip',
    url: 'https://github.com/user/repo',
    platform: 'github',
    size: 15728640,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'completed',
  },
  {
    id: '3',
    filename: 'tutorial-video.mp4',
    url: 'https://youtube.com/watch?v=abc123',
    platform: 'youtube',
    size: 524288000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: 'completed',
  },
]

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

export function HistorySection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')

  const filteredHistory = mockHistory.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || item.platform === filter
    return matchesSearch && matchesFilter
  })

  const totalSize = mockHistory.reduce((acc, item) => acc + item.size, 0)
  const totalDownloads = mockHistory.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <History className="h-8 w-8 text-galion-500" />
          Download History
        </h1>
        <p className="text-muted-foreground">
          View and manage all your past downloads
        </p>
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
              <div className="text-2xl font-bold">Today</div>
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
              <div className="text-2xl font-bold">100%</div>
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
              <Button variant="outline" className="text-destructive border-destructive/50">
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
              <TabsTrigger value="telegram">Telegram</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-0">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No downloads found</p>
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
                            {item.url}
                          </div>
                        </div>

                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <Badge variant="outline">{formatBytes(item.size)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.date)}
                          </span>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
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
