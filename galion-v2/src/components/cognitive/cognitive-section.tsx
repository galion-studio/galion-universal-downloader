import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Search, 
  Network, 
  TrendingUp, 
  Lightbulb,
  Sparkles,
  Zap,
  Activity,
  BarChart3,
  Clock,
  Target,
  Star,
  Mic,
  FileAudio,
  Upload,
  Loader2,
  CheckCircle2,
  Languages,
  Settings2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Insight {
  id: string
  type: 'suggestion' | 'pattern' | 'trend'
  title: string
  description: string
  confidence: number
  icon: typeof Lightbulb
}

interface KnowledgeNode {
  id: string
  label: string
  type: 'platform' | 'category' | 'file'
  x: number
  y: number
  connections: string[]
}

const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'suggestion',
    title: 'Configure CivitAI API Key',
    description: 'Based on your download patterns, adding a CivitAI API key would enable faster downloads.',
    confidence: 92,
    icon: Lightbulb,
  },
  {
    id: '2',
    type: 'pattern',
    title: 'Peak Download Times',
    description: 'You typically download most files between 8PM-10PM. Consider scheduling large downloads.',
    confidence: 87,
    icon: Clock,
  },
  {
    id: '3',
    type: 'trend',
    title: 'AI Models Trending',
    description: 'Your recent downloads show increased interest in SDXL models.',
    confidence: 78,
    icon: TrendingUp,
  },
]

const mockNodes: KnowledgeNode[] = [
  { id: '1', label: 'CivitAI', type: 'platform', x: 200, y: 150, connections: ['2', '3', '4'] },
  { id: '2', label: 'SDXL Models', type: 'category', x: 350, y: 80, connections: ['5', '6'] },
  { id: '3', label: 'Checkpoints', type: 'category', x: 350, y: 150, connections: ['7'] },
  { id: '4', label: 'LoRAs', type: 'category', x: 350, y: 220, connections: ['8'] },
  { id: '5', label: 'model_v1.safetensors', type: 'file', x: 500, y: 50, connections: [] },
  { id: '6', label: 'model_v2.safetensors', type: 'file', x: 500, y: 100, connections: [] },
  { id: '7', label: 'realistic.ckpt', type: 'file', x: 500, y: 150, connections: [] },
  { id: '8', label: 'style_lora.safetensors', type: 'file', x: 500, y: 220, connections: [] },
]

const mockStats = {
  totalAnalyzed: 47,
  patterns: 12,
  connections: 156,
  learningRate: 78,
}

