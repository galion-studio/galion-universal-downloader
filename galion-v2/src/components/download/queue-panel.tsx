/**
 * Queue Panel Component - Batch Downloads & Queue Management
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ListPlus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings2,
  Zap,
  Download,
  FolderOpen
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { apiClient, DownloadProgress } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

// Quality options for different platforms
const QUALITY_OPTIONS = [
  { value: 'best', label: 'Best Quality', description: '4K/8K if available' },
  { value: '1080p', label: '1080p', description: 'Full HD' },
  { value: '720p', label: '720p', description: 'HD' },
  { value: '480p', label: '480p', description: 'SD' },
  { value: 'audio', label: 'Audio Only', description: 'MP3 320kbps' },
]

interface QueueItem {
  id: string
  url: string
  status: 'pending' | 'downloading' | 'completed' | 'failed'
  progress: number
  speed: number
  title?: string
  platform?: string
  quality: string
  error?: string
  priority: number
}

interface QueuePanelProps {
  onAddUrls?: (urls: string[], options: { quality: string }) => void
  onPause?: () => void
  onResume?: () => void
  isPaused?: boolean
}

export function QueuePanel({ onAddUrls, onPause, onResume, isPaused = false }: QueuePanelProps) {
  const [batchText, setBatchText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('best')
  const [showQualityPanel, setShowQualityPanel] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [maxConcurrent, setMaxConcurrent] = useState(3)
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false)
  const { toast } = useToast()

  // Process queue - start downloads for pending items
  useEffect(() => {
    if (isPaused || processingRef.current) return
    
    const pendingItems = queue.filter(i => i.status === 'pending')
    const downloadingItems = queue.filter(i => i.status === 'downloading')
    
    // Check if we can start more downloads
    if (downloadingItems.length >= maxConcurrent || pendingItems.length === 0) return
    
    // Start next download(s)
    const itemsToStart = pendingItems.slice(0, maxConcurrent - downloadingItems.length)
    
    for (const item of itemsToStart) {
      startDownload(item)
    }
  }, [queue, isPaused, maxConcurrent])

  // Start download for a single item
  const startDownload = async (item: QueueItem) => {
    processingRef.current = true
    
    // Update status to downloading
    setQueue(prev => prev.map(q => 
      q.id === item.id ? { ...q, status: 'downloading' as const, progress: 5 } : q
    ))

    try {
      const result = await apiClient.download(
        item.url, 
        { downloadFiles: true },
        (progress: DownloadProgress) => {
          // Update progress in queue
          setQueue(prev => prev.map(q => 
            q.id === item.id ? { 
              ...q, 
              progress: Math.round(progress.progress || 0),
              title: progress.status || q.title,
              platform: progress.platform || q.platform
            } : q
          ))
        }
      )

      if (result.success) {
        setQueue(prev => prev.map(q => 
          q.id === item.id ? { 
            ...q, 
            status: 'completed' as const, 
            progress: 100,
            title: result.title || q.title
          } : q
        ))
        
        toast({
          title: '✅ Download Complete',
          description: result.title || item.url,
        })
        
        // Open folder option
        if (result.outputDir) {
          setTimeout(() => {
            apiClient.openFolder(result.outputDir!)
          }, 500)
        }
      } else {
        throw new Error(result.error || 'Download failed')
      }
    } catch (error) {
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { 
          ...q, 
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Download failed'
        } : q
      ))
      
      toast({
        title: '❌ Download Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      processingRef.current = false
    }
  }

  // Parse URLs from text
  const parseUrls = useCallback((text: string) => {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi
    const matches = text.match(urlRegex) || []
    return [...new Set(matches)]
  }, [])

  // Handle text area submit
  const handleSubmitBatch = () => {
    const urls = parseUrls(batchText)
    if (urls.length > 0) {
      // Add to local queue for demo
      const newItems: QueueItem[] = urls.map((url, index) => ({
        id: `q_${Date.now()}_${index}`,
        url,
        status: 'pending' as const,
        progress: 0,
        speed: 0,
        quality: selectedQuality,
        priority: 0
      }))
      setQueue(prev => [...prev, ...newItems])
      setBatchText('')
      onAddUrls?.(urls, { quality: selectedQuality })
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const text = e.dataTransfer.getData('text')
    if (text) {
      const urls = parseUrls(text)
      if (urls.length > 0) {
        setBatchText(prev => prev + (prev ? '\n' : '') + urls.join('\n'))
      }
    }
    
    // Handle file drops (txt files)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'text/plain') {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          const urls = parseUrls(content)
          if (urls.length > 0) {
            setBatchText(prev => prev + (prev ? '\n' : '') + urls.join('\n'))
          }
        }
        reader.readAsText(file)
      }
    }
  }

  // Move item in queue
  const moveUp = (id: string) => {
    setQueue(prev => {
      const index = prev.findIndex(i => i.id === id)
      if (index > 0) {
        const newQueue = [...prev]
        ;[newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]]
        return newQueue
      }
      return prev
    })
  }

  const moveDown = (id: string) => {
    setQueue(prev => {
      const index = prev.findIndex(i => i.id === id)
      if (index > -1 && index < prev.length - 1) {
        const newQueue = [...prev]
        ;[newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]]
        return newQueue
      }
      return prev
    })
  }

  const moveToTop = (id: string) => {
    setQueue(prev => {
      const index = prev.findIndex(i => i.id === id)
      if (index > 0) {
        const [item] = prev.splice(index, 1)
        return [item, ...prev.slice(0, index), ...prev.slice(index)]
      }
      return prev
    })
  }

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(i => i.id !== id))
  }

  const clearCompleted = () => {
    setQueue(prev => prev.filter(i => i.status !== 'completed'))
  }

  const retryFailed = () => {
    setQueue(prev => prev.map(i => 
      i.status === 'failed' ? { ...i, status: 'pending' as const, error: undefined } : i
    ))
  }

  const urlCount = parseUrls(batchText).length

  return (
    <div className="space-y-4">
      {/* Batch Input Card */}
      <Card className="border-galion-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListPlus className="h-5 w-5 text-galion-500" />
                Batch Download
              </CardTitle>
              <CardDescription>
                Paste multiple URLs or drag-and-drop a text file
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQualityPanel(!showQualityPanel)}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                {QUALITY_OPTIONS.find(q => q.value === selectedQuality)?.label || 'Quality'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quality Selector */}
          <AnimatePresence>
            {showQualityPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="grid grid-cols-5 gap-2">
                  {QUALITY_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedQuality(option.value)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        selectedQuality === option.value
                          ? "border-galion-500 bg-galion-500/10"
                          : "border-muted hover:border-galion-500/50"
                      )}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-lg border-2 border-dashed transition-all",
              isDragging 
                ? "border-galion-500 bg-galion-500/10" 
                : "border-muted hover:border-galion-500/50"
            )}
          >
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`Paste URLs here (one per line)...\n\nExamples:\nhttps://youtube.com/watch?v=...\nhttps://instagram.com/p/...\nhttps://tiktok.com/@user/video/...\nhttps://twitter.com/user/status/...`}
              className="w-full h-40 p-4 bg-transparent resize-none focus:outline-none text-sm font-mono"
            />
            
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-galion-500/20 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-galion-500 animate-bounce" />
                  <span className="font-medium">Drop URLs or file here</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {urlCount > 0 && (
                <Badge variant="galion">
                  {urlCount} URL{urlCount !== 1 ? 's' : ''} detected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBatchText('')}
                disabled={!batchText}
              >
                Clear
              </Button>
              <Button
                variant="galion"
                onClick={handleSubmitBatch}
                disabled={urlCount === 0}
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                Add {urlCount > 0 ? urlCount : ''} to Queue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Status & Controls */}
      {queue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Download Queue
                <Badge variant="outline">{queue.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPaused ? onResume : onPause}
                  className="gap-2"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Done
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryFailed}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Failed
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {queue.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    item.status === 'completed' && "border-green-500/30 bg-green-500/5",
                    item.status === 'failed' && "border-red-500/30 bg-red-500/5",
                    item.status === 'downloading' && "border-galion-500/30 bg-galion-500/5"
                  )}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {item.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
                    {item.status === 'downloading' && <Loader2 className="h-5 w-5 text-galion-500 animate-spin" />}
                    {item.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {item.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>

                  {/* URL & Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.title || item.url}
                    </div>
                    {item.status === 'downloading' && (
                      <div className="mt-1">
                        <Progress value={item.progress} className="h-1" />
                      </div>
                    )}
                    {item.error && (
                      <div className="text-xs text-red-500 mt-1">{item.error}</div>
                    )}
                  </div>

                  {/* Quality Badge */}
                  <Badge variant="outline" className="text-xs">
                    {item.quality}
                  </Badge>

                  {/* Progress/Speed */}
                  {item.status === 'downloading' && (
                    <span className="text-sm font-mono text-galion-500 w-16 text-right">
                      {item.progress}%
                    </span>
                  )}

                  {/* Actions */}
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveToTop(item.id)}
                        title="Move to top"
                      >
                        <ArrowUpToLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveUp(item.id)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveDown(item.id)}
                        disabled={index === queue.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Concurrent Downloads Slider */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Concurrent Downloads</div>
            <div className="text-xs text-muted-foreground">
              Number of simultaneous downloads
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMaxConcurrent(Math.max(1, maxConcurrent - 1))}
            >
              -
            </Button>
            <span className="w-8 text-center font-mono font-bold">{maxConcurrent}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMaxConcurrent(Math.min(10, maxConcurrent + 1))}
            >
              +
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
