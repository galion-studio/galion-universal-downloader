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
  Star
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

  const handleSemanticSearch = () => {
    // Semantic search implementation
    console.log('Searching:', searchQuery)
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
