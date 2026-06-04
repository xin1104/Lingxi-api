// 请求历史页面

import { useEffect, useState } from 'react'
import { useAppStore } from '@/shared/store'
import { Button, Input, EmptyState } from '@/shared/ui'
import { Trash2, Search, RotateCcw, Copy, Play, Check, X, ChevronDown } from 'lucide-react'
import { cn, formatTime, formatDuration, getStatusColor, getMethodColor, copyToClipboard } from '@/shared/utils'
import * as api from '@/shared/api'

export function HistoryPage() {
  const { historyRecords, loadHistory, clearHistory, loadRequest } = useAppStore()

  const [keyword, setKeyword] = useState('')
  const [filterMethod, setFilterMethod] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailTab, setDetailTab] = useState<'request' | 'response'>('request')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => { loadHistory() }, [])

  const selected = historyRecords.find((r) => r.id === selectedId)
  const snapshot = selected?.request_snapshot

  const handleRestore = (record: any) => {
    loadRequest({
      id: 0, name: '历史请求', method: record.method, url: record.url,
      params: record.request_snapshot?.params || [],
      headers: record.request_snapshot?.headers || [],
      auth: record.request_snapshot?.auth || {},
      body_type: record.request_snapshot?.body_type || 'none',
      body: record.request_snapshot?.body || {},
      pre_script: record.request_snapshot?.pre_script || '',
      test_script: record.request_snapshot?.test_script || '',
      sort_order: 0, created_at: record.created_at, updated_at: record.created_at,
    })
  }

  const handleReplay = async (record: any) => {
    handleRestore(record)
    // 延迟一下让 store 更新，然后发送
    setTimeout(() => {
      useAppStore.getState().sendCurrentRequest()
    }, 100)
  }

  const handleCopyField = async (label: string, value: string) => {
    await copyToClipboard(value)
    setCopiedField(label)
    setTimeout(() => setCopiedField(null), 1500)
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

  const formatBodyPreview = (body: any, bodyType: string) => {
    if (!body) return ''
    if (bodyType === 'json' && body.json_data) return JSON.stringify(body.json_data, null, 2)
    if (body.raw) return body.raw
    return JSON.stringify(body)
  }

  return (
    <div className="flex h-full">
      {/* 左侧列表 */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-dark-border">
        <div className="p-4 border-b border-dark-border space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" />
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索 URL..." className="pl-9" />
            </div>
            <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-md text-sm text-dark-text">
              <option value="">所有方法</option>
              <option value="GET">GET</option><option value="POST">POST</option>
              <option value="PUT">PUT</option><option value="DELETE">DELETE</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-md text-sm text-dark-text">
              <option value="">所有状态</option>
              <option value="2xx">2xx 成功</option><option value="4xx">4xx 客户端错误</option>
              <option value="5xx">5xx 服务器错误</option><option value="error">请求失败</option>
            </select>
            <Button variant="danger" onClick={clearHistory}>清空历史</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRecords.length === 0 ? (
            <EmptyState message="暂无请求历史" />
          ) : (
            <div className="divide-y divide-dark-border">
              {filteredRecords.map((record) => (
                <div key={record.id}
                  className={cn('flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-card/50',
                    selectedId === record.id && 'bg-dark-card border-l-2 border-l-primary')}
                  onClick={() => setSelectedId(record.id)}>
                  <span className={cn('font-mono font-bold text-xs w-14', getMethodColor(record.method))}>{record.method}</span>
                  <span className="flex-1 text-sm text-dark-text truncate font-mono">{record.url}</span>
                  <span className={cn('font-mono text-xs w-10', record.status_code ? getStatusColor(record.status_code) : 'text-error')}>
                    {record.status_code || 'ERR'}
                  </span>
                  <span className="text-xs text-dark-text-secondary w-16">{record.duration ? formatDuration(record.duration) : '-'}</span>
                  <span className="text-xs text-dark-text-secondary w-20">{formatTime(record.created_at)}</span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleReplay(record)} className="p-1 hover:bg-dark-border rounded" title="重放请求">
                      <Play size={14} className="text-success" />
                    </button>
                    <button onClick={() => handleRestore(record)} className="p-1 hover:bg-dark-border rounded" title="恢复到工作台">
                      <RotateCcw size={14} className="text-dark-text-secondary" />
                    </button>
                    <button onClick={async () => { await api.deleteHistoryRecord(record.id); loadHistory(); setSelectedId(null) }}
                      className="p-1 hover:bg-dark-border rounded" title="删除">
                      <Trash2 size={14} className="text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧详情 */}
      <div className="w-96 flex flex-col bg-dark-panel">
        {selected ? (
          <>
            <div className="p-4 border-b border-dark-border">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('font-mono font-bold text-sm', getMethodColor(selected.method))}>{selected.method}</span>
                <span className={cn('font-mono text-sm font-bold', selected.status_code ? getStatusColor(selected.status_code) : 'text-error')}>
                  {selected.status_code || 'ERR'}
                </span>
                <span className="text-xs text-dark-text-secondary">{selected.duration ? formatDuration(selected.duration) : ''}</span>
              </div>
              <p className="text-xs text-dark-text font-mono break-all">{selected.url}</p>
              {selected.error_message && <p className="text-xs text-error mt-1">{selected.error_message}</p>}
              <div className="flex gap-1 mt-3">
                <Button size="sm" variant="secondary" onClick={() => handleReplay(selected)}>
                  <Play size={12} className="mr-1" />重放
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleRestore(selected)}>
                  <RotateCcw size={12} className="mr-1" />恢复
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { handleCopyField('URL', selected.url) }}>
                  {copiedField === 'URL' ? <Check size={12} /> : <Copy size={12} />}
                </Button>
              </div>
            </div>

            {/* 详情标签 */}
            <div className="flex border-b border-dark-border">
              <button onClick={() => setDetailTab('request')}
                className={cn('flex-1 py-2 text-xs font-medium', detailTab === 'request' ? 'text-primary border-b border-primary' : 'text-dark-text-secondary')}>
                请求
              </button>
              <button onClick={() => setDetailTab('response')}
                className={cn('flex-1 py-2 text-xs font-medium', detailTab === 'response' ? 'text-primary border-b border-primary' : 'text-dark-text-secondary')}>
                响应
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {detailTab === 'request' && snapshot && (
                <>
                  {snapshot.params?.length > 0 && (
                    <div>
                      <h4 className="text-xs text-dark-text-secondary font-medium mb-1">参数</h4>
                      <div className="bg-dark-bg rounded p-2 max-h-20 overflow-y-auto">
                        {snapshot.params.map((p: any, i: number) => (
                          <div key={i} className="text-xs font-mono"><span className="text-primary">{p.key}</span>: {p.value}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.headers?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs text-dark-text-secondary font-medium">请求头</h4>
                        <button onClick={() => handleCopyField('headers', JSON.stringify(snapshot.headers))} className="p-0.5 hover:bg-dark-border rounded">
                          {copiedField === 'headers' ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-dark-text-secondary" />}
                        </button>
                      </div>
                      <div className="bg-dark-bg rounded p-2 max-h-32 overflow-y-auto">
                        {snapshot.headers.map((h: any, i: number) => (
                          <div key={i} className="text-xs font-mono"><span className="text-primary">{h.key}</span>: {h.value}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.body && snapshot.body_type !== 'none' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs text-dark-text-secondary font-medium">请求体 ({snapshot.body_type})</h4>
                        <button onClick={() => handleCopyField('body', formatBodyPreview(snapshot.body, snapshot.body_type))} className="p-0.5 hover:bg-dark-border rounded">
                          {copiedField === 'body' ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-dark-text-secondary" />}
                        </button>
                      </div>
                      <pre className="bg-dark-bg rounded p-2 max-h-40 overflow-y-auto text-xs font-mono whitespace-pre-wrap text-dark-text">
                        {formatBodyPreview(snapshot.body, snapshot.body_type)}
                      </pre>
                    </div>
                  )}
                </>
              )}

              {detailTab === 'response' && (
                <>
                  <div>
                    <h4 className="text-xs text-dark-text-secondary font-medium mb-1">响应摘要</h4>
                    <div className="bg-dark-bg rounded p-2 max-h-40 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-dark-text">
                        {selected.response_summary || '无响应摘要'}
                      </pre>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-dark-bg rounded p-2"><span className="text-dark-text-secondary">大小</span><br />{selected.size ? `${(selected.size / 1024).toFixed(1)} KB` : '-'}</div>
                    <div className="bg-dark-bg rounded p-2"><span className="text-dark-text-secondary">时间</span><br />{formatTime(selected.created_at)}</div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <EmptyState message="点击记录查看详情" />
        )}
      </div>
    </div>
  )
}
