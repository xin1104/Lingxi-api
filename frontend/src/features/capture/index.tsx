// 请求捕获 / HTTP 代理页面

import React, { useEffect, useState } from 'react'
import { Button, EmptyState, Tabs } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { useAppStore } from '@/shared/store'
import {
  Trash2, RefreshCw, Play, Square, Copy, RotateCcw, Send,
  AlertTriangle, Globe, Server, Filter, X, ChevronDown,
} from 'lucide-react'
import {
  cn, formatTime, formatDuration, getStatusColor, getMethodColor, copyToClipboard,
} from '@/shared/utils'
import * as api from '@/shared/api'
import { CaptureRecord, ProxyLog, ProxyLogFilter } from '@/shared/types'

const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'CONNECT']

export function CapturePage() {
  const [mode, setMode] = useState<'capture' | 'proxy'>('capture')

  // 捕获记录
  const [records, setRecords] = useState<CaptureRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<CaptureRecord | null>(null)

  // 代理状态
  const [proxyRunning, setProxyRunning] = useState(false)
  const [proxyAddress, setProxyAddress] = useState('http://127.0.0.1:8899')
  const [proxyPort, setProxyPort] = useState(8899)

  // 代理日志
  const [proxyLogs, setProxyLogs] = useState<ProxyLog[]>([])
  const [selectedLog, setSelectedLog] = useState<ProxyLog | null>(null)
  const [logTotal, setLogTotal] = useState(0)

  // 日志筛选
  const [showFilter, setShowFilter] = useState(false)
  const [filter, setFilter] = useState<ProxyLogFilter>({})

  const loadRecords = async () => {
    const result = await api.getCaptureRecords(200)
    if (result.success && result.data) {
      setRecords(result.data)
    }
  }

  const loadProxyStatus = async () => {
    const result = await api.getProxyStatus()
    if (result.success && result.data) {
      setProxyRunning(result.data.running)
      setProxyAddress(result.data.address)
      setProxyPort(result.data.port)
    }
  }

  const loadProxyLogs = async () => {
    const result = await api.getProxyLogs({
      limit: 200,
      ...filter,
    })
    if (result.success && result.data) {
      setProxyLogs(result.data.logs)
      setLogTotal(result.data.total)
    }
  }

  useEffect(() => {
    loadRecords()
    loadProxyStatus()
    const interval = setInterval(() => {
      loadRecords()
      loadProxyStatus()
      if (mode === 'proxy') loadProxyLogs()
    }, 5000)
    return () => clearInterval(interval)
  }, [mode, filter])

  const handleClear = async () => {
    await api.clearCaptureRecords()
    setRecords([])
    setSelectedRecord(null)
    toast.success('捕获记录已清空')
  }

  const handleStartProxy = async () => {
    const result = await api.startProxy()
    if (result.success) {
      setProxyRunning(true)
      if (result.data) setProxyAddress(result.data.address)
      toast.success('代理已启动')
      setMode('proxy')
    } else {
      toast.error(result.message || '代理启动失败')
    }
  }

  const handleStopProxy = async () => {
    const result = await api.stopProxy()
    if (result.success) {
      setProxyRunning(false)
      toast.success('代理已停止')
    } else {
      toast.error(result.message || '代理停止失败')
    }
  }

  const handleClearProxyLogs = async () => {
    const result = await api.clearProxyLogs()
    if (result.success) {
      setProxyLogs([])
      setSelectedLog(null)
      toast.success('代理日志已清空')
    }
  }

  const handleCopyProxyAddress = async () => {
    try {
      await copyToClipboard(proxyAddress)
      toast.success('代理地址已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleRestoreToWorkbench = (method: string, url: string) => {
    useAppStore.setState((s: any) => ({
      currentRequest: {
        ...s.currentRequest,
        method: method as any,
        url,
      },
    }))
    useAppStore.getState().setActiveSidebar('collections')
    toast.info('已恢复到工作台')
  }

  const handleReplayConfirm = (log: ProxyLog) => {
    // 构建请求快照进行重放
    const confirmed = window.confirm(
      '将使用当前保存的请求快照重新发送一次请求，是否继续？'
    )
    if (!confirmed) return

    // 检查敏感 Header
    const sensitiveHeaders = Object.keys(log.request_headers || {}).filter(
      (k) => k.toLowerCase() === 'authorization' || k.toLowerCase() === 'cookie'
    )
    if (sensitiveHeaders.length > 0) {
      const warnConfirm = window.confirm(
        `请求中包含敏感 Header: ${sensitiveHeaders.join(', ')}，重放时会携带这些信息，是否继续？`
      )
      if (!warnConfirm) return
    }

    toast.info('重放功能需通过工作台执行，正在恢复请求...')
    handleRestoreToWorkbench(log.method, log.url)
  }

  const handleRestoreProxyLog = (log: ProxyLog) => {
    handleRestoreToWorkbench(log.method, log.url)
  }

  // 清除筛选
  const clearFilter = () => {
    setFilter({})
    setShowFilter(false)
  }

  // 获取状态码区间标签
  const statusRangeLabel = (sc: number | undefined) => {
    if (!sc) return '失败'
    if (sc >= 200 && sc < 300) return '2xx'
    if (sc >= 300 && sc < 400) return '3xx'
    if (sc >= 400 && sc < 500) return '4xx'
    if (sc >= 500) return '5xx'
    return String(sc)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 页面头部 */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-dark-text">
              请求捕获 / HTTP 代理
            </h2>
            <div className="flex bg-dark-bg rounded-md border border-dark-border overflow-hidden">
              <button
                onClick={() => setMode('capture')}
                className={cn(
                  'px-3 py-1 text-xs font-medium transition-colors',
                  mode === 'capture'
                    ? 'bg-primary text-white'
                    : 'text-dark-text-secondary hover:text-dark-text'
                )}
              >
                本软件请求
              </button>
              <button
                onClick={() => { setMode('proxy'); loadProxyLogs() }}
                className={cn(
                  'px-3 py-1 text-xs font-medium transition-colors border-l border-dark-border',
                  mode === 'proxy'
                    ? 'bg-primary text-white'
                    : 'text-dark-text-secondary hover:text-dark-text'
                )}
              >
                HTTP 代理抓包
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'proxy' && (
              <>
                {/* 代理状态指示 */}
                <span className={cn(
                  'flex items-center gap-1.5 text-xs px-2 py-1 rounded-full',
                  proxyRunning
                    ? 'bg-success/10 text-success'
                    : 'bg-dark-bg text-dark-text-secondary'
                )}>
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    proxyRunning ? 'bg-success' : 'bg-dark-text-secondary'
                  )} />
                  {proxyRunning ? '运行中' : '未启动'}
                </span>

                {/* 代理控制按钮 */}
                {proxyRunning ? (
                  <Button variant="danger" size="sm" onClick={handleStopProxy}>
                    <Square size={12} className="mr-1" />
                    停止代理
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleStartProxy}>
                    <Play size={12} className="mr-1" />
                    启动代理
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleCopyProxyAddress}>
                  <Copy size={12} className="mr-1" />
                  复制地址
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearProxyLogs}>
                  <Trash2 size={12} className="mr-1" />
                  清空日志
                </Button>
              </>
            )}
            {mode === 'capture' && (
              <>
                <Button variant="ghost" size="sm" onClick={loadRecords}>
                  <RefreshCw size={12} className="mr-1" />
                  刷新
                </Button>
                <Button variant="danger" size="sm" onClick={handleClear}>
                  <Trash2 size={12} className="mr-1" />
                  清空
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 代理使用说明 */}
        {mode === 'proxy' && (
          <div className="mt-3 p-3 bg-dark-card border border-dark-border rounded-lg">
            <div className="flex items-start gap-2">
              <Globe size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-sm">
                <p className="text-dark-text">
                  <span className="text-dark-text-secondary">代理地址: </span>
                  <code className="text-primary bg-dark-bg px-1.5 py-0.5 rounded text-xs font-mono">
                    {proxyAddress}
                  </code>
                </p>
                <p className="text-dark-text-secondary text-xs">
                  将 HTTP 客户端的代理设置为该地址即可抓包。
                  示例: <code className="text-xs bg-dark-bg px-1 rounded">curl --proxy {proxyAddress} http://example.com</code>
                </p>
                <div className="flex items-center gap-1 text-xs text-yellow-500">
                  <AlertTriangle size={12} />
                  当前版本仅支持 HTTP 请求代理，HTTPS CONNECT 仅记录域名和端口，不解密内容。
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 筛选栏 (仅代理模式) */}
      {mode === 'proxy' && (
        <div className="px-4 py-2 border-b border-dark-border flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded border',
              showFilter ? 'border-primary text-primary' : 'border-dark-border text-dark-text-secondary'
            )}
          >
            <Filter size={12} />
            筛选
          </button>
          {Object.entries(filter).length > 0 && (
            <button onClick={clearFilter} className="flex items-center gap-1 px-2 py-1 text-xs text-dark-text-secondary hover:text-dark-text">
              <X size={12} />
              清除筛选
            </button>
          )}
          <span className="text-xs text-dark-text-secondary ml-auto">
            共 {logTotal} 条记录
          </span>
        </div>
      )}

      {/* 筛选面板 */}
      {mode === 'proxy' && showFilter && (
        <div className="px-4 py-3 border-b border-dark-border bg-dark-card/50">
          <div className="flex gap-3 flex-wrap items-end">
            {/* Method 筛选 */}
            <div>
              <label className="text-xs text-dark-text-secondary block mb-1">方法</label>
              <select
                value={filter.method || ''}
                onChange={(e) => setFilter({ ...filter, method: e.target.value || undefined })}
                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text"
              >
                <option value="">全部</option>
                {ALL_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* 来源筛选 */}
            <div>
              <label className="text-xs text-dark-text-secondary block mb-1">来源</label>
              <select
                value={filter.source || ''}
                onChange={(e) => setFilter({ ...filter, source: e.target.value || undefined })}
                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text"
              >
                <option value="">全部</option>
                <option value="proxy">代理</option>
                <option value="internal">本软件</option>
              </select>
            </div>

            {/* Status Code 筛选 */}
            <div>
              <label className="text-xs text-dark-text-secondary block mb-1">状态码</label>
              <input
                type="number"
                value={filter.status_code || ''}
                onChange={(e) => setFilter({ ...filter, status_code: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="如 200"
                className="w-20 bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text"
              />
            </div>

            {/* Host 筛选 */}
            <div>
              <label className="text-xs text-dark-text-secondary block mb-1">Host</label>
              <input
                type="text"
                value={filter.host || ''}
                onChange={(e) => setFilter({ ...filter, host: e.target.value || undefined })}
                placeholder="example.com"
                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text w-40"
              />
            </div>

            {/* 关键词 */}
            <div>
              <label className="text-xs text-dark-text-secondary block mb-1">关键词</label>
              <input
                type="text"
                value={filter.keyword || ''}
                onChange={(e) => setFilter({ ...filter, keyword: e.target.value || undefined })}
                placeholder="搜索..."
                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text w-32"
              />
            </div>

            {/* HTTPS CONNECT 筛选 */}
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="https-connect"
                checked={filter.is_https_connect === true}
                onChange={(e) => setFilter({
                  ...filter,
                  is_https_connect: e.target.checked ? true : undefined,
                })}
                className="rounded"
              />
              <label htmlFor="https-connect" className="text-xs text-dark-text-secondary">
                仅 HTTPS CONNECT
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧列表 */}
        <div className="flex-1 flex flex-col border-r border-dark-border min-w-0">
          <div className="flex-1 overflow-y-auto">
            {mode === 'capture' && (
              records.length === 0 ? (
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
                      <span className={cn('font-mono font-bold text-xs w-16', getMethodColor(record.method))}>
                        {record.method}
                      </span>
                      <span className="flex-1 text-sm text-dark-text truncate font-mono">
                        {record.url}
                      </span>
                      <span className={cn('font-mono text-xs', record.status_code ? getStatusColor(record.status_code) : 'text-error')}>
                        {record.status_code || '-'}
                      </span>
                      <span className="text-xs text-dark-text-secondary">
                        {record.duration ? formatDuration(record.duration) : '-'}
                      </span>
                      <span className="text-xs text-dark-text-secondary w-16 text-right">
                        {formatTime(record.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}

            {mode === 'proxy' && (
              proxyLogs.length === 0 ? (
                <EmptyState message="暂无代理日志" />
              ) : (
                <div className="divide-y divide-dark-border">
                  {proxyLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 cursor-pointer',
                        selectedLog?.id === log.id
                          ? 'bg-dark-card'
                          : 'hover:bg-dark-card/50'
                      )}
                    >
                      {/* HTTPS CONNECT 标记 */}
                      {log.is_https_connect ? (
                        <span className="w-16">
                          <span className="text-xs bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20">
                            TLS
                          </span>
                        </span>
                      ) : (
                        <span className={cn('font-mono font-bold text-xs w-16', getMethodColor(log.method))}>
                          {log.method}
                        </span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="text-sm text-dark-text truncate font-mono block">
                          {log.host}{log.path}
                        </span>
                        {log.error_message && (
                          <span className="text-xs text-error truncate block">{log.error_message}</span>
                        )}
                      </span>
                      {log.status_code ? (
                        <span className={cn('font-mono text-xs', getStatusColor(log.status_code))}>
                          {log.status_code}
                        </span>
                      ) : (
                        <span className="text-xs text-error">失败</span>
                      )}
                      <span className="text-xs text-dark-text-secondary">
                        {log.duration ? formatDuration(log.duration) : '-'}
                      </span>
                      <span className="text-xs text-dark-text-secondary w-16 text-right">
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* 右侧详情 */}
        <div className="w-96 flex flex-col bg-dark-bg/30">
          {/* 捕获记录详情 */}
          {mode === 'capture' && selectedRecord && (
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
          )}

          {/* 代理日志详情 */}
          {mode === 'proxy' && selectedLog && (
            <>
              <div className="p-4 border-b border-dark-border flex items-center justify-between">
                <h3 className="text-sm font-medium text-dark-text">
                  {selectedLog.is_https_connect ? 'HTTPS CONNECT 详情' : '请求详情'}
                </h3>
                <div className="flex gap-1">
                  {!selectedLog.is_https_connect && (
                    <>
                      <button
                        onClick={() => handleRestoreProxyLog(selectedLog)}
                        className="p-1.5 rounded hover:bg-dark-bg text-dark-text-secondary hover:text-dark-text"
                        title="恢复到工作台"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={() => handleReplayConfirm(selectedLog)}
                        className="p-1.5 rounded hover:bg-dark-bg text-dark-text-secondary hover:text-dark-text"
                        title="重放请求"
                      >
                        <Send size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={async () => {
                      await copyToClipboard(selectedLog.url)
                      toast.success('URL 已复制')
                    }}
                    className="p-1.5 rounded hover:bg-dark-bg text-dark-text-secondary hover:text-dark-text"
                    title="复制 URL"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* HTTPS CONNECT 特殊说明 */}
                {selectedLog.is_https_connect && (
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <div className="flex gap-2">
                      <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
                      <div className="text-sm text-yellow-500/90">
                        <p className="font-medium mb-1">HTTPS CONNECT 连接</p>
                        <p>这是 HTTPS CONNECT 连接，当前版本仅记录目标域名和端口，不解密请求内容。</p>
                        <p className="mt-2 text-xs">
                          目标: {selectedLog.host}
                          {selectedLog.note && ` — ${selectedLog.note}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedLog.is_https_connect && (
                  <>
                    {/* 请求概览 */}
                    <div className="bg-dark-bg border border-dark-border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('font-mono font-bold text-xs', getMethodColor(selectedLog.method))}>
                          {selectedLog.method}
                        </span>
                        <span className="font-mono text-sm text-dark-text break-all">
                          {selectedLog.url}
                        </span>
                      </div>
                      {selectedLog.error_message && (
                        <p className="text-xs text-error mt-1">{selectedLog.error_message}</p>
                      )}
                    </div>

                    {/* 请求头 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs text-dark-text-secondary">请求头</h4>
                        <button
                          onClick={async () => {
                            const text = Object.entries(selectedLog.request_headers || {})
                              .map(([k, v]) => `${k}: ${v}`).join('\n')
                            await copyToClipboard(text)
                            toast.success('请求头已复制')
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          复制
                        </button>
                      </div>
                      <div className="bg-dark-bg border border-dark-border rounded p-3 max-h-32 overflow-y-auto">
                        {Object.entries(selectedLog.request_headers || {}).length === 0 ? (
                          <p className="text-xs text-dark-text-secondary">无</p>
                        ) : (
                          Object.entries(selectedLog.request_headers).map(([key, value]) => (
                            <div key={key} className="text-xs font-mono leading-relaxed">
                              <span className="text-primary">{key}</span>: {value}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 请求体预览 */}
                    {selectedLog.request_body_preview && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs text-dark-text-secondary">请求体预览</h4>
                          <button
                            onClick={async () => {
                              await copyToClipboard(selectedLog.request_body_preview || '')
                              toast.success('请求体已复制')
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            复制
                          </button>
                        </div>
                        <div className="bg-dark-bg border border-dark-border rounded p-3 max-h-32 overflow-y-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {selectedLog.request_body_preview}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* 响应头 */}
                    {Object.keys(selectedLog.response_headers || {}).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs text-dark-text-secondary">响应头</h4>
                          <button
                            onClick={async () => {
                              const text = Object.entries(selectedLog.response_headers || {})
                                .map(([k, v]) => `${k}: ${v}`).join('\n')
                              await copyToClipboard(text)
                              toast.success('响应头已复制')
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            复制
                          </button>
                        </div>
                        <div className="bg-dark-bg border border-dark-border rounded p-3 max-h-32 overflow-y-auto">
                          {Object.entries(selectedLog.response_headers).map(([key, value]) => (
                            <div key={key} className="text-xs font-mono leading-relaxed">
                              <span className="text-primary">{key}</span>: {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 响应体预览 */}
                    {selectedLog.response_body_preview && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs text-dark-text-secondary">响应体预览</h4>
                          <button
                            onClick={async () => {
                              await copyToClipboard(selectedLog.response_body_preview || '')
                              toast.success('响应体已复制')
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            复制
                          </button>
                        </div>
                        <div className="bg-dark-bg border border-dark-border rounded p-3 max-h-48 overflow-y-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {selectedLog.response_body_preview}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 元数据 */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-dark-bg border border-dark-border rounded p-2 text-center">
                    <p className="text-xs text-dark-text-secondary">状态码</p>
                    <p className={cn('font-mono font-bold', getStatusColor(selectedLog.status_code || 0))}>
                      {selectedLog.status_code || '-'}
                    </p>
                  </div>
                  <div className="bg-dark-bg border border-dark-border rounded p-2 text-center">
                    <p className="text-xs text-dark-text-secondary">耗时</p>
                    <p className="font-mono text-dark-text text-xs">
                      {selectedLog.duration ? formatDuration(selectedLog.duration) : '-'}
                    </p>
                  </div>
                  <div className="bg-dark-bg border border-dark-border rounded p-2 text-center">
                    <p className="text-xs text-dark-text-secondary">大小</p>
                    <p className="font-mono text-dark-text text-xs">
                      {selectedLog.size ? `${(selectedLog.size / 1024).toFixed(1)} KB` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 无选中 */}
          {((mode === 'capture' && !selectedRecord) || (mode === 'proxy' && !selectedLog)) && (
            <EmptyState message="点击记录查看详情" />
          )}
        </div>
      </div>
    </div>
  )
}
