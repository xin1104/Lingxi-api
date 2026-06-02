// 认证编辑器

import React from 'react'
import { AuthConfig } from '@/shared/types'
import { Input, Select } from '@/shared/ui'

interface AuthEditorProps {
  auth: AuthConfig
  onChange: (auth: AuthConfig) => void
}

const AUTH_TYPES = [
  { value: 'none', label: '无认证' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api_key', label: 'API Key' },
  { value: 'custom', label: '自定义 Header' },
]

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
  const updateField = (field: keyof AuthConfig, value: string) => {
    onChange({ ...auth, [field]: value })
  }

  return (
    <div className="p-4 space-y-4">
      <Select
        label="认证类型"
        options={AUTH_TYPES}
        value={auth.type}
        onChange={(e) => updateField('type', e.target.value)}
      />

      {auth.type === 'bearer' && (
        <Input
          label="Token"
          value={auth.token}
          onChange={(e) => updateField('token', e.target.value)}
          placeholder="输入 Bearer Token"
        />
      )}

      {auth.type === 'basic' && (
        <>
          <Input
            label="用户名"
            value={auth.username}
            onChange={(e) => updateField('username', e.target.value)}
            placeholder="用户名"
          />
          <Input
            label="密码"
            type="password"
            value={auth.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="密码"
          />
        </>
      )}

      {auth.type === 'api_key' && (
        <>
          <Input
            label="Header 名称"
            value={auth.api_key_header}
            onChange={(e) => updateField('api_key_header', e.target.value)}
            placeholder="Authorization"
          />
          <Input
            label="API Key"
            value={auth.api_key}
            onChange={(e) => updateField('api_key', e.target.value)}
            placeholder="输入 API Key"
          />
        </>
      )}

      {auth.type === 'custom' && (
        <>
          <Input
            label="Header 名称"
            value={auth.custom_header}
            onChange={(e) => updateField('custom_header', e.target.value)}
            placeholder="自定义 Header"
          />
          <Input
            label="Header 值"
            value={auth.custom_value}
            onChange={(e) => updateField('custom_value', e.target.value)}
            placeholder="Header 值"
          />
        </>
      )}
    </div>
  )
}
