// 请求体编辑器

import { useState } from 'react'
import { RequestBody } from '@/shared/types'
import { Button, Input, Select } from '@/shared/ui'
import { CodeEditor } from '@/shared/ui/CodeEditor'
import { Plus, Trash2 } from 'lucide-react'
import { formatJson } from '@/shared/utils'

interface BodyEditorProps {
  body: RequestBody
  onChange: (body: RequestBody) => void
}

const BODY_TYPES = [
  { value: 'none', label: 'none' },
  { value: 'json', label: 'JSON' },
  { value: 'raw', label: 'raw' },
  { value: 'form_data', label: 'form-data' },
  { value: 'urlencoded', label: 'x-www-form-urlencoded' },
]

export function BodyEditor({ body, onChange }: BodyEditorProps) {
  const [jsonError, setJsonError] = useState<string | null>(null)

  const updateType = (type: string) => {
    onChange({ ...body, type: type as any })
  }

  const handleFormatJson = () => {
    if (body.json_data) {
      const { formatted, error } = formatJson(JSON.stringify(body.json_data))
      if (!error) {
        onChange({ ...body, json_data: JSON.parse(formatted) })
        setJsonError(null)
      } else {
        setJsonError(error)
      }
    }
  }

  const handleCompressJson = () => {
    if (body.json_data) {
      const compressed = JSON.stringify(body.json_data)
      onChange({ ...body, json_data: JSON.parse(compressed) })
      setJsonError(null)
    }
  }

  const handleRawChange = (value: string | undefined) => {
    onChange({ ...body, raw: value || '' })
  }

  const handleJsonChange = (value: string | undefined) => {
    if (!value) {
      onChange({ ...body, json_data: null, raw: '' })
      return
    }
    try {
      const parsed = JSON.parse(value)
      onChange({ ...body, json_data: parsed })
      setJsonError(null)
    } catch (e: any) {
      setJsonError(e.message)
      onChange({ ...body, raw: value })
    }
  }

  const addFormItem = (type: 'form_data' | 'urlencoded') => {
    const items = body[type] || []
    onChange({
      ...body,
      [type]: [...items, { key: '', value: '', enabled: true }],
    })
  }

  const updateFormItem = (type: 'form_data' | 'urlencoded', index: number, field: string, value: any) => {
    const items = [...(body[type] || [])]
    items[index] = { ...items[index], [field]: value }
    onChange({ ...body, [type]: items })
  }

  const removeFormItem = (type: 'form_data' | 'urlencoded', index: number) => {
    const items = (body[type] || []).filter((_: any, i: number) => i !== index)
    onChange({ ...body, [type]: items })
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Select
          label="请求体类型"
          options={BODY_TYPES}
          value={body.type}
          onChange={(e) => updateType(e.target.value)}
        />
      </div>

      {body.type === 'none' && (
        <p className="text-sm text-dark-text-secondary text-center py-4">
          该请求不包含请求体
        </p>
      )}

      {body.type === 'json' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-text-secondary">JSON 数据</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleFormatJson}>
                格式化
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCompressJson}>
                压缩
              </Button>
            </div>
          </div>
          <CodeEditor
            value={body.json_data ? JSON.stringify(body.json_data, null, 2) : ''}
            onChange={handleJsonChange}
            language="json"
            height="200px"
          />
          {jsonError && (
            <p className="mt-1 text-xs text-error">JSON 格式错误: {jsonError}</p>
          )}
        </div>
      )}

      {body.type === 'raw' && (
        <div>
          <span className="text-xs text-dark-text-secondary">原始数据</span>
          <CodeEditor
            value={body.raw}
            onChange={handleRawChange}
            language="plaintext"
            height="200px"
          />
        </div>
      )}

      {(body.type === 'form_data' || body.type === 'urlencoded') && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-text-secondary">
              {body.type === 'form_data' ? 'Form Data' : 'URL Encoded'}
            </span>
            <Button size="sm" variant="ghost" onClick={() => addFormItem(body.type as any)}>
              <Plus size={14} className="mr-1" />
              添加
            </Button>
          </div>

          <div className="space-y-2">
            {(body.type === 'form_data' ? body.form_data : body.urlencoded).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => updateFormItem(body.type as any, index, 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <Input
                  value={item.key}
                  onChange={(e) => updateFormItem(body.type as any, index, 'key', e.target.value)}
                  placeholder="键"
                  className="flex-1"
                />
                <Input
                  value={item.value}
                  onChange={(e) => updateFormItem(body.type as any, index, 'value', e.target.value)}
                  placeholder="值"
                  className="flex-1"
                />
                <button
                  onClick={() => removeFormItem(body.type as any, index)}
                  className="p-1 hover:bg-dark-card rounded"
                >
                  <Trash2 size={14} className="text-error" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
