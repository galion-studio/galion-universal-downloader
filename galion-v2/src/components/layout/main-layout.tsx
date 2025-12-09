import { ReactNode } from 'react'
import { 
  Download, 
  History, 
  Settings, 
  Brain, 
  Moon, 
  Sun,
  Github,
  Anchor,
  Skull
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

type Tab = 'download' | 'history' | 'settings' | 'cognitive'

interface MainLayoutProps {
  children: ReactNode
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const navItems = [
  { id: 'download' as Tab, label: 'Plunder', icon: Download },
  { id: 'history' as Tab, label: 'Log', icon: History },
  { id: 'cognitive' as Tab, label: 'Navigator', icon: Brain },
  { id: 'settings' as Tab, label: 'Helm', icon: Settings },
]

// Galion Logo Component - Using the shield logo
function GalionLogo({ className }: { className?: string }) {
  // Use base URL for correct path with Vite
  const basePath = (import.meta as unknown as { env: { BASE_URL: string } }).env?.BASE_URL || '/'
  return (
    <img 
      src={`${basePath}favicon.svg`}
      alt="Galion Logo"
      className={cn("object-contain", className)}
    />
  )
}

export function MainLayout({ children, activeTab, onTabChange }: MainLayoutProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header - Clean & Minimal */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <GalionLogo className="h-9 w-9" />
              <span className="absolute -top-1 -right-1 text-xs">🏴‍☠️</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">Galion</span>
              <span className="text-[10px] text-muted-foreground -mt-1">The People's Downloader</span>
            </div>
          </div>
          
          {/* Navigation - Minimal */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'gap-2 px-4 h-9 rounded-full transition-all duration-200',
                  activeTab === item.id 
                    ? 'bg-galion-500/10 text-galion-500 font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{item.label}</span>
              </Button>
            ))}
          </nav>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* Main Content - Lots of White Space */}
      <main className="container max-w-5xl mx-auto px-6 py-16">
        {children}
      </main>

      {/* Footer - Pirate Style */}
      <footer className="border-t mt-auto bg-gradient-to-r from-background via-background to-background">
        <div className="container max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏴‍☠️</span>
              <span className="font-medium">Galion</span>
              <span className="text-xs bg-galion-500/10 text-galion-500 px-2 py-0.5 rounded-full">
                v2.0
              </span>
              <span className="text-xs opacity-60">• "Information Wants To Be Free"</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-xs">
                <Anchor className="h-3.5 w-3.5" /> 100% Open Source • No DRM • No Tracking
              </span>
              <a 
                href="https://github.com/galion-studio/galion-universal-downloader" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
