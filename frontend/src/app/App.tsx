// 主应用组件

import React, { useEffect } from 'react'
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

export function App() {
  const {
    activeSidebar,
    loadCollections,
    loadEnvironments,
    loadHistory,
    loadMockRoutes,
    loadSettings,
    loadCurrentVariables,
  } = useAppStore()

  useEffect(() => {
    loadCollections()
    loadEnvironments()
    loadHistory()
    loadMockRoutes()
    loadSettings()
    loadCurrentVariables()
  }, [])

  const renderMainContent = () => {
    if (activeSidebar === 'collections') {
      return (
        <div className="flex flex-1 overflow-hidden">
          {/* 请求编辑区 */}
          <div className="flex-1 flex flex-col border-r border-dark-border min-w-0">
            <RequestEditor />
          </div>
          {/* 响应区 */}
          <div className="flex-1 flex flex-col min-w-0">
            <ResponseViewer />
          </div>
        </div>
      )
    }

    switch (activeSidebar) {
      case 'environments':
        return <EnvironmentsPage />
      case 'history':
        return <HistoryPage />
      case 'mock':
        return <MockPage />
      case 'import-export':
        return <ImportExportPage />
      case 'capture':
        return <CapturePage />
      case 'settings':
        return <SettingsPage />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-dark-bg text-dark-text">
      {/* 左侧边栏 */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderMainContent()}
      </main>
    </div>
  )
}
