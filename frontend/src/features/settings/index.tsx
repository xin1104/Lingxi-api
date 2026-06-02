// 设置页面

import React, { useEffect } from 'react'
import { useAppStore } from '@/shared/store'
import { Button, Input, Select } from '@/shared/ui'
import { Settings, Database, Palette, Clock, Server, Globe } from 'lucide-react'

export function SettingsPage() {
  const { settings, loadSettings, updateSettings } = useAppStore()

  useEffect(() => {
    loadSettings()
  }, [])

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
            onChange={(e) => updateSettings({ theme: e.target.value as any })}
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
              onChange={(e) => updateSettings({ default_timeout: parseInt(e.target.value) })}
            />
            <Input
              label="历史记录保存数量"
              type="number"
              value={settings.history_limit}
              onChange={(e) => updateSettings({ history_limit: parseInt(e.target.value) })}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoFormatJson"
                checked={settings.auto_format_json}
                onChange={(e) => updateSettings({ auto_format_json: e.target.checked })}
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
                onChange={(e) => updateSettings({ auto_save_history: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="autoSaveHistory" className="text-sm text-dark-text">
                发送后自动保存历史
              </label>
            </div>
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
            onChange={(e) => updateSettings({ mock_port: parseInt(e.target.value) })}
          />
        </div>

        {/* 代理 */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-dark-text mb-4 flex items-center gap-2">
            <Globe size={16} />
            代理设置
          </h2>
          <div className="space-y-4">
            <Select
              label="代理类型"
              options={[
                { value: 'none', label: '不使用代理' },
                { value: 'system', label: '系统代理' },
                { value: 'custom', label: '自定义代理' },
              ]}
              value={settings.proxy_type}
              onChange={(e) => updateSettings({ proxy_type: e.target.value as any })}
            />
            {settings.proxy_type === 'custom' && (
              <Input
                label="代理地址"
                value={settings.proxy_url}
                onChange={(e) => updateSettings({ proxy_url: e.target.value })}
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
          <p className="text-sm text-dark-text-secondary mb-2">
            数据库位置: backend/data/lingxi.db
          </p>
          <Button variant="danger">清空本地数据</Button>
        </div>
      </div>
    </div>
  )
}
