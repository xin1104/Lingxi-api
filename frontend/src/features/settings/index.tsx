// 设置页面

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/shared/store'
import { Button, Input, Select } from '@/shared/ui'
import { Settings, Database, Palette, Clock, Server, Globe, Cookie, AlertTriangle } from 'lucide-react'
import { toast } from '@/shared/ui/Toast'
import * as api from '@/shared/api'

export function SettingsPage() {
  const { settings, loadSettings, updateSettings } = useAppStore()
  const [cookieJarEnabled, setCookieJarEnabled] = useState(true)
  const [cookieCount, setCookieCount] = useState(0)
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false)
  const [showClearCookiesConfirm, setShowClearCookiesConfirm] = useState(false)

  useEffect(() => {
    loadSettings()
    loadCookieJarStatus()
  }, [])

  const loadCookieJarStatus = useCallback(async () => {
    try {
      const result = await api.getCookieJarStatus()
      if (result.success) {
        setCookieJarEnabled(result.data.enabled)
        setCookieCount(result.data.count)
      }
    } catch {
      // 静默失败
    }
  }, [])

  const handleUpdateSettings = async (data: Record<string, any>) => {
    try {
      const result = await api.updateSettings(data)
      if (result.success) {
        useAppStore.setState({ settings: result.data })
        toast.success('设置已保存')
      } else {
        toast.error('设置保存失败: ' + result.message)
      }
    } catch {
      toast.error('设置保存失败，请检查后端连接')
    }
  }

  const handleToggleCookieJar = async () => {
    const newValue = !cookieJarEnabled
    try {
      const result = await api.updateSettings({ cookie_jar_enabled: newValue })
      if (result.success) {
        setCookieJarEnabled(newValue)
        useAppStore.setState({ settings: result.data })
        toast.success(newValue ? 'Cookie Jar 已启用' : 'Cookie Jar 已禁用')
      } else {
        toast.error('切换失败: ' + result.message)
      }
    } catch {
      toast.error('切换失败，请检查后端连接')
    }
  }

  const handleClearCookies = async () => {
    try {
      const result = await api.clearCookies()
      if (result.success) {
        setCookieCount(0)
        toast.success(result.message || 'Cookie 已清空')
      } else {
        toast.error(result.message || '清空 Cookie 失败')
      }
    } catch {
      toast.error('清空 Cookie 失败，请检查后端连接')
    }
    setShowClearCookiesConfirm(false)
  }

  const handleClearAllData = async () => {
    try {
      const result = await api.clearAllData()
      if (result.success) {
        toast.success(result.message || '本地数据已清空')
        // 刷新 Cookie Jar 状态
        loadCookieJarStatus()
      } else {
        toast.error(result.message || '清空数据失败')
      }
    } catch {
      toast.error('清空数据失败，请检查后端连接')
    }
    setShowClearDataConfirm(false)
  }

  if (!settings) {
    return <div className="p-4">加载中...</div>
  }

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <h1 className="text-xl font-bold text-dark-text mb-6 flex items-center gap-2">
        <Settings size={20} />
        设置
      </h1>

      <div className="space-y-6 max-w-2xl">
        {/* 外观 */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-dark-text mb-4 flex items-center gap-2">
            <Palette size={16} />
            外观
          </h2>
          <Select
            label="主题"
            options={[
              { value: 'dark', label: '深色模式' },
              { value: 'light', label: '浅色模式' },
              { value: 'system', label: '跟随系统' },
            ]}
            value={settings.theme}
            onChange={(e) => handleUpdateSettings({ theme: e.target.value })}
          />
        </div>

        {/* 请求 */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-dark-text mb-4 flex items-center gap-2">
            <Clock size={16} />
            请求
          </h2>
          <div className="space-y-4">
            <Input
              label="默认请求超时（秒）"
              type="number"
              value={settings.default_timeout}
              onChange={(e) => handleUpdateSettings({ default_timeout: parseInt(e.target.value) })}
            />
            <Input
              label="历史记录保存数量"
              type="number"
              value={settings.history_limit}
              onChange={(e) => handleUpdateSettings({ history_limit: parseInt(e.target.value) })}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoFormatJson"
                checked={settings.auto_format_json}
                onChange={(e) => handleUpdateSettings({ auto_format_json: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="autoFormatJson" className="text-sm text-dark-text">
                自动格式化 JSON
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSaveHistory"
                checked={settings.auto_save_history}
                onChange={(e) => handleUpdateSettings({ auto_save_history: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="autoSaveHistory" className="text-sm text-dark-text">
                发送后自动保存历史
              </label>
            </div>
          </div>
        </div>

        {/* Cookie Jar */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-dark-text mb-4 flex items-center gap-2">
            <Cookie size={16} />
            Cookie Jar
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cookieJarEnabled"
                  checked={cookieJarEnabled}
                  onChange={handleToggleCookieJar}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="cookieJarEnabled" className="text-sm text-dark-text">
                  启用 Cookie Jar
                </label>
              </div>
              <span className="text-xs text-dark-text-secondary">
                当前 {cookieCount} 条 Cookie
              </span>
            </div>
            <p className="text-xs text-dark-text-secondary">
              启用后自动保存响应中的 Set-Cookie，并在后续请求中自动携带匹配的 Cookie。
              手动设置的 Cookie Header 优先级高于 Cookie Jar。
            </p>
            {cookieCount > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowClearCookiesConfirm(true)}
              >
                清空 Cookie Jar（{cookieCount} 条）
              </Button>
            )}
          </div>
        </div>

        {/* Mock 服务 */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-dark-text mb-4 flex items-center gap-2">
            <Server size={16} />
            Mock 服务
          </h2>
          <Input
            label="Mock 服务器端口"
            type="number"
            value={settings.mock_port}
            onChange={(e) => handleUpdateSettings({ mock_port: parseInt(e.target.value) })}
          />
        </div>

        {/* 代理 */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-dark-text mb-4 flex items-center gap-2">
            <Globe size={16} />
            代理设置
          </h2>
          <div className="space-y-4">
            <Input
              label="HTTP 代理抓包端口"
              type="number"
              value={settings.proxy_port || 8899}
              onChange={(e) => handleUpdateSettings({ proxy_port: parseInt(e.target.value) })}
            />
            <Select
              label="代理类型"
              options={[
                { value: 'none', label: '不使用代理' },
                { value: 'system', label: '系统代理' },
                { value: 'custom', label: '自定义代理' },
              ]}
              value={settings.proxy_type}
              onChange={(e) => handleUpdateSettings({ proxy_type: e.target.value })}
            />
            {settings.proxy_type === 'custom' && (
              <Input
                label="代理地址"
                value={settings.proxy_url}
                onChange={(e) => handleUpdateSettings({ proxy_url: e.target.value })}
                placeholder="http://127.0.0.1:7890"
              />
            )}
          </div>
        </div>

        {/* 数据 */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-dark-text mb-4 flex items-center gap-2">
            <Database size={16} />
            数据管理
          </h2>
          <p className="text-xs text-dark-text-secondary mb-2">
            数据库位置: backend/data/lingxi.db
          </p>
          <p className="text-xs text-dark-text-secondary mb-4">
            清空本地数据将删除所有集合、环境、历史记录、Mock 路由和 Cookie，
            但保留当前设置。
          </p>
          <Button variant="danger" onClick={() => setShowClearDataConfirm(true)}>
            清空本地数据
          </Button>
        </div>
      </div>

      {/* 清空 Cookie 确认弹窗 */}
      {showClearCookiesConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowClearCookiesConfirm(false)}>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-yellow-500" />
              <h3 className="text-sm font-medium text-dark-text">确认清空 Cookie Jar</h3>
            </div>
            <p className="text-sm text-dark-text-secondary mb-6">
              将删除所有 {cookieCount} 条已保存的 Cookie，此操作不可撤销。
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowClearCookiesConfirm(false)}>取消</Button>
              <Button variant="danger" onClick={handleClearCookies}>确认清空</Button>
            </div>
          </div>
        </div>
      )}

      {/* 清空数据确认弹窗 */}
      {showClearDataConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowClearDataConfirm(false)}>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-error" />
              <h3 className="text-sm font-medium text-dark-text">确认清空本地数据</h3>
            </div>
            <p className="text-sm text-dark-text-secondary mb-6">
              将删除所有集合、环境、历史记录、Mock 路由和 Cookie，此操作不可撤销。
              当前设置将被保留。
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowClearDataConfirm(false)}>取消</Button>
              <Button variant="danger" onClick={handleClearAllData}>确认清空</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
