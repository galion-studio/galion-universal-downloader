/**
 * Galion Universal Downloader - First Run Setup Wizard
 * Onboarding experience for new users
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, Settings, Check, ChevronRight, ChevronLeft,
  Youtube, Instagram, Twitter, Github, Music, Video, Sparkles,
  Moon, Sun, Palette
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

interface WizardProps {
  onComplete: () => void
}

interface UserPreferences {
  downloadPath: string
  theme: 'dark' | 'light' | 'system'
  accentColor: string
  selectedPlatforms: string[]
  quality: string
  autoTranscribe: boolean
  notifications: boolean
}

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, emoji: '▶️', color: '#FF0000' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, emoji: '📸', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: Music, emoji: '🎵', color: '#000000' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, emoji: '🐦', color: '#1DA1F2' },
  { id: 'github', name: 'GitHub', icon: Github, emoji: '🐙', color: '#181717' },
  { id: 'reddit', name: 'Reddit', icon: Video, emoji: '🔴', color: '#FF4500' },
  { id: 'soundcloud', name: 'SoundCloud', icon: Music, emoji: '🔊', color: '#FF5500' },
  { id: 'vimeo', name: 'Vimeo', icon: Video, emoji: '🎥', color: '#1AB7EA' },
]

const THEMES = [
  { id: 'dark', name: 'Dark', icon: Moon },
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'system', name: 'System', icon: Palette },
]

const ACCENT_COLORS = [
  { id: 'green', color: '#22C55E', name: 'Galion Green' },
  { id: 'purple', color: '#A855F7', name: 'Purple' },
  { id: 'pink', color: '#EC4899', name: 'Pink' },
  { id: 'blue', color: '#3B82F6', name: 'Blue' },
  { id: 'orange', color: '#F97316', name: 'Orange' },
]

export function FirstRunWizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(0)
  const [preferences, setPreferences] = useState<UserPreferences>({
    downloadPath: 'downloads',
    theme: 'dark',
    accentColor: 'green',
    selectedPlatforms: ['youtube', 'instagram', 'tiktok', 'twitter'],
    quality: 'best',
    autoTranscribe: false,
    notifications: true,
  })

  const totalSteps = 4

  const nextStep = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleComplete = async () => {
    // Save preferences to localStorage and backend
    localStorage.setItem('galion-preferences', JSON.stringify(preferences))
    localStorage.setItem('galion-onboarding-complete', 'true')
    
    // Apply theme
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark')
    
    onComplete()
  }

  const togglePlatform = (platformId: string) => {
    setPreferences(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId)
        ? prev.selectedPlatforms.filter(p => p !== platformId)
        : [...prev.selectedPlatforms, platformId]
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-4"
      >
        <Card className="overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
          {/* Progress bar */}
          <div className="h-1 bg-zinc-800">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome */}
              {step === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <div className="mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-4xl mb-4"
                    >
                      ⬇️
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Welcome to Galion
                    </h1>
                    <p className="text-zinc-400 text-lg">
                      The ultimate universal media downloader
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-zinc-800/50">
                      <Download className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-zinc-300">1500+ Sites</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/50">
                      <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm text-zinc-300">AI-Powered</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/50">
                      <Settings className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-zinc-300">Customizable</p>
                    </div>
                  </div>

                  <p className="text-zinc-500 text-sm">
                    Let's set up Galion in just 2 minutes
                  </p>
                </motion.div>
              )}

              {/* Step 1: Select Platforms */}
              {step === 1 && (
                <motion.div
                  key="platforms"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Select Your Platforms
                  </h2>
                  <p className="text-zinc-400 mb-6">
                    Choose the platforms you download from most often
                  </p>

                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {PLATFORMS.map((platform) => (
                      <motion.button
                        key={platform.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => togglePlatform(platform.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          preferences.selectedPlatforms.includes(platform.id)
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        {preferences.selectedPlatforms.includes(platform.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                        <span className="text-2xl block mb-1">{platform.emoji}</span>
                        <span className="text-xs text-zinc-400">{platform.name}</span>
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-zinc-500 text-sm text-center">
                    Don't worry, you can download from any site regardless of selection
                  </p>
                </motion.div>
              )}

              {/* Step 2: Appearance */}
              {step === 2 && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Customize Appearance
                  </h2>
                  <p className="text-zinc-400 mb-6">
                    Make Galion feel like home
                  </p>

                  <div className="space-y-6">
                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-3">
                        Theme
                      </label>
                      <div className="flex gap-3">
                        {THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setPreferences(prev => ({ ...prev, theme: theme.id as any }))}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                              preferences.theme === theme.id
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                          >
                            <theme.icon className="w-6 h-6 mx-auto mb-2 text-zinc-300" />
                            <span className="text-sm text-zinc-400">{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-3">
                        Accent Color
                      </label>
                      <div className="flex gap-3 justify-center">
                        {ACCENT_COLORS.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setPreferences(prev => ({ ...prev, accentColor: color.id }))}
                            className={`relative w-12 h-12 rounded-full transition-all ${
                              preferences.accentColor === color.id
                                ? 'ring-4 ring-white/30 scale-110'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color.color }}
                            title={color.name}
                          >
                            {preferences.accentColor === color.id && (
                              <Check className="w-6 h-6 text-white absolute inset-0 m-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Ready */}
              {step === 3 && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-6"
                  >
                    <Check className="w-10 h-10 text-white" />
                  </motion.div>

                  <h2 className="text-2xl font-bold text-white mb-2">
                    You're All Set!
                  </h2>
                  <p className="text-zinc-400 mb-6">
                    Galion is ready to download anything from anywhere
                  </p>

                  <div className="bg-zinc-800/50 rounded-xl p-6 mb-6 text-left">
                    <h3 className="font-semibold text-white mb-3">Quick Tips:</h3>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">•</span>
                        Paste any URL to start downloading
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">•</span>
                        Drag & drop multiple URLs for batch downloads
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">•</span>
                        Install the browser extension for one-click downloads
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">•</span>
                        Use keyboard shortcut Ctrl+V to paste and download
                      </li>
                    </ul>
                  </div>

                  <p className="text-zinc-500 text-sm">
                    Press "Get Started" to begin downloading
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-8 pb-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={step === 0}
              className="text-zinc-400"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === step ? 'bg-green-500 w-6' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {step === totalSteps - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default FirstRunWizard
