// 参数编辑器

import React from 'react'
import { RequestParam } from '@/shared/types'
import { Button, Input } from '@/shared/ui'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/shared/utils'

interface ParamsEditorProps {
  params: RequestParam[]
  onChange: (params: RequestParam[]) => void
}

export function ParamsEditor({ params, onChange }: ParamsEditorProps) {
  const addParam = () => {
    onChange([...params, { key: '', value: '', enabled: true, description: '' }])
  }

  const updateParam = (index: number, field: keyof RequestParam, value: any) => {
    const newParams = [...params]
    newParams[index] = { ...newParams[index], [field]: value }
    onChange(newParams)
  }

  const removeParam = (index: number) => {
    onChange(params.filter((_, i) => i !== index))
  }

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-dark-text-secondary">查询参数</span>
        <Button size="sm" variant="ghost" onClick={addParam}>
          <Plus size={14} className="mr-1" />
          添加参数
        </Button>
      </div>

      {params.length === 0 ? (
        <p className="text-sm text-dark-text-secondary text-center py-4">
          暂无查询参数
        </p>
      ) : (
        <div className="space-y-2">
          {params.map((param, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={param.enabled}
                onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded border-dark-border"
              />
              <Input
                value={param.key}
                onChange={(e) => updateParam(index, 'key', e.target.value)}
                placeholder="参数名"
                className="flex-1"
              />
              <Input
                value={param.value}
                onChange={(e) => updateParam(index, 'value', e.target.value)}
                placeholder="参数值"
                className="flex-1"
              />
              <Input
                value={param.description || ''}
                onChange={(e) => updateParam(index, 'description', e.target.value)}
                placeholder="描述"
                className="flex-1"
              />
              <button
                onClick={() => removeParam(index)}
                className="p-1 hover:bg-dark-card rounded"
              >
                <Trash2 size={14} className="text-error" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
