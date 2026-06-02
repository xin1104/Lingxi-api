// 请求历史页面

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/shared/store'
import { Button, Input, EmptyState } from '@/shared/ui'
import { Trash2, Search, RotateCcw } from 'lucide-react'
import { cn, formatTime, formatDuration, getStatusColor, getMethodColor } from '@/shared/utils'
import * as api from '@/shared/api'

export function HistoryPage() {
  const {
    historyRecords,
    loadHistory,
    clearHistory,
    loadRequest,
  } = useAppStore()

  const [keyword, setKeyword] = useState('')
  const [filterMethod, setFilterMethod] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    loadHistory()
  }, [])

  const handleRestore = (record: any) => {
    loadRequest({
      id: 0,
      name: '历史请求',
      method: record.method,
      url: record.url,
      params: record.request_snapshot?.params || [],
      headers: record.request_snapshot?.headers || [],
      auth: record.request_snapshot?.auth || {},
      body_type: record.request_snapshot?.body_type || 'none',
      body: record.request_snapshot?.body || {},
      pre_script: '',
      test_script: '',
      sort_order: 0,
      created_at: record.created_at,
      updated_at: record.created_at,
    })
  }

  const filteredRecords = historyRecords.filter((record) => {
    if (keyword && !record.url.includes(keyword)) return false
    if (filterMethod && record.method !== filterMethod) return false
    if (filterStatus) {
      const status = record.status_code || 0
      if (filterStatus === '2xx' && (status < 200 || status >= 300)) return false
      if (filterStatus === '4xx' && (status < 400 || status >= 500)) return false
      if (filterStatus === '5xx' && status < 500) return false
      if (filterStatus === 'error' && status !== 0) return false
    }
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和筛选 */}
      <div className="p-4 border-b border-dark-border space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索 URL..."
              className="pl-9"
            />
          </div>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-md text-sm text-dark-text"
          >
            <option value="">所有方法</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-md text-sm text-dark-text"
          >
            <option value="">所有状态</option>
            <option value="2xx">2xx 成功</option>
            <option value="4xx">4xx 客户端错误</option>
            <option value="5xx">5xx 服务器错误</option>
            <option value="error">请求失败</option>
          </select>
          <Button variant="danger" onClick={clearHistory}>
            清空历史
          </Button>
        </div>
      </div>

      {/* 历史列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <EmptyState message="暂无请求历史" />
        ) : (
          <div className="divide-y divide-dark-border">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-dark-card/50 cursor-pointer"
                onClick={() => handleRestore(record)}
              >
                <span
                  className={cn(
                    'font-mono font-bold text-xs w-16',
                    getMethodColor(record.method)
                  )}
                >
                  {record.method}
                </span>

                <span className="flex-1 text-sm text-dark-text truncate font-mono">
                  {record.url}
                </span>

                <span
                  className={cn(
                    'font-mono text-xs',
                    record.status_code ? getStatusColor(record.status_code) : 'text-error'
                  )}
                >
                  {record.status_code || 'ERR'}
                </span>

                <span className="text-xs text-dark-text-secondary">
                  {record.duration ? formatDuration(record.duration) : '-'}
                </span>

                <span className="text-xs text-dark-text-secondary">
                  {formatTime(record.created_at)}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // 恢复请求
                    handleRestore(record)
                  }}
                  className="p-1 hover:bg-dark-border rounded"
                  title="恢复请求"
                >
                  <RotateCcw size={14} className="text-dark-text-secondary" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
