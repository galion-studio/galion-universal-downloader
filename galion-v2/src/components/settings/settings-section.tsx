import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Key, 
  FolderOpen, 
  Palette, 
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Github,
  Youtube,
  Send,
  Sparkles,
  Globe,
  Loader2,
  Mic,
  Download,
  AlertCircle,
  CheckCircle2,
  Camera,
  Music,
  Twitter
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface ApiKey {
  id: string
  platform: string
  name: string
  key: string
  status: 'valid' | 'invalid' | 'unchecked' | 'loading'
  icon: typeof Github
  description?: string
}

const initialApiKeys: ApiKey[] = [
  // AI & Models
  { id: '1', platform: 'civitai', name: 'CivitAI', key: '', status: 'unchecked', icon: Sparkles, description: 'For downloading AI models and checkpoints' },
  { id: '2', platform: 'huggingface', name: 'HuggingFace', key: '', status: 'unchecked', icon: Globe, description: 'For HuggingFace model downloads' },
  // Code
  { id: '3', platform: 'github', name: 'GitHub', key: '', status: 'unchecked', icon: Github, description: 'For private repos and higher rate limits' },
  // Video
  { id: '4', platform: 'youtube', name: 'YouTube', key: '', status: 'unchecked', icon: Youtube, description: 'Optional - most features work without' },
  // Social Media
  { id: '5', platform: 'instagram', name: 'Instagram', key: '', status: 'unchecked', icon: Camera, description: 'Session cookie for private content' },
  { id: '6', platform: 'tiktok', name: 'TikTok', key: '', status: 'unchecked', icon: Music, description: 'For advanced TikTok features' },
  { id: '7', platform: 'twitter', name: 'Twitter/X', key: '', status: 'unchecked', icon: Twitter, description: 'For Twitter API access' },
  // Messaging
  { id: '8', platform: 'telegram', name: 'Telegram', key: '', status: 'unchecked', icon: Send, description: 'Bot token for Telegram downloads' },
  // Transcription  
  { id: '9', platform: 'openai', name: 'OpenAI (Whisper)', key: '', status: 'unchecked', icon: Mic, description: 'For cloud transcription (optional)' },
  // RapidAPI (for various platforms)
  { id: '10', platform: 'rapidapi', name: 'RapidAPI', key: '', status: 'unchecked', icon: Globe, description: 'For platform-specific APIs' },
]

