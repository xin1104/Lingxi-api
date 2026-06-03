// 请求编辑器组件

import { useState } from 'react'
import { useAppStore } from '@/shared/store'
import { cn, getMethodColor, copyToClipboard } from '@/shared/utils'
import { Button, Input, Tabs } from '@/shared/ui'
import { Send, Save, Code, Check, X } from 'lucide-react'
import { ParamsEditor } from './ParamsEditor'
import { HeadersEditor } from './HeadersEditor'
import { AuthEditor } from './AuthEditor'
import { BodyEditor } from './BodyEditor'
import { CodeEditor } from '@/shared/ui/CodeEditor'
import * as api from '@/shared/api'

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
    collections,
    loadCollections,
    saveRequestToCollection,
    setActiveSidebar,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('params')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveCollectionId, setSaveCollectionId] = useState<number | null>(null)
  const [showCodePanel, setShowCodePanel] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeLang, setCodeLang] = useState('curl')
  const [codeCopied, setCodeCopied] = useState(false)

  const tabs = [
    { key: 'params', label: '参数' },
    { key: 'headers', label: '请求头' },
    { key: 'auth', label: '认证' },
    { key: 'body', label: '请求体' },
    { key: 'pre_script', label: 'Pre Script' },
    { key: 'tests', label: 'Tests' },
  ]

  const previewUrl = currentRequest.url.replace(/\{\{(.+?)\}\}/g, (_match, varName) => {
    return variables[varName] || _match
  })

  const handleSend = () => {
    sendCurrentRequest()
  }

  const handleOpenSaveDialog = () => {
    loadCollections()
    setSaveName('')
    if (collections.length > 0) {
      setSaveCollectionId(collections[0].id)
    }
    setShowSaveDialog(true)
  }

  const handleSave = async () => {
    if (saveName.trim() && saveCollectionId) {
      await saveRequestToCollection(saveCollectionId, saveName.trim())
      setShowSaveDialog(false)
    }
  }

  const handleGenerateCode = async (lang: string) => {
    setCodeLang(lang)
    try {
      const result = await api.generateCode({
        ...currentRequest,
        language: lang,
      })
      if (result.success) {
        setGeneratedCode(result.data.code)
      } else {
        setGeneratedCode('生成失败: ' + result.message)
      }
    } catch {
      setGeneratedCode('生成失败，请检查后端连接')
    }
    setShowCodePanel(true)
  }

  const handleCopyCode = async () => {
    await copyToClipboard(generatedCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
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

        <Button variant="secondary" title="保存到集合" onClick={handleOpenSaveDialog}>
          <Save size={14} />
        </Button>

        <div className="relative group">
          <Button variant="secondary" title="生成代码">
            <Code size={14} />
          </Button>
          <div className="absolute right-0 top-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl z-20 hidden group-hover:block min-w-[200px]">
            {['curl', 'python', 'javascript', 'node', 'go'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleGenerateCode(lang)}
                className="block w-full text-left px-3 py-2 text-sm text-dark-text hover:bg-dark-border rounded"
              >
                {lang === 'curl' ? 'cURL' : lang === 'python' ? 'Python requests' : lang === 'javascript' ? 'JavaScript fetch' : lang === 'node' ? 'Node.js axios' : 'Go net/http'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 保存对话框 */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-dark-text mb-4">保存到集合</h3>
            {collections.length === 0 ? (
              <p className="text-sm text-dark-text-secondary mb-4">
                暂无集合，请先在左侧栏"接口集合"中创建集合
              </p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-dark-text-secondary">选择集合</label>
                  <select
                    value={saveCollectionId || ''}
                    onChange={(e) => setSaveCollectionId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-dark-bg border border-dark-border rounded text-sm text-dark-text"
                  >
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="请求名称"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="输入请求名称"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') setShowSaveDialog(false)
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>取消</Button>
                  <Button onClick={handleSave} disabled={!saveName.trim()}>保存</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 代码生成面板 */}
      {showCodePanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCodePanel(false)}>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 w-[600px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-dark-text">
                代码生成 - {codeLang === 'curl' ? 'cURL' : codeLang === 'python' ? 'Python' : codeLang === 'javascript' ? 'JavaScript' : codeLang === 'node' ? 'Node.js' : 'Go'}
              </h3>
              <button onClick={() => setShowCodePanel(false)} className="p-1 hover:bg-dark-border rounded">
                <X size={16} className="text-dark-text-secondary" />
              </button>
            </div>
            <pre className="flex-1 p-4 bg-dark-bg border border-dark-border rounded text-sm font-mono text-dark-text overflow-auto whitespace-pre-wrap">
              {generatedCode}
            </pre>
            <div className="flex justify-end mt-3">
              <Button variant="secondary" onClick={handleCopyCode}>
                {codeCopied ? <Check size={14} className="mr-1" /> : <Code size={14} className="mr-1" />}
                {codeCopied ? '已复制' : '复制代码'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
          {activeTab === 'pre_script' && (
            <div className="p-4">
              <p className="text-xs text-dark-text-secondary mb-2">
                Pre Script — 请求发送前执行的脚本（Demo 暂未实现完整沙箱，脚本仅供参考）
              </p>
              <CodeEditor
                value={currentRequest.preScript || ''}
                onChange={(v) => useAppStore.setState((s) => ({
                  currentRequest: { ...s.currentRequest, preScript: v || '' }
                }))}
                language="javascript"
                height="200px"
              />
            </div>
          )}
          {activeTab === 'tests' && (
            <div className="p-4">
              <p className="text-xs text-dark-text-secondary mb-2">
                Tests — 响应返回后执行的测试断言（Demo 级安全实现）
              </p>
              <CodeEditor
                value={currentRequest.testScript || ''}
                onChange={(v) => useAppStore.setState((s) => ({
                  currentRequest: { ...s.currentRequest, testScript: v || '' }
                }))}
                language="javascript"
                height="200px"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
