// 响应查看器

import { useState, useMemo } from 'react'
import { useAppStore } from '@/shared/store'
import { cn, formatSize, formatDuration, getStatusColor, copyToClipboard } from '@/shared/utils'
import { Tabs, EmptyState } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { Copy, Check, CheckCircle, XCircle, FileDown, Download } from 'lucide-react'

// 解析 Set-Cookie 头
function parseCookies(headers: Record<string, string>) {
  const cookies: Array<Record<string, string>> = []
  const setCookie = headers['set-cookie'] || headers['Set-Cookie']
  if (!setCookie) return cookies

  const parts = setCookie.split(',')
  for (const part of parts) {
    const trimmed = part.trim()
    try {
      const cookie: Record<string, string> = {}
      const segments = trimmed.split(';')
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i].trim()
        if (i === 0) {
          const eqIdx = seg.indexOf('=')
          if (eqIdx > 0) {
            cookie.name = seg.substring(0, eqIdx).trim()
            cookie.value = seg.substring(eqIdx + 1).trim()
          }
        } else {
          const lowerSeg = seg.toLowerCase()
          if (lowerSeg.startsWith('expires=')) {
            cookie.expires = seg.substring(8).trim()
          } else if (lowerSeg.startsWith('max-age=')) {
            cookie['max-age'] = seg.substring(8).trim()
          } else if (lowerSeg.startsWith('domain=')) {
            cookie.domain = seg.substring(7).trim()
          } else if (lowerSeg.startsWith('path=')) {
            cookie.path = seg.substring(5).trim()
          } else if (lowerSeg.startsWith('samesite=')) {
            cookie.samesite = seg.substring(9).trim()
          } else if (lowerSeg === 'httponly') {
            cookie.httponly = 'true'
          } else if (lowerSeg === 'secure') {
            cookie.secure = 'true'
          }
        }
      }
      if (cookie.name) {
        cookies.push(cookie)
      }
    } catch {
      // 忽略解析失败的 cookie
    }
  }
  return cookies
}

// 判断是否为图片 content-type
function isImageContentType(contentType: string): boolean {
  if (!contentType) return false
  return /^image\/(png|jpeg|gif|webp|svg\+xml)/i.test(contentType)
}

// 判断是否为文本类型
function isTextContentType(contentType: string): boolean {
  if (!contentType) return true
  const textTypes = ['text/', 'application/json', 'application/xml', 'application/javascript']
  return textTypes.some((t) => contentType.startsWith(t))
}

