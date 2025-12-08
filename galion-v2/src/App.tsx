import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { MainLayout } from '@/components/layout/main-layout'
import { DownloadSection } from '@/components/download/download-section'
import { HistorySection } from '@/components/history/history-section'
import { SettingsSection } from '@/components/settings/settings-section'
import { CognitiveSection } from '@/components/cognitive/cognitive-section'

type Tab = 'download' | 'history' | 'settings' | 'cognitive'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('download')

  const renderContent = () => {
    switch (activeTab) {
      case 'download':
        return <DownloadSection />
      case 'history':
        return <HistorySection />
      case 'settings':
        return <SettingsSection />
      case 'cognitive':
        return <CognitiveSection />
      default:
        return <DownloadSection />
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="galion-theme">
      <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </MainLayout>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
