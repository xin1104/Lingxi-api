// 响应查看器

import React, { useState } from 'react'
import { useAppStore } from '@/shared/store'
import { cn, formatSize, formatDuration, getStatusColor, formatJson, copyToClipboard } from '@/shared/utils'
import { Tabs, EmptyState } from '@/shared/ui'
import { Copy, Download, Check } from 'lucide-react'

export function ResponseViewer() {
  const { response, isLoading } = useAppStore()
  const [activeTab, setActiveTab] = useState('body')
  const [copied, setCopied] = useState(false)

  const tabs = [
    { key: 'body', label: '响应体' },
    { key: 'headers', label: '响应头' },
    { key: 'cookies', label: 'Cookies' },
  ]

  const handleCopy = async () => {
    if (response?.body) {
      await copyToClipboard(response.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 格式化响应体
  const getFormattedBody = () => {
    if (!response?.body) return ''
    try {
      const parsed = JSON.parse(response.body)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return response.body
    }
  }

  // 检测是否为 JSON
  const isJson = () => {
    if (!response?.body) return false
    try {
      JSON.parse(response.body)
      return true
    } catch {
      return false
    }
  }

  // 检测是否为图片
  const isImage = () => {
    return response?.content_type?.startsWith('image/')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-dark-text-secondary">发送请求中...</p>
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <EmptyState
        message="发送请求后查看响应"
        icon={
          <svg className="w-12 h-12 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
    )
  }

  if (response.error) {
    return (
      <div className="p-4">
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <h3 className="text-error font-medium mb-2">请求失败</h3>
          <p className="text-sm text-dark-text">{response.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 状态栏 */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-dark-border">
        <span className={cn('font-mono font-bold', getStatusColor(response.status_code))}>
          {response.status_code}
        </span>
        <span className="text-sm text-dark-text-secondary">
          {formatDuration(response.duration)}
        </span>
        <span className="text-sm text-dark-text-secondary">
          {formatSize(response.body_size)}
        </span>
        <span className="text-sm text-dark-text-secondary">
          {response.content_type}
        </span>

        <div className="flex-1" />

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-dark-text-secondary hover:text-dark-text hover:bg-dark-card rounded"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>

      {/* 标签页 */}
      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {/* 内容 */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'body' && (
          <div className="p-4">
            {isImage() ? (
              <div className="flex items-center justify-center">
                <img
                  src={`data:${response.content_type};base64,${btoa(response.body)}`}
                  alt="响应图片"
                  className="max-w-full max-h-96"
                />
              </div>
            ) : (
              <pre
                className={cn(
                  'text-sm font-mono whitespace-pre-wrap break-words',
                  isJson() ? 'text-success' : 'text-dark-text'
                )}
              >
                {getFormattedBody()}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-2 text-dark-text-secondary font-medium">名称</th>
                  <th className="text-left py-2 text-dark-text-secondary font-medium">值</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers).map(([key, value]) => (
                  <tr key={key} className="border-b border-dark-border/50">
                    <td className="py-2 text-dark-text font-mono">{key}</td>
                    <td className="py-2 text-dark-text-secondary font-mono break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="p-4">
            <p className="text-sm text-dark-text-secondary text-center py-4">
              Cookies 信息暂未实现
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
