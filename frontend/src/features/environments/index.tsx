// 环境变量管理页面

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/shared/store'
import { Button, Input, EmptyState } from '@/shared/ui'
import { Plus, Trash2, Edit, Check, X, Globe } from 'lucide-react'
import { cn } from '@/shared/utils'
import { VariableItem } from '@/shared/types'
import * as api from '@/shared/api'

export function EnvironmentsPage() {
  const {
    environments,
    currentEnvironment,
    loadEnvironments,
    switchEnvironment,
  } = useAppStore()

  const [showNewEnv, setShowNewEnv] = useState(false)
  const [newEnvName, setNewEnvName] = useState('')
  const [editingEnv, setEditingEnv] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  // 变量编辑状态
  const [selectedEnv, setSelectedEnv] = useState<number | null>(null)
  const [variables, setVariables] = useState<VariableItem[]>([])
  const [newVar, setNewVar] = useState({ key: '', value: '', description: '' })

  useEffect(() => {
    loadEnvironments()
  }, [])

  useEffect(() => {
    if (currentEnvironment) {
      setSelectedEnv(currentEnvironment.id)
      loadVariables(currentEnvironment.id)
    }
  }, [currentEnvironment])

  const loadVariables = async (envId: number) => {
    const env = environments.find((e) => e.id === envId)
    if (env) {
      setVariables(env.variables || [])
    }
  }

  const handleCreateEnv = async () => {
    if (newEnvName.trim()) {
      await api.createEnvironment(newEnvName.trim())
      setNewEnvName('')
      setShowNewEnv(false)
      loadEnvironments()
    }
  }

  const handleDeleteEnv = async (id: number) => {
    await api.deleteEnvironment(id)
    loadEnvironments()
  }

  const handleSwitchEnv = async (id: number) => {
    await switchEnvironment(id)
  }

  const handleAddVariable = async () => {
    if (selectedEnv && newVar.key) {
      await api.createVariable(selectedEnv, {
        ...newVar,
        enabled: true,
        is_global: false,
      })
      setNewVar({ key: '', value: '', description: '' })
      loadEnvironments()
      loadVariables(selectedEnv)
    }
  }

  const handleUpdateVariable = async (varId: number, data: Partial<VariableItem>) => {
    await api.updateVariable(varId, data)
    if (selectedEnv) {
      loadVariables(selectedEnv)
    }
    loadEnvironments()
  }

  const handleDeleteVariable = async (varId: number) => {
    await api.deleteVariable(varId)
    if (selectedEnv) {
      loadVariables(selectedEnv)
    }
    loadEnvironments()
  }

  return (
    <div className="flex h-full">
      {/* 左侧环境列表 */}
      <div className="w-64 border-r border-dark-border flex flex-col">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-dark-text">环境列表</h2>
            <Button size="sm" variant="ghost" onClick={() => setShowNewEnv(true)}>
              <Plus size={14} />
            </Button>
          </div>

          {showNewEnv && (
            <div className="flex gap-1">
              <Input
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                placeholder="环境名称"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateEnv()
                  if (e.key === 'Escape') setShowNewEnv(false)
                }}
              />
              <Button size="sm" onClick={handleCreateEnv}>创建</Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {environments.map((env) => (
            <div
              key={env.id}
              onClick={() => {
                setSelectedEnv(env.id)
                loadVariables(env.id)
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded cursor-pointer group',
                selectedEnv === env.id ? 'bg-dark-card' : 'hover:bg-dark-card/50'
              )}
            >
              <Globe size={14} className={env.is_current ? 'text-primary' : 'text-dark-text-secondary'} />
              <span className="flex-1 text-sm text-dark-text">{env.name}</span>
              {env.is_current && (
                <span className="text-xs text-primary">当前</span>
              )}
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSwitchEnv(env.id)
                  }}
                  className="p-1 hover:bg-dark-border rounded"
                  title="切换为当前环境"
                >
                  <Check size={12} className="text-success" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteEnv(env.id)
                  }}
                  className="p-1 hover:bg-dark-border rounded"
                  title="删除"
                >
                  <Trash2 size={12} className="text-error" />
                </button>
              </div>
            </div>
          ))}

          {environments.length === 0 && (
            <EmptyState message="暂无环境，点击 + 创建" />
          )}
        </div>
      </div>

      {/* 右侧变量编辑 */}
      <div className="flex-1 flex flex-col">
        {selectedEnv ? (
          <>
            <div className="p-4 border-b border-dark-border">
              <h2 className="text-sm font-medium text-dark-text mb-2">变量列表</h2>
              <div className="flex gap-2">
                <Input
                  value={newVar.key}
                  onChange={(e) => setNewVar({ ...newVar, key: e.target.value })}
                  placeholder="变量名"
                  className="flex-1"
                />
                <Input
                  value={newVar.value}
                  onChange={(e) => setNewVar({ ...newVar, value: e.target.value })}
                  placeholder="变量值"
                  className="flex-1"
                />
                <Input
                  value={newVar.description}
                  onChange={(e) => setNewVar({ ...newVar, description: e.target.value })}
                  placeholder="描述"
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddVariable}>添加</Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {variables.length === 0 ? (
                <EmptyState message="暂无变量" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left py-2 text-dark-text-secondary font-medium w-8">启用</th>
                      <th className="text-left py-2 text-dark-text-secondary font-medium">变量名</th>
                      <th className="text-left py-2 text-dark-text-secondary font-medium">变量值</th>
                      <th className="text-left py-2 text-dark-text-secondary font-medium">描述</th>
                      <th className="text-left py-2 text-dark-text-secondary font-medium w-16">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variables.map((v) => (
                      <tr key={v.id} className="border-b border-dark-border/50">
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={v.enabled}
                            onChange={(e) => handleUpdateVariable(v.id, { enabled: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="py-2 font-mono text-primary">{v.key}</td>
                        <td className="py-2 font-mono text-dark-text">{v.value}</td>
                        <td className="py-2 text-dark-text-secondary">{v.description}</td>
                        <td className="py-2">
                          <button
                            onClick={() => handleDeleteVariable(v.id)}
                            className="p-1 hover:bg-dark-card rounded"
                          >
                            <Trash2 size={14} className="text-error" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <EmptyState message="选择一个环境查看变量" />
        )}
      </div>
    </div>
  )
}