export function ResponseViewer() {
  const { response, isLoading, currentRequest } = useAppStore()
  const [activeTab, setActiveTab] = useState('body')
  const [copied, setCopied] = useState(false)

  // 解析 Cookies
  const cookies = useMemo(() => {
    if (!response?.headers) return []
    return parseCookies(response.headers)
  }, [response?.headers])

  // 从后端 script_results 获取测试结果
  const testResults = response?.script_results?.test_results || []
  const passedCount = testResults.filter((r) => r.passed).length
  const failedCount = testResults.filter((r) => !r.passed).length

  const tabs = [
    { key: 'body', label: '响应体' },
    { key: 'headers', label: '响应头' },
    { key: 'cookies', label: 'Cookies' },
    { key: 'tests', label: testResults.length > 0 ? `测试结果 (${passedCount}/${testResults.length})` : '测试结果' },
  ]

  const handleCopy = async () => {
    if (response?.body) {
      await copyToClipboard(response.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!response?.body) return
    const blob = new Blob([response.body], { type: response.content_type || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'response.bin'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFormattedBody = () => {
    if (!response?.body) return ''
    try {
      const parsed = JSON.parse(response.body)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return response.body
    }
  }

  const isJson = () => {
    if (!response?.body) return false
    try {
      JSON.parse(response.body)
      return true
    } catch {
      return false
    }
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

  const imageType = isImageContentType(response.content_type)
  const textType = isTextContentType(response.content_type)

  return (
    <div className="flex flex-col h-full">
      {/* 状态栏 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-dark-border text-sm">
        <span className={cn('font-mono font-bold text-base', getStatusColor(response.status_code))}>
          {response.status_code}
        </span>
        <span className="text-dark-text-secondary">⏱ {formatDuration(response.duration)}</span>
        <span className="text-dark-text-secondary">📦 {formatSize(response.body_size)}</span>
        <span className="text-dark-text-secondary text-xs">HTTP/1.1</span>
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
            {/* HTML 预览 */}
            {response.content_type?.includes('text/html') && (
              <div className="border border-dark-border rounded overflow-hidden mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg border-b border-dark-border">
                  <span className="text-xs text-dark-text-secondary">HTML 预览（沙箱隔离）</span>
                </div>
                <iframe
                  srcDoc={response.body}
                  sandbox="allow-same-origin"
                  className="w-full h-96 bg-white"
                  title="HTML 预览"
                />
              </div>
            )}

            {imageType ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={`data:${response.content_type};base64,${btoa(response.body)}`}
                  alt="响应图片"
                  className="max-w-full max-h-80 rounded border border-dark-border"
                  onError={() => {}}
                />
                <p className="text-xs text-dark-text-secondary">
                  图片预览（{formatSize(response.body_size)}），可通过上方的"复制"按钮查看原始数据
                </p>
              </div>
            ) : response.is_binary ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <FileDown size={32} className="text-dark-text-secondary" />
                <p className="text-sm text-dark-text-secondary">
                  二进制响应 ({formatSize(response.body_size)})
                </p>
                <Button onClick={handleDownload}>
                  <Download size={14} className="mr-1" />下载文件
                </Button>
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
            {cookies.length === 0 ? (
              <p className="text-sm text-dark-text-secondary text-center py-8">
                当前响应没有 Set-Cookie
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left py-2 text-dark-text-secondary font-medium">Name</th>
                    <th className="text-left py-2 text-dark-text-secondary font-medium">Value</th>
                    <th className="text-left py-2 text-dark-text-secondary font-medium">Domain</th>
                    <th className="text-left py-2 text-dark-text-secondary font-medium">Path</th>
                    <th className="text-left py-2 text-dark-text-secondary font-medium">Expires</th>
                    <th className="text-left py-2 text-dark-text-secondary font-medium">属性</th>
                  </tr>
                </thead>
                <tbody>
                  {cookies.map((c, i) => (
                    <tr key={i} className="border-b border-dark-border/50">
                      <td className="py-2 text-dark-text font-mono">{c.name}</td>
                      <td className="py-2 text-dark-text-secondary font-mono break-all max-w-[150px] truncate">{c.value}</td>
                      <td className="py-2 text-dark-text-secondary">{c.domain || '-'}</td>
                      <td className="py-2 text-dark-text-secondary font-mono">{c.path || '/'}</td>
                      <td className="py-2 text-dark-text-secondary text-xs">{c.expires || c['max-age'] || '-'}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {c.httponly === 'true' && <span className="px-1 text-xs bg-info/20 text-info rounded">HttpOnly</span>}
                          {c.secure === 'true' && <span className="px-1 text-xs bg-warning/20 text-warning rounded">Secure</span>}
                          {c.samesite && <span className="px-1 text-xs bg-primary/20 text-primary rounded">{c.samesite}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="p-4">
            {!currentRequest.testScript?.trim() ? (
              <p className="text-sm text-dark-text-secondary text-center py-8">
                请在请求编辑器的 Tests 面板中编写测试断言，发送请求后将自动执行
              </p>
            ) : testResults.length === 0 ? (
              <p className="text-sm text-dark-text-secondary text-center py-8">
                未获取到测试结果。请检查 Tests 面板脚本是否正确。
              </p>
            ) : (
              <>
                {/* 统计栏 */}
                <div className="flex gap-4 mb-3 px-3 py-2 bg-dark-bg rounded">
                  <span className="text-sm text-success">✓ {passedCount} 通过</span>
                  <span className="text-sm text-error">✗ {failedCount} 失败</span>
                  <span className="text-sm text-dark-text-secondary">共 {testResults.length} 条</span>
                </div>
                {/* 结果列表 */}
                <div className="space-y-2">
                  {testResults.map((tr, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg border',
                        tr.passed
                          ? 'bg-success/5 border-success/20'
                          : 'bg-error/5 border-error/20'
                      )}
                    >
                      {tr.passed ? (
                        <CheckCircle size={16} className="text-success flex-shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-error flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', tr.passed ? 'text-dark-text' : 'text-error')}>
                          {tr.name}
                        </p>
                        {!tr.passed && (
                          <p className="text-xs text-error/80 mt-0.5">{tr.message}</p>
                        )}
                      </div>
                      {tr.duration !== undefined && (
                        <span className="text-xs text-dark-text-secondary flex-shrink-0">
                          {tr.duration}ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
