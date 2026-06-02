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
  })

  useEffect(() => {
    loadMockRoutes()
  }, [])

  const handleCreateRoute = async () => {
    if (newRoute.path) {
      await api.createMockRoute(newRoute)
      setShowNewRoute(false)
      setNewRoute({ method: 'GET', path: '', status_code: 200, body: '{"message": "ok"}' })
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
          <div className="mt-2">
            <textarea
              value={newRoute.body}
              onChange={(e) => setNewRoute({ ...newRoute, body: e.target.value })}
              placeholder="响应体 JSON"
              className="w-full h-20 px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text font-mono resize-none"
            />
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
