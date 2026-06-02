// 导入导出页面

import React, { useState } from 'react'
import { useAppStore } from '@/shared/store'
import { Button, Textarea, EmptyState } from '@/shared/ui'
import { Import, Download, Copy, FileJson } from 'lucide-react'
import * as api from '@/shared/api'
import { copyToClipboard } from '@/shared/utils'

export function ImportExportPage() {
  const { loadRequest, loadCollections } = useAppStore()

  const [curlInput, setCurlInput] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<string | null>(null)

  // cURL 导入
  const handleImportCurl = async () => {
    if (!curlInput.trim()) return
    const result = await api.importCurl(curlInput.trim())
    if (result.success) {
      loadRequest(result.data)
      setImportResult('导入成功，已加载到请求编辑器')
    } else {
      setImportResult(`导入失败: ${result.message}`)
    }
  }

  // 导出当前请求为 cURL
  const handleExportCurl = async () => {
    const { currentRequest } = useAppStore.getState()
    const result = await api.exportCurl(currentRequest)
    if (result.success) {
      setExportResult(result.data)
    }
  }

  // 导出备份
  const handleExportBackup = async () => {
    const result = await api.exportBackup()
    if (result.success) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lingxi-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // 复制到剪贴板
  const handleCopy = async (text: string) => {
    await copyToClipboard(text)
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
      {/* cURL 导入 */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <h2 className="text-lg font-medium text-dark-text mb-2 flex items-center gap-2">
          <Import size={18} />
          cURL 导入
        </h2>
        <p className="text-sm text-dark-text-secondary mb-4">
          粘贴 cURL 命令，自动解析为请求配置
        </p>
        <Textarea
          value={curlInput}
          onChange={(e) => setCurlInput(e.target.value)}
          placeholder='curl -X POST https://api.example.com/data -H "Content-Type: application/json" -d {"key": "value"}'
          className="h-32 font-mono"
        />
        <div className="flex gap-2 mt-2">
          <Button onClick={handleImportCurl}>导入</Button>
          {importResult && (
            <span className="text-sm text-dark-text-secondary self-center">{importResult}</span>
          )}
        </div>
      </div>

      {/* cURL 导出 */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <h2 className="text-lg font-medium text-dark-text mb-2 flex items-center gap-2">
          <Download size={18} />
          cURL 导出
        </h2>
        <p className="text-sm text-dark-text-secondary mb-4">
          将当前请求导出为 cURL 命令
        </p>
        <Button onClick={handleExportCurl}>生成 cURL</Button>
        {exportResult && (
          <div className="mt-4 relative">
            <pre className="p-4 bg-dark-bg border border-dark-border rounded-lg text-sm font-mono text-dark-text overflow-x-auto">
              {exportResult}
            </pre>
            <button
              onClick={() => handleCopy(exportResult)}
              className="absolute top-2 right-2 p-2 hover:bg-dark-card rounded"
            >
              <Copy size={14} className="text-dark-text-secondary" />
            </button>
          </div>
        )}
      </div>

      {/* 备份导出 */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <h2 className="text-lg font-medium text-dark-text mb-2 flex items-center gap-2">
          <FileJson size={18} />
          数据备份
        </h2>
        <p className="text-sm text-dark-text-secondary mb-4">
          导出所有本地数据（集合、环境、变量）为 JSON 备份文件
        </p>
        <Button onClick={handleExportBackup}>导出备份</Button>
      </div>
    </div>
  )
}
