// 主应用组件

import { useEffect } from 'react'
import { useAppStore } from '@/shared/store'
import { Sidebar } from '@/features/request-workbench/Sidebar'
import { RequestEditor } from '@/features/request-workbench/RequestEditor'
import { ResponseViewer } from '@/features/request-workbench/ResponseViewer'
import { EnvironmentsPage } from '@/features/environments'
import { HistoryPage } from '@/features/history'
import { MockPage } from '@/features/mock'
import { ImportExportPage } from '@/features/import-export'
import { CapturePage } from '@/features/capture'
import { SettingsPage } from '@/features/settings'
import { ToastContainer } from '@/shared/ui/Toast'

function applyTheme(theme: string) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
    root.classList.toggle('light', !prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
  }
}

export function App() {
  const {
    activeSidebar,
    loadCollections,
    loadEnvironments,
    loadHistory,
    loadMockRoutes,
    loadSettings,
    loadCurrentVariables,
    settings,
  } = useAppStore()

  useEffect(() => {
    loadCollections()
    loadEnvironments()
    loadHistory()
    loadMockRoutes()
    loadSettings()
    loadCurrentVariables()
  }, [])

  // 主题应用
  useEffect(() => {
    const theme = settings?.theme || 'dark'
    applyTheme(theme)

    // 跟随系统时监听变化
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings?.theme])

  const renderMainContent = () => {
    if (activeSidebar === 'collections') {
      return (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col border-r border-dark-border min-w-0">
            <RequestEditor />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <ResponseViewer />
          </div>
        </div>
      )
    }

    switch (activeSidebar) {
      case 'environments': return <EnvironmentsPage />
      case 'history': return <HistoryPage />
      case 'mock': return <MockPage />
      case 'import-export': return <ImportExportPage />
      case 'capture': return <CapturePage />
      case 'settings': return <SettingsPage />
      default: return null
    }
  }

  return (
    <div className="flex h-screen bg-dark-bg text-dark-text">
      <Sidebar className="w-64 flex-shrink-0" />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderMainContent()}
      </main>
      <ToastContainer />
    </div>
  )
}
