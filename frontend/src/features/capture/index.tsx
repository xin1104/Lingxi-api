// 请求捕获页面

import React, { useEffect, useState } from 'react'
import { Button, EmptyState } from '@/shared/ui'
import { Trash2, RefreshCw } from 'lucide-react'
import { cn, formatTime, formatDuration, getStatusColor, getMethodColor } from '@/shared/utils'
import * as api from '@/shared/api'
import { CaptureRecord } from '@/shared/types'

export function CapturePage() {
  const [records, setRecords] = useState<CaptureRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<CaptureRecord | null>(null)

  const loadRecords = async () => {
    const result = await api.getCaptureRecords()
    if (result.success) {
      setRecords(result.data)
    }
  }

  useEffect(() => {
    loadRecords()
    const interval = setInterval(loadRecords, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleClear = async () => {
    await api.clearCaptureRecords()
    setRecords([])
    setSelectedRecord(null)
  }

  return (
    <div className="flex h-full">
      {/* 左侧列表 */}
      <div className="flex-1 flex flex-col border-r border-dark-border">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-dark-text">请求捕获</h2>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={loadRecords}>
                <RefreshCw size={14} className="mr-1" />
                刷新
              </Button>
              <Button variant="danger" onClick={handleClear}>
                <Trash2 size={14} className="mr-1" />
                清空
              </Button>
            </div>
          </div>
          <p className="text-sm text-dark-text-secondary mt-1">
            捕获本软件发出的所有请求
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {records.length === 0 ? (
            <EmptyState message="暂无捕获记录" />
          ) : (
            <div className="divide-y divide-dark-border">
              {records.map((record) => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer',
                    selectedRecord?.id === record.id
                      ? 'bg-dark-card'
                      : 'hover:bg-dark-card/50'
                  )}
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
                    {record.status_code || '-'}
                  </span>
                  <span className="text-xs text-dark-text-secondary">
                    {record.duration ? formatDuration(record.duration) : '-'}
                  </span>
                  <span className="text-xs text-dark-text-secondary">
                    {formatTime(record.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧详情 */}
      <div className="w-96 flex flex-col">
        {selectedRecord ? (
          <>
            <div className="p-4 border-b border-dark-border">
              <h3 className="text-sm font-medium text-dark-text">请求详情</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="text-xs text-dark-text-secondary mb-1">请求</h4>
                <div className="bg-dark-bg border border-dark-border rounded p-3">
                  <p className="font-mono text-sm text-dark-text">
                    <span className={getMethodColor(selectedRecord.method)}>
                      {selectedRecord.method}
                    </span>{' '}
                    {selectedRecord.url}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs text-dark-text-secondary mb-1">请求头</h4>
                <div className="bg-dark-bg border border-dark-border rounded p-3 max-h-40 overflow-y-auto">
                  {Object.entries(selectedRecord.request_headers || {}).map(([key, value]) => (
                    <div key={key} className="text-xs font-mono">
                      <span className="text-primary">{key}</span>: {value}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs text-dark-text-secondary mb-1">响应头</h4>
                <div className="bg-dark-bg border border-dark-border rounded p-3 max-h-40 overflow-y-auto">
                  {Object.entries(selectedRecord.response_headers || {}).map(([key, value]) => (
                    <div key={key} className="text-xs font-mono">
                      <span className="text-primary">{key}</span>: {value}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-dark-bg border border-dark-border rounded p-2 text-center">
                  <p className="text-xs text-dark-text-secondary">状态码</p>
                  <p className={cn('font-mono font-bold', getStatusColor(selectedRecord.status_code || 0))}>
                    {selectedRecord.status_code || '-'}
                  </p>
                </div>
                <div className="bg-dark-bg border border-dark-border rounded p-2 text-center">
                  <p className="text-xs text-dark-text-secondary">耗时</p>
                  <p className="font-mono text-dark-text">
                    {selectedRecord.duration ? formatDuration(selectedRecord.duration) : '-'}
                  </p>
                </div>
                <div className="bg-dark-bg border border-dark-border rounded p-2 text-center">
                  <p className="text-xs text-dark-text-secondary">时间</p>
                  <p className="text-xs text-dark-text">
                    {formatTime(selectedRecord.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState message="点击记录查看详情" />
        )}
      </div>
    </div>
  )
}
