// 请求编辑器组件

import React, { useState } from 'react'
import { useAppStore } from '@/shared/store'
import { cn, getMethodColor } from '@/shared/utils'
import { Button, Input, Tabs } from '@/shared/ui'
import { Send, Save, Code } from 'lucide-react'
import { ParamsEditor } from './ParamsEditor'
import { HeadersEditor } from './HeadersEditor'
import { AuthEditor } from './AuthEditor'
import { BodyEditor } from './BodyEditor'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export function RequestEditor() {
  const {
    currentRequest,
    setMethod,
    setUrl,
    setParams,
    setHeaders,
    setAuth,
    setBody,
    sendCurrentRequest,
    isLoading,
    variables,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('params')

  const tabs = [
    { key: 'params', label: '参数' },
    { key: 'headers', label: '请求头' },
    { key: 'auth', label: '认证' },
    { key: 'body', label: '请求体' },
  ]

  // 替换变量预览
  const previewUrl = currentRequest.url.replace(/\{\{(.+?)\}\}/g, (match, varName) => {
    return variables[varName] || match
  })

  const handleSend = () => {
    sendCurrentRequest()
  }

  return (
    <div className="flex flex-col h-full">
      {/* URL 输入区 */}
      <div className="flex items-center gap-2 p-4 border-b border-dark-border">
        <select
          value={currentRequest.method}
          onChange={(e) => setMethod(e.target.value as any)}
          className={cn(
            'px-3 py-2 bg-dark-card border border-dark-border rounded-md text-sm font-mono font-bold',
            getMethodColor(currentRequest.method)
          )}
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        <div className="flex-1 relative">
          <Input
            value={currentRequest.url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入请求 URL，支持 {{变量}} 语法"
            className="pr-4 font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSend()
              }
            }}
          />
          {currentRequest.url !== previewUrl && (
            <div className="absolute left-0 right-0 top-full mt-1 px-3 py-1 bg-dark-card border border-dark-border rounded text-xs text-dark-text-secondary truncate z-10">
              预览: {previewUrl}
            </div>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={isLoading || !currentRequest.url}
          className="min-w-[80px]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              发送中
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send size={14} />
              发送
            </span>
          )}
        </Button>

        <Button variant="secondary" title="保存到集合">
          <Save size={14} />
        </Button>

        <Button variant="secondary" title="生成代码">
          <Code size={14} />
        </Button>
      </div>

      {/* 标签页 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'params' && (
            <ParamsEditor
              params={currentRequest.params}
              onChange={setParams}
            />
          )}
          {activeTab === 'headers' && (
            <HeadersEditor
              headers={currentRequest.headers}
              onChange={setHeaders}
            />
          )}
          {activeTab === 'auth' && (
            <AuthEditor
              auth={currentRequest.auth}
              onChange={setAuth}
            />
          )}
          {activeTab === 'body' && (
            <BodyEditor
              body={currentRequest.body}
              onChange={setBody}
            />
          )}
        </div>
      </div>
    </div>
  )
}
