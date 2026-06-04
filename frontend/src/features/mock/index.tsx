// Mock 服务页面

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/shared/store'
import { Button, Input, EmptyState } from '@/shared/ui'
import { Plus, Trash2, Play, Square, Server } from 'lucide-react'
import { cn } from '@/shared/utils'
import * as api from '@/shared/api'
import { MockRoute } from '@/shared/types'

export function MockPage() {
  const {
    mockRoutes,
    mockRunning,
    loadMockRoutes,
    toggleMockServer,
    settings,
  } = useAppStore()

  const [showNewRoute, setShowNewRoute] = useState(false)
  const [newRoute, setNewRoute] = useState({
    method: 'GET',
    path: '',
    status_code: 200,
    body: '{"message": "ok"}',
    delay: 0,
  })
  const [showLogs, setShowLogs] = useState(false)
  const [mockLogs, setMockLogs] = useState<any[]>([])

  useEffect(() => {
    loadMockRoutes()
  }, [])

  const handleCreateRoute = async () => {
    if (newRoute.path) {
      await api.createMockRoute(newRoute)
      setShowNewRoute(false)
      setNewRoute({ method: 'GET', path: '', status_code: 200, body: '{"message": "ok"}', delay: 0 })
      loadMockRoutes()
    }
  }

  const handleDeleteRoute = async (id: number) => {
    await api.deleteMockRoute(id)
    loadMockRoutes()
  }

  const handleToggleRoute = async (route: MockRoute) => {
    await api.updateMockRoute(route.id, { enabled: !route.enabled })
    loadMockRoutes()
  }

  const handleLoadLogs = async () => {
    const result = await api.getMockLogs(50)
    if (result.success) {
      setMockLogs(result.data)
      setShowLogs(true)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-dark-text">Mock 服务</h2>
            <p className="text-sm text-dark-text-secondary">
              本地 Mock 服务器，用于模拟 API 响应
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mockRunning ? 'danger' : 'primary'}
              onClick={toggleMockServer}
            >
              {mockRunning ? (
                <>
                  <Square size={14} className="mr-1" />
                  停止服务
                </>
              ) : (
                <>
                  <Play size={14} className="mr-1" />
                  启动服务
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={() => setShowNewRoute(true)}>
              <Plus size={14} className="mr-1" />
              新建路由
            </Button>
            <Button variant="ghost" onClick={handleLoadLogs}>
              查看日志
            </Button>
          </div>
        </div>

        {mockRunning && (
          <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
            <Server size={14} className="text-success" />
            <span className="text-sm text-success">
              Mock 服务运行中: http://127.0.0.1:{settings?.mock_port || 4567}
            </span>
          </div>
        )}
      </div>

      {/* 新建路由表单 */}
      {showNewRoute && (
        <div className="p-4 border-b border-dark-border bg-dark-card">
          <h3 className="text-sm font-medium text-dark-text mb-2">新建 Mock 路由</h3>
          <div className="grid grid-cols-4 gap-2">
            <select
              value={newRoute.method}
              onChange={(e) => setNewRoute({ ...newRoute, method: e.target.value })}
              className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded text-sm text-dark-text"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <Input
              value={newRoute.path}
              onChange={(e) => setNewRoute({ ...newRoute, path: e.target.value })}
              placeholder="/api/example"
            />
            <Input
              type="number"
              value={newRoute.status_code}
              onChange={(e) => setNewRoute({ ...newRoute, status_code: parseInt(e.target.value) })}
              placeholder="状态码"
            />
            <div className="flex gap-1">
              <Button onClick={handleCreateRoute}>创建</Button>
              <Button variant="ghost" onClick={() => setShowNewRoute(false)}>取消</Button>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <textarea
              value={newRoute.body}
              onChange={(e) => setNewRoute({ ...newRoute, body: e.target.value })}
              placeholder="响应体 JSON（支持模板变量：{{$timestamp}} {{$uuid}} {{$datetime}} {{$randomInt}}）"
              className="w-full h-20 px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text font-mono resize-none"
            />
            <div className="flex flex-col justify-end gap-1 min-w-[120px]">
              <label className="text-xs text-dark-text-secondary">延迟(ms)</label>
              <Input
                type="number"
                value={newRoute.delay}
                onChange={(e) => setNewRoute({ ...newRoute, delay: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* 日志面板 */}
      {showLogs && (
        <div className="border-b border-dark-border">
          <div className="flex items-center justify-between px-4 py-2 bg-dark-bg">
            <h3 className="text-sm font-medium text-dark-text">命中日志</h3>
            <button
              onClick={() => setShowLogs(false)}
              className="text-xs text-dark-text-secondary hover:text-dark-text"
            >
              关闭
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dark-border text-dark-text-secondary">
                  <th className="text-left py-1.5 px-4 font-medium">方法</th>
                  <th className="text-left py-1.5 px-4 font-medium">路径</th>
                  <th className="text-left py-1.5 px-4 font-medium">匹配</th>
                  <th className="text-left py-1.5 px-4 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {mockLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-dark-text-secondary">
                      暂无日志
                    </td>
                  </tr>
                ) : (
                  mockLogs.map((log, i) => (
                    <tr key={i} className="border-b border-dark-border/30 hover:bg-dark-card/50">
                      <td className={cn(
                        'py-1.5 px-4 font-mono',
                        log.method === 'GET' && 'text-success',
                        log.method === 'POST' && 'text-warning',
                        log.method === 'PUT' && 'text-info',
                        log.method === 'DELETE' && 'text-error',
                      )}>
                        {log.method}
                      </td>
                      <td className="py-1.5 px-4 font-mono text-dark-text">{log.path}</td>
                      <td className="py-1.5 px-4">
                        {log.matched ? (
                          <span className="text-success">✅</span>
                        ) : (
                          <span className="text-error">❌</span>
                        )}
                      </td>
                      <td className="py-1.5 px-4 text-dark-text-secondary">
                        {log.timestamp?.split('T')[1]?.split('.')[0] || log.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 路由列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {mockRoutes.length === 0 ? (
          <EmptyState message="暂无 Mock 路由" />
        ) : (
          <div className="space-y-2">
            {mockRoutes.map((route) => (
              <div
                key={route.id}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 bg-dark-card border border-dark-border rounded-lg',
                  !route.enabled && 'opacity-50'
                )}
              >
                <span
                  className={cn(
                    'font-mono font-bold text-xs',
                    route.method === 'GET' && 'text-success',
                    route.method === 'POST' && 'text-warning',
                    route.method === 'PUT' && 'text-info',
                    route.method === 'DELETE' && 'text-error'
                  )}
                >
                  {route.method}
                </span>

                <span className="flex-1 font-mono text-sm text-dark-text">
                  {route.path}
                </span>

                <span className="text-sm text-dark-text-secondary">
                  {route.status_code}
                </span>

                {route.delay > 0 && (
                  <span className="text-xs text-dark-text-secondary">
                    ⏱ {route.delay}ms
                  </span>
                )}

                <button
                  onClick={() => handleToggleRoute(route)}
                  className={cn(
                    'px-2 py-1 text-xs rounded',
                    route.enabled
                      ? 'bg-success/20 text-success'
                      : 'bg-dark-border text-dark-text-secondary'
                  )}
                >
                  {route.enabled ? '启用' : '禁用'}
                </button>

                <button
                  onClick={() => handleDeleteRoute(route.id)}
                  className="p-1 hover:bg-dark-border rounded"
                >
                  <Trash2 size={14} className="text-error" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
