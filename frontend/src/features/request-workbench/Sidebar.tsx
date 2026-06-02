// 左侧边栏组件

import React, { useEffect } from 'react'
import { useAppStore } from '@/shared/store'
import { cn } from '@/shared/utils'
import {
  FolderOpen,
  Globe,
  Clock,
  Server,
  Import,
  Camera,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const {
    activeSidebar,
    setActiveSidebar,
    collections,
    loadCollections,
    collectionRequests,
    loadCollectionRequests,
    createCollection,
    deleteCollection,
    loadRequest,
  } = useAppStore()

  const [expandedCollections, setExpandedCollections] = React.useState<Set<number>>(new Set())
  const [showNewCollection, setShowNewCollection] = React.useState(false)
  const [newCollectionName, setNewCollectionName] = React.useState('')

  useEffect(() => {
    loadCollections()
  }, [])

  const toggleCollection = (id: number) => {
    const newSet = new Set(expandedCollections)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
      loadCollectionRequests(id)
    }
    setExpandedCollections(newSet)
  }

  const handleCreateCollection = async () => {
    if (newCollectionName.trim()) {
      await createCollection(newCollectionName.trim())
      setNewCollectionName('')
      setShowNewCollection(false)
    }
  }

  const menuItems = [
    { key: 'collections', label: '接口集合', icon: FolderOpen },
    { key: 'environments', label: '环境变量', icon: Globe },
    { key: 'history', label: '请求历史', icon: Clock },
    { key: 'mock', label: 'Mock 服务', icon: Server },
    { key: 'import-export', label: '导入导出', icon: Import },
    { key: 'capture', label: '请求捕获', icon: Camera },
    { key: 'settings', label: '设置', icon: Settings },
  ] as const

  return (
    <div className={cn('flex flex-col h-full bg-dark-panel border-r border-dark-border', className)}>
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-dark-border">
        <h1 className="text-lg font-bold text-primary">灵犀 API</h1>
        <p className="text-xs text-dark-text-secondary">本地 API 调试客户端</p>
      </div>

      {/* 菜单 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveSidebar(item.key)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
              activeSidebar === item.key
                ? 'bg-dark-card text-primary'
                : 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-card/50'
            )}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 集合树（当选择集合时显示） */}
      {activeSidebar === 'collections' && (
        <div className="flex-1 overflow-y-auto border-t border-dark-border">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-medium text-dark-text-secondary">集合列表</span>
              <button
                onClick={() => setShowNewCollection(true)}
                className="p-1 hover:bg-dark-card rounded"
              >
                <Plus size={14} className="text-dark-text-secondary" />
              </button>
            </div>

            {showNewCollection && (
              <div className="flex gap-1 px-2 py-1">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="集合名称"
                  className="flex-1 px-2 py-1 text-xs bg-dark-card border border-dark-border rounded"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCollection()
                    if (e.key === 'Escape') setShowNewCollection(false)
                  }}
                />
                <button
                  onClick={handleCreateCollection}
                  className="px-2 py-1 text-xs bg-primary text-white rounded"
                >
                  创建
                </button>
              </div>
            )}

            {collections.map((collection) => (
              <div key={collection.id} className="mb-1">
                <div
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-dark-card rounded cursor-pointer group"
                  onClick={() => toggleCollection(collection.id)}
                >
                  {expandedCollections.has(collection.id) ? (
                    <ChevronDown size={14} className="text-dark-text-secondary" />
                  ) : (
                    <ChevronRight size={14} className="text-dark-text-secondary" />
                  )}
                  <FolderOpen size={14} className="text-warning" />
                  <span className="text-sm text-dark-text flex-1 truncate">{collection.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCollection(collection.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dark-border rounded"
                  >
                    <Trash2 size={12} className="text-error" />
                  </button>
                </div>

                {expandedCollections.has(collection.id) && collectionRequests[collection.id] && (
                  <div className="ml-6">
                    {collectionRequests[collection.id].map((request) => (
                      <div
                        key={request.id}
                        onClick={() => loadRequest(request)}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-dark-card rounded cursor-pointer"
                      >
                        <span
                          className={cn(
                            'text-xs font-mono',
                            request.method === 'GET' && 'text-success',
                            request.method === 'POST' && 'text-warning',
                            request.method === 'PUT' && 'text-info',
                            request.method === 'DELETE' && 'text-error'
                          )}
                        >
                          {request.method}
                        </span>
                        <span className="text-sm text-dark-text truncate">{request.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {collections.length === 0 && (
              <p className="text-xs text-dark-text-secondary px-2 py-4 text-center">
                暂无集合，点击 + 创建
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