export function SettingsSection() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [downloadPath, setDownloadPath] = useState('./downloads')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [transcriptionStatus, setTranscriptionStatus] = useState<{
    backend: string | null
    backendInstalled: boolean
    ffmpegInstalled: boolean
    model: string
  } | null>(null)
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(true)
  const { toast } = useToast()

  // Load saved API keys on mount
  useEffect(() => {
    loadApiKeys()
    loadTranscriptionStatus()
  }, [])

  const loadApiKeys = async () => {
    try {
      const savedKeys = await apiClient.getApiKeys()
      if (savedKeys && typeof savedKeys === 'object') {
        setApiKeys(prev => prev.map(key => ({
          ...key,
          status: savedKeys[key.platform] ? 'valid' : 'unchecked'
        })))
      }
    } catch (error) {
      console.log('Failed to load API keys:', error)
    }
  }

  const loadTranscriptionStatus = async () => {
    setIsLoadingTranscription(true)
    try {
      const status = await apiClient.getTranscriptionStatus()
      setTranscriptionStatus({
        backend: status.backend,
        backendInstalled: status.backendInstalled,
        ffmpegInstalled: status.ffmpegInstalled,
        model: status.currentModel
      })
    } catch (error) {
      console.log('Failed to load transcription status:', error)
    }
    setIsLoadingTranscription(false)
  }

  const updateApiKey = (id: string, key: string) => {
    setApiKeys(prev => prev.map(k => 
      k.id === id ? { ...k, key, status: 'unchecked' } : k
    ))
  }

  const saveApiKey = async (id: string) => {
    const keyData = apiKeys.find(k => k.id === id)
    if (!keyData || !keyData.key) return

    setApiKeys(prev => prev.map(k => 
      k.id === id ? { ...k, status: 'loading' } : k
    ))

    try {
      const result = await apiClient.saveApiKey(keyData.platform, keyData.key)
      
      if (result.success) {
        setApiKeys(prev => prev.map(k => 
          k.id === id ? { ...k, status: 'valid' } : k
        ))
        toast({
          title: 'API Key Saved',
          description: `${keyData.name} API key saved successfully`,
        })
      } else {
        setApiKeys(prev => prev.map(k => 
          k.id === id ? { ...k, status: 'invalid' } : k
        ))
        toast({
          title: 'Error Saving Key',
          description: result.error || 'Could not save API key',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setApiKeys(prev => prev.map(k => 
        k.id === id ? { ...k, status: 'unchecked' } : k
      ))
    }
  }

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const saveAllSettings = async () => {
    let savedCount = 0
    for (const key of apiKeys) {
      if (key.key && key.status !== 'valid') {
        await saveApiKey(key.id)
        savedCount++
      }
    }
    
    toast({
      title: 'Settings Saved',
      description: savedCount > 0 
        ? `Saved ${savedCount} API key(s)` 
        : 'All settings have been saved',
    })
  }

  const initTranscription = async () => {
    setIsLoadingTranscription(true)
    try {
      await apiClient.initTranscription()
      await loadTranscriptionStatus()
      toast({
        title: 'Transcription Ready',
        description: 'Whisper transcription service initialized',
      })
    } catch (error) {
      toast({
        title: 'Initialization Error',
        description: 'Could not initialize transcription service',
        variant: 'destructive',
      })
    }
    setIsLoadingTranscription(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-galion-500" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your API keys, download preferences, and more
        </p>
      </motion.div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="transcription" className="gap-2">
            <Mic className="h-4 w-4" />
            Transcription
          </TabsTrigger>
          <TabsTrigger value="downloads" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Downloads
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Configure your API keys for different platforms. Keys are stored locally and encrypted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.map((apiKey, index) => (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <apiKey.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{apiKey.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {apiKey.description}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        apiKey.status === 'valid' ? 'success' : 
                        apiKey.status === 'invalid' ? 'destructive' : 
                        apiKey.status === 'loading' ? 'galion' :
                        'outline'
                      }
                    >
                      {apiKey.status === 'loading' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {apiKey.status === 'valid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {apiKey.status === 'invalid' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {apiKey.status === 'loading' ? 'Checking...' : apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys[apiKey.id] ? 'text' : 'password'}
                        placeholder={`Enter your ${apiKey.name} API key...`}
                        value={apiKey.key}
                        onChange={(e) => updateApiKey(apiKey.id, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => toggleShowKey(apiKey.id)}
                      >
                        {showKeys[apiKey.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => saveApiKey(apiKey.id)}
                      disabled={!apiKey.key || apiKey.status === 'loading'}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </motion.div>
              ))}

              <div className="flex justify-end pt-4">
                <Button variant="galion" onClick={saveAllSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transcription Tab */}
        <TabsContent value="transcription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Transcription (Faster-Whisper)
              </CardTitle>
              <CardDescription>
                Automatic video/audio transcription using faster-whisper with tiny.en model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">System Status</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadTranscriptionStatus}
                    disabled={isLoadingTranscription}
                  >
                    {isLoadingTranscription ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Refresh</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {transcriptionStatus?.backendInstalled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">Whisper</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {transcriptionStatus?.backend || 'Not installed'}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {transcriptionStatus?.ffmpegInstalled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">FFmpeg</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {transcriptionStatus?.ffmpegInstalled ? 'Installed' : 'Required'}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="h-4 w-4 text-galion-500" />
                      <span className="text-sm font-medium">Model</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {transcriptionStatus?.model || 'tiny.en'}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-4 w-4 text-galion-500" />
                      <span className="text-sm font-medium">Language</span>
                    </div>
                    <span className="text-xs text-muted-foreground">English</span>
                  </div>
                </div>
              </div>

              {/* Installation */}
              {!transcriptionStatus?.backendInstalled && (
                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                  <h4 className="font-medium text-yellow-500 mb-2">Installation Required</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Install faster-whisper for automatic transcription:
                  </p>
                  <code className="block p-3 bg-background rounded text-sm font-mono">
                    pip install faster-whisper
                  </code>
                  <p className="text-xs text-muted-foreground mt-3">
                    After installation, click "Initialize" to set up the transcription service.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="galion" 
                  onClick={initTranscription}
                  disabled={isLoadingTranscription}
                >
                  {isLoadingTranscription ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4 mr-2" />
                  )}
                  Initialize Transcription
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Model
                </Button>
              </div>

              <Separator />

              {/* Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Transcription Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Auto-transcribe downloaded videos</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Generate SRT subtitles</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Generate VTT subtitles</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Generate plain text transcript</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Downloads Tab */}
        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Download Settings
              </CardTitle>
              <CardDescription>
                Configure where and how files are downloaded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Download Directory</label>
                <div className="flex gap-2">
                  <Input
                    value={downloadPath}
                    onChange={(e) => setDownloadPath(e.target.value)}
                    placeholder="./downloads"
                  />
                  <Button variant="outline">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Files will be saved to this directory
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Download Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Create subdirectories by platform</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Keep original filenames</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Show notification on completion</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Auto-transcribe audio/video files</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="galion" onClick={saveAllSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of Galion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Theme</h4>
                <div className="grid grid-cols-3 gap-4">
                  <button className="p-4 rounded-lg border-2 border-galion-500 bg-zinc-900 text-center">
                    <div className="h-8 w-full rounded bg-zinc-800 mb-2" />
                    <span className="text-sm">Dark</span>
                  </button>
                  <button className="p-4 rounded-lg border border-muted bg-white text-center text-zinc-900">
                    <div className="h-8 w-full rounded bg-zinc-100 mb-2" />
                    <span className="text-sm">Light</span>
                  </button>
                  <button className="p-4 rounded-lg border border-muted bg-gradient-to-br from-zinc-900 to-white text-center">
                    <div className="h-8 w-full rounded bg-gradient-to-r from-zinc-800 to-zinc-200 mb-2" />
                    <span className="text-sm">System</span>
                  </button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Interface</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Show animations</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Compact mode</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
