// 请求头编辑器

import React from 'react'
import { RequestHeader } from '@/shared/types'
import { Button, Input } from '@/shared/ui'
import { Plus, Trash2 } from 'lucide-react'

// 常用 Header 提示
const COMMON_HEADERS = [
  'Content-Type',
  'Authorization',
  'Accept',
  'User-Agent',
  'Cache-Control',
  'Cookie',
  'Origin',
  'Referer',
  'X-Requested-With',
]

interface HeadersEditorProps {
  headers: RequestHeader[]
  onChange: (headers: RequestHeader[]) => void
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const addHeader = () => {
    onChange([...headers, { key: '', value: '', enabled: true, description: '' }])
  }

  const updateHeader = (index: number, field: keyof RequestHeader, value: any) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    onChange(newHeaders)
  }

  const removeHeader = (index: number) => {
    onChange(headers.filter((_, i) => i !== index))
  }

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-dark-text-secondary">请求头</span>
        <Button size="sm" variant="ghost" onClick={addHeader}>
          <Plus size={14} className="mr-1" />
          添加请求头
        </Button>
      </div>

      {headers.length === 0 ? (
        <p className="text-sm text-dark-text-secondary text-center py-4">
          暂无请求头
        </p>
      ) : (
        <div className="space-y-2">
          {headers.map((header, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.enabled}
                onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded border-dark-border"
              />
              <div className="flex-1 relative">
                <Input
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Header 名称"
                  list="common-headers"
                />
              </div>
              <Input
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                placeholder="Header 值"
                className="flex-1"
              />
              <Input
                value={header.description || ''}
                onChange={(e) => updateHeader(index, 'description', e.target.value)}
                placeholder="描述"
                className="flex-1"
              />
              <button
                onClick={() => removeHeader(index)}
                className="p-1 hover:bg-dark-card rounded"
              >
                <Trash2 size={14} className="text-error" />
              </button>
            </div>
          ))}
        </div>
      )}

      <datalist id="common-headers">
        {COMMON_HEADERS.map((h) => (
          <option key={h} value={h} />
        ))}
      </datalist>
    </div>
  )
}