export function CognitiveSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [transcriptionStatus, setTranscriptionStatus] = useState<{
    isTranscribing: boolean;
    progress: number;
    status: string;
    selectedFile: string | null;
    result: unknown | null;
  }>({
    isTranscribing: false,
    progress: 0,
    status: '',
    selectedFile: null,
    result: null
  })

  const handleSemanticSearch = () => {
    // Semantic search implementation
    console.log('Searching:', searchQuery)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // In a real implementation, we'd upload the file and get a server path
    // For now, show the selected file info
    setTranscriptionStatus(prev => ({
      ...prev,
      selectedFile: file.name,
      status: `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    }))
  }

  const startTranscription = async () => {
    if (!transcriptionStatus.selectedFile) return
    
    setTranscriptionStatus(prev => ({
      ...prev,
      isTranscribing: true,
      progress: 0,
      status: 'Initializing transcription...'
    }))

    // Simulate transcription progress
    // In production, this would call apiClient.transcribe()
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 500))
      setTranscriptionStatus(prev => ({
        ...prev,
        progress: i,
        status: i < 30 ? 'Extracting audio...' : i < 70 ? 'Transcribing with Whisper...' : 'Generating subtitles...'
      }))
    }

    setTranscriptionStatus(prev => ({
      ...prev,
      isTranscribing: false,
      progress: 100,
      status: '✅ Transcription complete!',
      result: { outputFiles: ['video.srt', 'video.vtt', 'video.txt'] }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Brain className="h-8 w-8 text-galion-500" />
          Cognitive Intelligence
        </h1>
        <p className="text-muted-foreground">
          AI-powered insights, semantic search, and knowledge graph visualization
        </p>
      </motion.div>

      {/* Semantic Search */}
      <Card className="border-galion-500/20 bg-gradient-to-br from-background to-galion-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-galion-500" />
            Semantic Search
          </CardTitle>
          <CardDescription>
            Search your downloads by meaning, not just keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-galion-500" />
              <Input
                placeholder="Search by meaning... (e.g., 'anime style models', 'high resolution textures')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                className="pl-10 h-12"
              />
            </div>
            <Button variant="galion" size="lg" onClick={handleSemanticSearch}>
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-galion-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-galion-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{mockStats.totalAnalyzed}</div>
              <div className="text-xs text-muted-foreground">Items Analyzed</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-galion-500/10 rounded-lg">
              <Target className="h-5 w-5 text-galion-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{mockStats.patterns}</div>
              <div className="text-xs text-muted-foreground">Patterns Found</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-galion-500/10 rounded-lg">
              <Network className="h-5 w-5 text-galion-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{mockStats.connections}</div>
              <div className="text-xs text-muted-foreground">Connections</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-galion-500/10 rounded-lg">
              <Zap className="h-5 w-5 text-galion-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{mockStats.learningRate}%</div>
              <div className="text-xs text-muted-foreground">Learning Rate</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Knowledge Graph
            </CardTitle>
            <CardDescription>
              Visual representation of content connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] bg-muted/50 rounded-lg overflow-hidden">
              <svg className="w-full h-full">
                {/* Connections */}
                {mockNodes.map((node) =>
                  node.connections.map((targetId) => {
                    const target = mockNodes.find((n) => n.id === targetId)
                    if (!target) return null
                    return (
                      <motion.line
                        key={`${node.id}-${targetId}`}
                        x1={node.x}
                        y1={node.y}
                        x2={target.x}
                        y2={target.y}
                        className={cn(
                          "stroke-galion-500/30 stroke-1",
                          (hoveredNode === node.id || hoveredNode === targetId) &&
                            "stroke-galion-500 stroke-2"
                        )}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    )
                  })
                )}
              </svg>

              {/* Nodes */}
              {mockNodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all",
                    node.type === 'platform' && "z-10"
                  )}
                  style={{ left: node.x, top: node.y }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      node.type === 'platform' &&
                        "bg-galion-500 text-white shadow-lg shadow-galion-500/25",
                      node.type === 'category' &&
                        "bg-secondary text-secondary-foreground",
                      node.type === 'file' &&
                        "bg-muted text-muted-foreground",
                      hoveredNode === node.id && "scale-110"
                    )}
                  >
                    {node.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border bg-card space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-galion-500/10 rounded-lg mt-0.5">
                      <insight.icon className="h-4 w-4 text-galion-500" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{insight.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {insight.description}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      insight.confidence >= 90
                        ? 'success'
                        : insight.confidence >= 80
                        ? 'galion'
                        : 'secondary'
                    }
                  >
                    {insight.confidence}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={insight.confidence} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">
                    Confidence
                  </span>
                </div>
              </motion.div>
            ))}

            <Button variant="outline" className="w-full mt-4">
              <Star className="h-4 w-4 mr-2" />
              View All Insights
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Video/Audio Transcription */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-purple-500" />
                🎙️ Video/Audio Transcription
                <Badge variant="outline" className="ml-2 text-purple-400 border-purple-400/30">
                  Faster Whisper
                </Badge>
              </CardTitle>
              <CardDescription>
                Automatic transcription using faster-whisper (tiny.en model - fast & efficient)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Zone */}
          <label className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer bg-purple-500/5 block">
            <input 
              type="file" 
              className="hidden" 
              accept="video/*,audio/*,.mp4,.mkv,.avi,.mov,.mp3,.wav,.flac,.ogg,.m4a"
              onChange={handleFileSelect}
              disabled={transcriptionStatus.isTranscribing}
            />
            {transcriptionStatus.isTranscribing ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto text-purple-500 mb-3 animate-spin" />
                <p className="text-sm font-medium">{transcriptionStatus.status}</p>
                <Progress value={transcriptionStatus.progress} className="mt-4 h-2" />
                <p className="text-xs text-muted-foreground mt-2">{transcriptionStatus.progress}%</p>
              </>
            ) : transcriptionStatus.result ? (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="text-sm font-medium text-green-500">{transcriptionStatus.status}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Output: video.srt, video.vtt, video.txt
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 gap-2"
                  onClick={(e) => {
                    e.preventDefault()
                    setTranscriptionStatus(prev => ({ ...prev, selectedFile: null, result: null, status: '' }))
                  }}
                >
                  Transcribe Another
                </Button>
              </>
            ) : transcriptionStatus.selectedFile ? (
              <>
                <FileAudio className="h-12 w-12 mx-auto text-purple-500 mb-3" />
                <p className="text-sm font-medium">{transcriptionStatus.selectedFile}</p>
                <p className="text-xs text-muted-foreground mt-1">{transcriptionStatus.status}</p>
                <Button 
                  variant="galion" 
                  className="mt-4 gap-2 bg-purple-500 hover:bg-purple-600"
                  onClick={(e) => {
                    e.preventDefault()
                    startTranscription()
                  }}
                >
                  <Mic className="h-4 w-4" />
                  Start Transcription
                </Button>
              </>
            ) : (
              <>
                <FileAudio className="h-12 w-12 mx-auto text-purple-500/60 mb-3" />
                <p className="text-sm font-medium">Drop video or audio file here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: MP4, MKV, MOV, MP3, WAV, FLAC, and more
                </p>
                <Button variant="outline" className="mt-4 gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Browse Files
                  </span>
                </Button>
              </>
            )}
          </label>

          {/* Transcription Settings */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <Languages className="h-5 w-5 mx-auto text-purple-500 mb-1" />
              <div className="text-xs font-medium">Language</div>
              <div className="text-xs text-muted-foreground">Auto-detect</div>
            </div>
            <div className="text-center">
              <Zap className="h-5 w-5 mx-auto text-purple-500 mb-1" />
              <div className="text-xs font-medium">Model</div>
              <div className="text-xs text-muted-foreground">tiny.en (75MB)</div>
            </div>
            <div className="text-center">
              <FileAudio className="h-5 w-5 mx-auto text-purple-500 mb-1" />
              <div className="text-xs font-medium">Output</div>
              <div className="text-xs text-muted-foreground">SRT, VTT, TXT</div>
            </div>
          </div>

          {/* Available Models */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="galion" className="bg-purple-500/20 text-purple-400">tiny.en ✓</Badge>
            <Badge variant="outline">base.en</Badge>
            <Badge variant="outline">small.en</Badge>
            <Badge variant="outline">medium.en</Badge>
            <Badge variant="outline">large-v3</Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 First run will automatically download the tiny.en model (~75MB). GPU acceleration supported.
          </p>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
          <CardDescription>
            Your download patterns and preferences over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-end justify-around gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const height = Math.random() * 100 + 20
              return (
                <motion.div
                  key={day}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div
                    className="w-full bg-galion-500/80 rounded-t-lg hover:bg-galion-500 transition-colors cursor-pointer"
                    style={{ height: '100%' }}
                  />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
