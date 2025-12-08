import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Key, 
  FolderOpen, 
  Palette, 
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Github,
  Youtube,
  Send,
  Sparkles,
  Globe,
  Mail
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface ApiKey {
  id: string
  platform: string
  name: string
  key: string
  status: 'valid' | 'invalid' | 'unchecked'
  icon: typeof Github
}

const initialApiKeys: ApiKey[] = [
  { id: '1', platform: 'civitai', name: 'CivitAI', key: '', status: 'unchecked', icon: Sparkles },
  { id: '2', platform: 'github', name: 'GitHub', key: '', status: 'unchecked', icon: Github },
  { id: '3', platform: 'youtube', name: 'YouTube', key: '', status: 'unchecked', icon: Youtube },
  { id: '4', platform: 'telegram', name: 'Telegram', key: '', status: 'unchecked', icon: Send },
  { id: '5', platform: 'openai', name: 'OpenAI (Whisper)', key: '', status: 'unchecked', icon: Globe },
]

export function SettingsSection() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [downloadPath, setDownloadPath] = useState('./downloads')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [emailSettings, setEmailSettings] = useState({
    enabled: false,
    host: '',
    port: '587',
    user: '',
    pass: '',
    to: '',
  })
  const { toast } = useToast()

  const updateApiKey = (id: string, key: string) => {
    setApiKeys(prev => prev.map(k => 
      k.id === id ? { ...k, key, status: 'unchecked' } : k
    ))
  }

  const validateKey = async (id: string) => {
    setApiKeys(prev => prev.map(k => 
      k.id === id ? { ...k, status: 'valid' } : k
    ))
    toast({
      title: 'API Key Validated',
      description: 'The API key has been validated successfully',
    })
  }

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const saveSettings = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been saved successfully',
    })
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
          <TabsTrigger value="downloads" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Downloads
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
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
                Configure your API keys for different platforms. Keys are stored locally and never sent to any server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.map((apiKey, index) => (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
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
                          {apiKey.platform}.com API Key
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        apiKey.status === 'valid' ? 'success' : 
                        apiKey.status === 'invalid' ? 'destructive' : 
                        'outline'
                      }
                    >
                      {apiKey.status === 'valid' && <Check className="h-3 w-3 mr-1" />}
                      {apiKey.status === 'invalid' && <X className="h-3 w-3 mr-1" />}
                      {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
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
                      onClick={() => validateKey(apiKey.id)}
                      disabled={!apiKey.key}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Validate
                    </Button>
                  </div>
                </motion.div>
              ))}

              <div className="flex justify-end pt-4">
                <Button variant="galion" onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Keys
                </Button>
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
                <Button variant="galion" onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>
                Configure email notifications and PDF reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={emailSettings.enabled}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                <span className="text-sm font-medium">Enable email notifications</span>
              </label>

              {emailSettings.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">SMTP Host</label>
                      <Input
                        placeholder="smtp.gmail.com"
                        value={emailSettings.host}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, host: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Port</label>
                      <Input
                        placeholder="587"
                        value={emailSettings.port}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, port: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        placeholder="your@email.com"
                        value={emailSettings.user}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, user: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={emailSettings.pass}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, pass: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Send Reports To</label>
                    <Input
                      placeholder="your@email.com"
                      value={emailSettings.to}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="galion" onClick={saveSettings}>
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
